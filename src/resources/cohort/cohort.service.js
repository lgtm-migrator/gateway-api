import { v4 as uuidv4 } from 'uuid';
import { Data } from '../tool/data.model';
import { filtersService } from '../filters/dependency';

const createMode = {
	new: 'createNew',
	minor: 'minorVersion',
	major: 'majorVersion',
};
export default class CohortService {
	constructor(cohortRepository) {
		this.cohortRepository = cohortRepository;
	}

	getCohort(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.cohortRepository.getCohort(query, options);
	}

	getCohorts(query = {}) {
		return this.cohortRepository.getCohorts(query);
	}

	async addCohort(body = {}) {
		// 1. Generate uuid for Cohort PID
		let uuid = '';
		while (uuid === '') {
			uuid = uuidv4();
			if ((await this.cohortRepository.getCohorts({ pid: uuid })).length > 0) uuid = '';
		}
		// 2. Generate uniqueId for Cohort so we can differentiate between versions
		let uniqueId = '';
		while (uniqueId === '') {
			uniqueId = parseInt(Math.random().toString().replace('0.', ''));
			if ((await this.cohortRepository.getCohorts({ id: uniqueId }).length) > 0) uniqueId = '';
		}

		// 3. Extract PIDs from cohort object so we can build up related objects
		let datasetIdentifiersPromises = await body.cohort.input.collections.map(async collection => {
			let dataset = await Data.findOne({ pid: collection.external_id, activeflag: 'active' }, { datasetid: 1 }).lean();
			return { pid: collection.external_id, datasetId: dataset.datasetid };
		});
		let datasetIdentifiers = await Promise.all(datasetIdentifiersPromises);
		let relatedObjects = [];
		let datasetPids = [];
		datasetIdentifiers.forEach(datasetIdentifier => {
			datasetPids.push(datasetIdentifier.pid);
			relatedObjects.push({
				objectType: 'dataset',
				pid: datasetIdentifier.pid,
				objectId: datasetIdentifier.datasetId,
				isLocked: true,
			});
		});

		// 4. Extract filter criteria used in query
		let filterCriteria = [];
		body.cohort.input.cohorts.forEach(cohort => {
			cohort.groups.forEach(group => {
				group.rules.forEach(rule => {
					filterCriteria.push(rule.value);
				});
			});
		});

		// 5. Extract result counts
		const countsPerDataset = body.cohort.result.counts.map((item, i) => {
			const { pid, count } = Object.assign(
				{ pid: body.cohort.input.collections[i].external_id, count: item.count },
				item,
				body.cohort.input.collections[i]
			);
			return { pid, count };
		});

		const totalResultCount = countsPerDataset.reduce((a, curr) => a + parseInt(curr.count), 0);
		const numberOfDatasets = countsPerDataset.length;

		// 6. Build document object and save to DB
		const document = {
			id: uniqueId,
			pid: uuid,
			type: 'cohort',
			name: body.description,
			activeflag: 'draft',
			userId: body.user_id,
			uploaders: [parseInt(body.user_id)],
			updatedAt: Date.now(),
			lastRefresh: Date.now(),
			request_id: body.request_id,
			cohort: body.cohort,
			items: body.items,
			rquestRelatedObjects: body.relatedObjects,
			datasetPids,
			filterCriteria,
			relatedObjects,
			description: '',
			publicflag: true,
			totalResultCount,
			numberOfDatasets,
			countsPerDataset,
		};
		return this.cohortRepository.addCohort(document);
	}

	async editCohort(id, body = {}) {
		let editedCohort;
		if (body.activeflag === 'active') {
			if (body.createMode === createMode.minor) {
				// Minor version updates require creating a new document
				editedCohort = await this.createMinorVersion(id, body);
			} else if (body.createMode === createMode.major || body.createMode === createMode.new) {
				// New Cohorts and Major version updates require updating an existing draft document.
				editedCohort = await this.initializeDraftCohort(body, id);
			} else {
				editedCohort = await this.unarchiveCohort(id);
			}
		} else if (body.activeflag === 'archive') {
			editedCohort = await this.cohortRepository.editCohort({ id }, { activeflag: 'archive' });
		}
		await filtersService.optimiseFilters('cohort');
		return editedCohort;
	}

	async createMinorVersion(id, body) {
		// 1. Generate uniqueId for Cohort so we can differentiate between versions
		let uniqueId = '';
		while (uniqueId === '') {
			uniqueId = parseInt(Math.random().toString().replace('0.', ''));
			if ((await this.cohortRepository.getCohorts({ id: uniqueId }).length) > 0) uniqueId = '';
		}
		// 2. Build document object for the new cohort
		const previousVersion = await this.cohortRepository.getCohort({ id });
		const document = {
			id: uniqueId,
			changeLog: body.changeLog,
			name: body.name,
			description: body.description,
			uploaders: body.uploaders,
			publicflag: body.publicflag,
			relatedObjects: body.relatedObjects,
			activeflag: body.activeflag,
			updatedon: body.updatedon,
			version: this.getIncrementedVersionNumber(body.createMode, previousVersion),
			cohort: previousVersion.cohort,
			request_id: previousVersion.request_id,
			pid: previousVersion.pid,
			countsPerDataset: previousVersion.countsPerDataset,
			datasetPids: previousVersion.datasetPids,
			filterCriteria: previousVersion.filterCriteria,
			totalResultCount: previousVersion.totalResultCount,
			numberOfDatasets: previousVersion.numberOfDatasets,
		};
		// 3. Create the new cohort
		const editedCohort = await this.cohortRepository.addCohort(document);

		// 4. Set the previous active version to archived_version
		if (editedCohort) await this.cohortRepository.editCohort({ id: previousVersion.id }, { activeflag: 'archived_version' });
		return editedCohort;
	}

	async initializeDraftCohort(body, id) {
		// 1. Get Pid and version of cohort we are creating a new version for (Major version only)
		let previousCohortId, previousVersion;
		if (body.createMode === createMode.major) {
			previousCohortId = body.selectedCohort;
			previousVersion = await this.cohortRepository.getCohort({ id: previousCohortId }, { lean: true, fields: 'id,pid,version' });
		}
		// 2. Create the new version
		const document = {
			changeLog: body.changeLog,
			name: body.name,
			description: body.description,
			uploaders: body.uploaders,
			publicflag: body.publicflag,
			relatedObjects: body.relatedObjects,
			activeflag: body.activeflag,
			updatedon: body.updatedon,
			pid: body.createMode === createMode.major ? previousVersion.pid : body.pid,
			version: this.getIncrementedVersionNumber(body.createMode, previousVersion),
		};
		// 3. Update the draft to be active
		const editedCohort = await this.cohortRepository.editCohort({ id }, document);

		// 4. Set any previous active version to archived_version
		if (editedCohort && previousCohortId)
			await this.cohortRepository.editCohort({ id: previousCohortId }, { activeflag: 'archived_version' });
		return editedCohort;
	}

	async unarchiveCohort(id) {
		// 1. Check there are no other active cohorts for this pid
		const cohort = await this.cohortRepository.getCohort({ id });
		const activeCohort = await this.cohortRepository.getCohorts({ pid: cohort.pid, activeflag: 'active' });
		// 2. Unarchive (set to active) the cohort
		if (activeCohort && activeCohort.length > 0) throw Error('An active cohort with this PID already exists.');

		const editedCohort = await this.cohortRepository.editCohort({ id }, { activeflag: 'active' });
		return editedCohort;
	}

	getIncrementedVersionNumber(incrementType, currentVersion) {
		switch (incrementType) {
			case createMode.new:
				return 1.0;
			case createMode.minor:
				return currentVersion.version + 0.1;
			case createMode.major:
				return (Math.floor(currentVersion.version) + 1).toFixed(1);
		}
	}
}

import _ from 'lodash';
import { Dataset } from './dataset.model';

export default class DatasetService {
	constructor(datasetRepository, paperRepository, projectRepository, toolRepository, courseRepository) {
		this.datasetRepository = datasetRepository;
		this.paperRepository = paperRepository;
		this.projectRepository = projectRepository;
		this.toolRepository = toolRepository;
		this.courseRepository = courseRepository;
	}

	async getDataset(id, query = {}, options = {}) {
		// Protect for no id passed
		if(!id) return;

		// Get dataset from Db by datasetid first
		query = { ...query, datasetid: id };
		let dataset = await this.datasetRepository.getDataset(query, options);

		// Return undefined if no dataset found
		if (!dataset) return;

		// Populate derived fields
		dataset.revisions = await this.datasetRepository.getDatasetRevisions(dataset.pid);
		dataset.relatedObjects = await this.getRelatedObjects(dataset.pid);
		dataset.isLatestVersion = dataset.checkLatestVersion();

		// Return v2 format for datasets if 'raw' isn't passed
		if (!query['raw']) {
			// Transform to dataset v2 data structure
			let v2Response = dataset.toV2Format();
			// Temporary step of reformatting technical details until cache updated
			v2Response.dataset = this.reformatTechnicalDetails(v2Response.dataset);
			// Set full response
			dataset = v2Response;
		}
		return dataset;
	}

	async getDatasets(query = {}, options = {} ) {
		return this.datasetRepository.getDatasets(query, options);
	}

	async getRelatedObjects(pid) {
		if (!pid) {
			return {};
		}

		// Build query to find objects related to this pid
		const query = {
			relatedObjects: {
				$elemMatch: {
					pid,
				},
			},
			activeflag: 'active',
			fields: 'id, type, relatedObjects',
		};

		// Set query to be lean for performance optimisation
		const lean = true;

		// Run query on each entity repository
		const relatedEntities = await Promise.all([
			this.paperRepository.find(query, { lean }),
			this.toolRepository.find(query, { lean }),
			this.projectRepository.find(query, { lean }),
			this.courseRepository.find(query, { lean })
		]);

		// Flatten and reduce related entities into related objects
		const relatedObjects = relatedEntities.flat().reduce((arr, entity) => {
			let { relatedObjects: entityRelatedObjects } = entity;
			entityRelatedObjects = entityRelatedObjects.filter(obj => obj.pid === pid);
			const formattedEntityRelatedObjects = entityRelatedObjects.map(obj => {
				return {
					objectId: entity.id,
					reason: obj.reason,
					objectType: entity.type,
					user: obj.user,
					updated: obj.updated,
				}
			});
			arr = [...arr, ...formattedEntityRelatedObjects];
			return arr;
		}, []);
		return relatedObjects;
	}

	 reformatTechnicalDetails (dataset) {
		// Return if no technical details found
		if (_.isNil(dataset.structuralMetadata) || _.isNil(dataset.structuralMetadata.dataClasses)) {
			return dataset;
		}
		// Convert mongoose array to regular array
		const dataClasses = Array.from([...dataset.structuralMetadata.dataClasses]) || [];
		// Map data classes array into correct format
		dataset.structuralMetadata.dataClasses = [...dataClasses].map(el => {
			const { id = '', description = '', label: name = '', elements = [] } = el;
			const dataElements = [...elements].map(dataEl => {
				const {
					id = '',
					description = '',
					label: name = '',
					dataType: { domainType: type = '' },
				} = dataEl;
				return { id, description, name, type };
			});
			return { id, description, name, dataElementsCount: dataElements.length || 0, dataElements };
		});
		return dataset;
	};

	// the function get as inputs a dataset instance and a query, and looking for the dataset on the db by the query.
	// if the dataset is in the db, the function will update the db with the dataset that the function holds.
	// if the dataset is not in the db, the function will insert it to the db.
	async replaceOrUpdateOne(dataset, query) {
		try {
			let res = await Dataset.find(query); 
			if (res.length > 1)
				throw new Error(`ERROR: Many objects returned with pid "${dataset.pid}". It means that there are many datasets in the DB with pid "${dataset.pid}". findByPid respond should return array with one object.`);	
			
			if (res.length === 0) {
				console.log(`saving dataset with pid ${dataset.pid}...`);
				res = await dataset.save();			
			} else if (res.length === 1 && res[0]._id) {
				dataset._id = res[0]._id // TODO: check this line
				console.log(`updating dataset with pid ${dataset.pid}...`);
				res = await Dataset.replaceOne(query, dataset);
			} else {
				throw new Error('Unexpected ERROR findByPid respond should return an array with one object.');
			}		
			return res;
		} catch (err) {
			console.error(err);
		}
	}
}
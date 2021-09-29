import { last, capitalize } from 'lodash';

import Entity from '../base/entity';
import constants from '../utilities/constants.util';

export default class DataRequestClass extends Entity {
	constructor(obj) {
		super();
		Object.assign(this, obj);
	}

	/**
	 * Get application/major version Ids
	 * @description Extracts all unique major version Ids relating to this access record instance i.e. ids for 1.0, 2.0, 3.0 ignoring minor versions
	 */
	getRelatedVersionIds() {
		const versionIds = [];
		// 1. Iterate through all versions in the tree
		for (const versionKey in this.versionTree) {
			const { applicationId, iterationId } = this.versionTree[versionKey];
			// 2. If not unique or represents a minor version then ignore

			if (!versionIds.some(v => v === applicationId) && !iterationId) {
				// 3. If unique, push id to array for return
				versionIds.push(applicationId);
			}
		}
		// 4. Return unique array
		return versionIds;
	}

	getInitialApplicationId() {
		return this.versionTree['1.0'].applicationId;
	}

	/**
	 * Get next major version increment available e.g. 2.0, 3.0
	 * @description Parses the access record instance version tree to find the next available major version
	 */
	findNextVersion() {
		const versions = [];

		for (const version in this.versionTree) {
			versions.push(parseInt(version));
		}

		versions.sort((a, b) => b - a);
		return versions[0] + 1;
	}

	/**
	 * Create a new major version e.g. 2.0, 3.0
	 * @description Increments the major version of this access record instance and assigns an updated version tree
	 */
	createMajorVersion(number) {
		this.majorVersion = number;
		this.versionTree = buildVersionTree(this);
	}

	/**
	 * Creates a new minor version provided an amendment iteration has been submitted since the last invocation
	 * @description Builds a new version tree for this application instance accomodating any new amendment iterations as minor versions (updates)
	 */
	createMinorVersion() {
		this.versionTree = buildVersionTree(this);
	}

	/**
	 * Marks a specific amendment iteration as submitted
	 * @description Targets an amendment iteration based on the index passed, and updates the submission details to the current date/time and submission by the user provided
	 */
	submitAmendmentIteration(index, userId) {
		this.amendmentIterations[index].dateSubmitted = new Date();
		this.amendmentIterations[index].submittedBy = userId;

		this.createMinorVersion();
	}

	getVersionById(versionId) {
		return Object.keys(this.versionTree).reduce((obj, key) => {
			if (
				this.versionTree[key].applicationId.toString() === versionId.toString() ||
				(this.versionTree[key].iterationId && this.versionTree[key].iterationId.toString() === versionId.toString())
			) {
				obj = this.versionTree[key];
			}
			return obj;
		}, {});
	}
}

/**
 * Builds and returns a version tree for an access record
 * @description Build a new version tree for an access record using the passed object's version property as the major version.
 * Therefore this must be incremented prior to calling this function if creating a new tree for a new major version.
 */
export const buildVersionTree = accessRecord => {
	// 1. Guard for invalid accessRecord
	if (!accessRecord) return {};

	// 2. Extract values required to build version tree, defaulting version to 1.0
	let {
		_id: applicationId,
		majorVersion,
		versionTree = {},
		amendmentIterations = [],
		applicationType = constants.submissionTypes.INITIAL,
		applicationStatus = constants.applicationStatuses.INPROGRESS,
		isShared = false,
	} = accessRecord;
	const versionKey = majorVersion ? majorVersion.toString() : '1.0';

	// 3. Reverse iterate through amendment iterations and construct minor versions
	let minorVersions = {};
	for (var i = 0; i < amendmentIterations.length; i++) {
		const isLatestMinorVersion = amendmentIterations[i] === last(amendmentIterations);
		const { _id: iterationId } = amendmentIterations[i];
		const versionNumber = `${versionKey}.${i + 1}`;
		minorVersions = {
			...minorVersions,
			[`${versionNumber}`]: {
				applicationId,
				iterationId,
				displayTitle: `Version ${versionNumber}${isLatestMinorVersion ? ' (latest)' : ''}`,
				detailedTitle: `Version ${versionNumber}${isLatestMinorVersion ? ' (latest)' : ''} | Update`,
				link: `/data-access-request/${applicationId}?version=${versionNumber}`,
			},
		};
	}

	// 4. Create latest major version
	const hasMinorVersions = amendmentIterations.length > 0;
	const isInitial = applicationType === constants.submissionTypes.INITIAL;
	const detailedTitle = `Version ${versionKey}.0${!hasMinorVersions && !isInitial ? ' (latest)' : ''}${
		isInitial ? '' : ` | ${capitalize(applicationType)}`
	}`;
	const majorVersionObj = {
		[`${versionKey}.0`]: {
			applicationId,
			displayTitle: `Version ${versionKey}.0${!hasMinorVersions && !isInitial ? ' (latest)' : ''}`,
			detailedTitle,
			link: `/data-access-request/${applicationId}?version=${versionKey}.0`,
			applicationType,
			applicationStatus,
			isShared,
		},
	};

	// 5. Assemble updated version tree
	Object.keys(versionTree).forEach(key => {
		versionTree[key].displayTitle = versionTree[key].displayTitle.replace(' (latest)', '');
		versionTree[key].detailedTitle = versionTree[key].detailedTitle.replace(' (latest)', '');
	});
	const latestVersions = { ...majorVersionObj, ...minorVersions };
	Object.keys(latestVersions).forEach(key => {
		if (!versionTree[key]) {
			versionTree[key] = latestVersions[key];
		}
	});

	return versionTree;
};

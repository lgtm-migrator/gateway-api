import Entity from '../base/entity';
import { isEmpty } from 'lodash';

export default class DataRequestClass extends Entity {
	constructor(obj) {
		super();
		Object.assign(this, obj);
	}

	/**
	 * Increment version
	 * @description Increments the major version of this access record instance and assigns an updated version tree
	 */
	incrementVersion = () => {
		this.version++;
		this.versionTree = buildVersionTree(this);
	};
}

/**
 * Builds and self assigns a version tree for this access record instance
 * @description Build a new version tree for an access record using the passed object's version property as the major version.
 * Therefore this must be incremented prior to calling this function if creating a new tree for a new major version.
 */
export const buildVersionTree = accessRecord => {
	// 1. Guard for invalid accessRecord
	if (!accessRecord) return {};
	// 2. Extract values required to build version tree, defaulting version to 1
	let { _id, version, versionTree = {}, amendmentIterations = [] } = accessRecord;
	let versionKey = version ? version.toString() : '1';
	// 3. Reverse iterate through amendment iterations and construct minor versions
	let minorVersions = {};
	for (let i = amendmentIterations.length; i > 0; i--) {
		minorVersions = {
			...minorVersions,
			[`${versionKey}.${i}`]: _id,
		};
	}
	// 4. Create latest major version
	let majorVersion = { [`${versionKey}`]: _id };
	// 5. Assemble version tree
	if (isEmpty(versionTree)) {
		versionTree = {
			...minorVersions,
			...majorVersion,
		};
	} else {
		versionTree = {
			...minorVersions,
			...majorVersion,
			...versionTree,
		};
	}
	// 6. Return tree
	return versionTree;
};

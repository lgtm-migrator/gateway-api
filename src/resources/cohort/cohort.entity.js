import Entity from '../base/entity';

export default class CohortClass extends Entity {
	constructor(obj) {
		super();
		Object.assign(this, obj);
	}
}

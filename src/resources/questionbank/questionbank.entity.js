import Entity from '../base/entity';

export default class QuestionbankClass extends Entity {
	constructor(obj) {
		super();
		Object.assign(this, obj);
	}
}

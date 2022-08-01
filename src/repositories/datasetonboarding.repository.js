import Repository from '../resources/base/repository';
import { Data } from '../resources/tool/data.model';

export default class DatasetOnboardingRepository extends Repository {
	constructor() {
		super(Data);
		this.data = Data;
	}
}

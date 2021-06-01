import Repository from '../../base/repository';
import { DataRequestModel } from '../datarequest.model';

export default class AmendmentRepository extends Repository {
	constructor() {
		super(DataRequestModel);
		this.dataRequestModel = DataRequestModel;
	}
}

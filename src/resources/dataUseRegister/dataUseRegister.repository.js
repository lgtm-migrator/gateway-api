import Repository from '../base/repository';
import { DataUseRegister } from './dataUseRegister.model';
import constants from '../utilities/constants.util';

export default class DataUseRegisterRepository extends Repository {
	constructor() {
		super(DataUseRegister);
		this.dataUseRegister = DataUseRegister;
	}

	async getDataUseRegister(query, options) {
		return this.findOne(query, options);
	}

	async getDataUseRegisters(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}

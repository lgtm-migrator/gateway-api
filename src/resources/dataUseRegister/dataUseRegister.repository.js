import Repository from '../base/repository';
import { DataUseRegister } from './dataUseRegister.model';

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

	async updateDataUseRegister(id, body) {
		return this.update(id, body);
	}
}

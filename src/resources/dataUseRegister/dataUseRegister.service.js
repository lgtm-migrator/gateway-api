export default class DataUseRegisterService {
	constructor(dataUseRegisterRepository) {
		this.dataUseRegisterRepository = dataUseRegisterRepository;
	}

	getDataUseRegister(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.dataUseRegisterRepository.getDataUseRegister(query, options);
	}

	getDataUseRegisters(query = {}) {
		return this.dataUseRegisterRepository.getDataUseRegisters(query);
	}

	updateDataUseRegister(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.dataUseRegisterRepository.update(query, options);
	}
}

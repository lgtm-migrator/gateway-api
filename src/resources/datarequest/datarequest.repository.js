import Repository from '../base/repository';
import { DataRequestModel } from './datarequest.model';

export default class DataRequestRepository extends Repository {
	constructor() {
		super(DataRequestModel);
		this.dataRequestModel = DataRequestModel;
	}

	async getAccessRequestsByUser(userId, query) {
		if (!userId) return [];

		return DataRequestModel.find({
			$and: [{ ...query }, { $or: [{ userId }, { authorIds: userId }] }],
		})
			.select('-jsonSchema -questionAnswers -files')
			.populate('datasets mainApplicant')
			.lean();
	}
}

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
			.populate([{ path: 'mainApplicant', select: 'firstname lastname -id' }, { path: 'datasets' }])
			.lean();
	}

	async getApplicationById(id) {
		return DataRequestModel.findOne({
			_id: id,
		})
			.populate([
				{ path: 'mainApplicant', select: 'firstname lastname -id' },
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
					},
				},
				{
					path: 'datasets dataset authors',
					populate: { path: 'publisher', populate: { path: 'team' } },
				},
				{ path: 'workflow.steps.reviewers', select: 'firstname lastname' },
				{ path: 'files.owner', select: 'firstname lastname' },
			])
			.lean();
	}

	async getApplicationToCloneById(id) {
		return DataRequestModel.findOne({ _id: id })
		.populate([
			{
				path: 'datasets dataset authors',
			},
			{
				path: 'mainApplicant',
			},
			{
				path: 'publisherObj',
				populate: {
					path: 'team',
					populate: {
						path: 'users',
					},
				},
			},
		])
		.lean();
	}
}

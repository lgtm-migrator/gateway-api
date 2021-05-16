import Repository from '../base/repository';
import { DataRequestModel } from './datarequest.model';

export default class DataRequestRepository extends Repository {
	constructor() {
		super(DataRequestModel);
		this.dataRequestModel = DataRequestModel;
	}

	getAccessRequestsByUser(userId, query) {
		if (!userId) return [];

		return DataRequestModel.find({
			$and: [{ ...query }, { $or: [{ userId }, { authorIds: userId }] }],
		})
			.select('-jsonSchema -questionAnswers -files')
			.populate([{ path: 'mainApplicant', select: 'firstname lastname -id' }, { path: 'datasets' }])
			.lean();
	}

	getApplicationById(id) {
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

	getApplicationWithTeamById(id, options = {}) {
		return DataRequestModel.findOne({ _id: id }, null, options).populate([
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
		]);
	}

	getApplicationWithWorkflowById(id, options = {}) {
		return DataRequestModel.findOne({ _id: id }, null, options).populate([
			{
				path: 'publisherObj',
				populate: {
					path: 'team',
					populate: {
						path: 'users',
					},
				},
			},
			{
				path: 'workflow.steps.reviewers',
				select: 'firstname lastname id email',
			},
			{
				path: 'datasets dataset',
			},
			{
				path: 'mainApplicant',
			},
		]);
	}

	getApplicationToSubmitById(id) {
		return DataRequestModel.findOne({ _id: id }).populate([
			{
				path: 'datasets dataset',
				populate: {
					path: 'publisher',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
							populate: {
								path: 'additionalInfo',
							},
						},
					},
				},
			},
			{
				path: 'mainApplicant authors',
				populate: {
					path: 'additionalInfo',
				},
			},
			{
				path: 'publisherObj',
			},
		]);
	}

	getApplicationToUpdateById(id) {
		return DataRequestModel.findOne({
			_id: id,
		}).lean();
	}

	getFilesForApplicationById(id, options = {}) {
		return DataRequestModel.findById(id, { files: 1, applicationStatus: 1, userId: 1, authorIds: 1 }, options);
	}

	updateApplicationById(id, data, options = {}) {
		return DataRequestModel.findByIdAndUpdate(id, data, { ...options });
	}

	replaceApplicationById(id, newDoc) {
		return DataRequestModel.replaceOne({ _id: id }, newDoc);
	}

	deleteApplicationById(id) {
		return DataRequestModel.findOneAndDelete({ _id: id });
	}

	async saveFileUploadChanges(accessRecord) {
		await accessRecord.save();
		return DataRequestModel.populate(accessRecord, {
			path: 'files.owner',
			select: 'firstname lastname id',
		});
	}
}

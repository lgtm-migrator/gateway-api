import Repository from '../base/repository';
import { DataRequestModel } from './datarequest.model';
import { DataRequestSchemaModel } from './schema/datarequest.schemas.model';
import { Data as ToolModel } from '../tool/data.model';

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

	getApplicationByDatasets(datasetIds, applicationStatus, userId) {
		return DataRequestModel.findOne({
			datasetIds: { $all: datasetIds },
			userId,
			applicationStatus,
		})
			.populate([
				{
					path: 'mainApplicant',
					select: 'firstname lastname -id -_id',
				},
				{ path: 'files.owner', select: 'firstname lastname' },
			])
			.sort({ createdAt: 1 })
			.lean();
	}

	getApplicationWithTeamById(id, options = {}) {
		return DataRequestModel.findOne({ _id: id }, null, options).populate([ //lgtm [js/sql-injection]
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
				path: 'mainApplicant authors',
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

	getApplicationFormSchema(publisher) {
		return DataRequestSchemaModel.findOne({
			$or: [{ publisher }, { dataSetId: 'default' }],
			status: 'active',
		}).sort({ createdAt: -1 });
	}

	getDatasetsForApplicationByIds(datasetIds) {
		return ToolModel.find({
			datasetid: { $in: datasetIds },
		}).populate('publisher');
	}

	getApplicationForUpdateRequest(id) {
		return DataRequestModel.findOne({ _id: id })
			.select({
				_id: 1,
				publisher: 1,
				amendmentIterations: 1,
				datasetIds: 1,
				dataSetId: 1,
				userId: 1,
				authorIds: 1,
				applicationStatus: 1,
				aboutApplication: 1,
				dateSubmitted: 1,
			})
			.populate([
				{
					path: 'datasets dataset mainApplicant authors',
				},
				{
					path: 'publisherObj',
					select: '_id',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
			]);
	}

	updateApplicationById(id, data, options = {}) {
		return DataRequestModel.findByIdAndUpdate(id, data, { ...options }); //lgtm [js/sql-injection]
	}

	replaceApplicationById(id, newDoc) {
		return DataRequestModel.replaceOne({ _id: id }, newDoc);
	}

	deleteApplicationById(id) {
		return DataRequestModel.findOneAndDelete({ _id: id });
	}

	createApplication(data) {
		return DataRequestModel.create(data);
	}

	async saveFileUploadChanges(accessRecord) {
		await accessRecord.save();
		return DataRequestModel.populate(accessRecord, {
			path: 'files.owner',
			select: 'firstname lastname id',
		});
	}

	syncRelatedApplications(applicationIds, versionTree) {
		return DataRequestModel.updateMany({ _id: { $in: applicationIds }}, { $set: { versionTree }});
	}
}

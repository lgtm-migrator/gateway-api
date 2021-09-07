import Repository from '../base/repository';
import { DataRequestModel } from './datarequest.model';
import { DataRequestSchemaModel } from './schema/datarequest.schemas.model';
import { Data as ToolModel } from '../tool/data.model';

export default class DataRequestRepository extends Repository {
	constructor() {
		super(DataRequestModel);
		this.dataRequestModel = DataRequestModel;
	}

	static getAccessRequestsByUser(userId, query) {
		if (!userId) return [];

		return DataRequestModel.find({
			$and: [{ ...query }, { $or: [{ userId }, { authorIds: userId }] }],
		})
			.select('-jsonSchema -files')
			.populate([{ path: 'mainApplicant', select: 'firstname lastname -id' }, { path: 'datasets' }])
			.lean();
	}

	static getApplicationById(id) {
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

	static getApplicationByDatasets(datasetIds, applicationStatus, userId) {
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
			.sort({ createdAt: -1 })
			.lean();
	}

	static getApplicationWithTeamById(id, options = {}) {
		return DataRequestModel.findOne({ _id: { $eq: id } }, null, options).populate([
			//lgtm [js/sql-injection]
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

	static getApplicationWithWorkflowById(id, options = {}) {
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

	static getApplicationToSubmitById(id) {
		return DataRequestModel.findOne({ _id: id }).populate([
			{
				path: 'datasets dataset initialDatasets',
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

	static getApplicationToUpdateById(id) {
		return DataRequestModel.findOne({
			_id: id,
		}).lean();
	}

	static getFilesForApplicationById(id) {
		return DataRequestModel.findOne({
			_id: id,
		}).populate([
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
		]);
	}

	static getApplicationFormSchema(publisher) {
		return DataRequestSchemaModel.findOne({
			$or: [{ publisher }, { dataSetId: 'default' }],
			status: 'active',
		}).sort({ createdAt: -1 });
	}

	static getDatasetsForApplicationByIds(datasetIds) {
		return ToolModel.find({
			datasetid: { $in: datasetIds },
		}).populate('publisher');
	}

	static getApplicationForUpdateRequest(id) {
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

	static updateApplicationById(id, data, options = {}) {
		return DataRequestModel.findByIdAndUpdate(id, data, { ...options }); //lgtm [js/sql-injection]
	}

	static replaceApplicationById(id, newDoc) {
		return DataRequestModel.replaceOne({ _id: id }, newDoc);
	}

	static deleteApplicationById(id) {
		return DataRequestModel.findOneAndDelete({ _id: id });
	}

	static createApplication(data) {
		return DataRequestModel.create(data);
	}

	static async saveFileUploadChanges(accessRecord) {
		await accessRecord.save();
		return DataRequestModel.populate(accessRecord, {
			path: 'files.owner',
			select: 'firstname lastname id',
		});
	}

	static async syncRelatedVersions(versionIds, versionTree) {
		const majorVersions = await DataRequestModel.find().where('_id').in(versionIds).select({ versionTree: 1 });

		for (const version of majorVersions) {
			version.versionTree = versionTree;

			await version.save();
		}
	}

	static async updateFileStatus(versionIds, fileId, status) {
		const majorVersions = await DataRequestModel.find({ _id: { $in: [versionIds] } }).select({ files: 1 });

		for (const version of majorVersions) {
			const fileIndex = version.files.findIndex(file => file.fileId === fileId);

			if (fileIndex === -1) continue;

			version.files[fileIndex].status = status;

			await version.save();
		}
	}
}

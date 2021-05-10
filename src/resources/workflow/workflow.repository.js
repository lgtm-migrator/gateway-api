import Repository from '../base/repository';
import { WorkflowModel } from './workflow.model';

export default class WorkflowRepository extends Repository {
	constructor() {
		super(WorkflowModel);
		this.workflowModel = WorkflowModel;
	}

	// async getAccessRequestsByUser(userId, query) {
	// 	if (!userId) return [];

	// 	return DataRequestModel.find({
	// 		$and: [{ ...query }, { $or: [{ userId }, { authorIds: userId }] }],
	// 	})
	// 		.select('-jsonSchema -questionAnswers -files')
	// 		.populate('datasets mainApplicant')
	// 		.lean();
	// }
}

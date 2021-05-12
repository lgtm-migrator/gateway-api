import Repository from '../base/repository';
import { WorkflowModel } from './workflow.model';

export default class WorkflowRepository extends Repository {
	constructor() {
		super(WorkflowModel);
		this.workflowModel = WorkflowModel;
	}

	getWorkflowsByPublisher(id) {
		return WorkflowModel.find({
			publisher: id,
		}).populate([
			{
				path: 'publisher',
				select: 'team',
				populate: {
					path: 'team',
					select: 'members -_id',
				},
			},
			{
				path: 'steps.reviewers',
				model: 'User',
				select: '_id id firstname lastname',
			},
			{
				path: 'applications',
				select: 'aboutApplication',
				match: { applicationStatus: 'inReview' },
			},
		]).lean();
	}
}

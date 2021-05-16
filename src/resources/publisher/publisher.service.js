import { isEmpty, findIndex } from 'lodash';

export default class PublisherService {
	constructor(publisherRepository) {
		this.publisherRepository = publisherRepository;
	}

	getPublisher(id, options = {}) {
		return this.publisherRepository.getPublisher(id, options);
	}

	async getPublisherDatasets(id) {
		const datasets = this.publisherRepository.getPublisherDatasets(id);

		return [...datasets].map(dataset => {
			const {
				_id,
				datasetid: datasetId,
				name,
				description,
				publisher: publisherObj,
				datasetfields: { abstract, publisher, contactPoint },
			} = dataset;
			return {
				_id,
				datasetId,
				name,
				description,
				abstract,
				publisher,
				publisherObj,
				contactPoint,
			};
		});
	}

	async getPublisherDataAccessRequests(id, requestingUserId, isManager) {
		const excludedApplicationStatuses = ['inProgress'];
		if (!isManager) {
			excludedApplicationStatuses.push('submitted');
		}
		const query = { publisher: id, applicationStatus: { $nin: excludedApplicationStatuses } };

		let applications = await this.publisherRepository.getPublisherDataAccessRequests(query);

		if (!isManager) {
			applications = this.filterApplicationsForReviewer(applications, requestingUserId);
		}

		return applications;
	}

	filterApplicationsForReviewer(applications, reviewerUserId) {
		const filteredApplications = [...applications].filter(app => {
			let { workflow = {} } = app;
			if (isEmpty(workflow)) {
				return;
			}

			let { steps = [] } = workflow;
			if (isEmpty(steps)) {
				return;
			}

			let activeStepIndex = findIndex(steps, function (step) {
				return step.active === true;
			});

			let elapsedSteps = [...steps].slice(0, activeStepIndex + 1);
			let found = elapsedSteps.some(step => step.reviewers.some(reviewer => reviewer._id.equals(reviewerUserId)));

			if (found) {
				return app;
			}
		});

		return filteredApplications;
	}
}

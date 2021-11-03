import sinon from 'sinon';
import CohortService from '../cohort.service';
import CohortRepository from '../cohort.repository';
import DatasetService from '../../dataset/dataset.service';
import { cohortBody, user, cohortDocumentExpected } from '../__mocks__/cohorts';

describe('CohortService', () => {
	describe('addCohort', () => {
		it('should build document for adding a cohort', async () => {
			const now = new Date();
			const clock = sinon.useFakeTimers(now.getTime());

			const cohortRepository = new CohortRepository();
			const addCohortStub = sinon.stub(cohortRepository, 'addCohort').returns({});
			const getCohortsStub = sinon.stub(cohortRepository, 'getCohorts').returns([]);

			const datasetService = new DatasetService();
			let getActiveDatasetByPidStub = sinon
				.stub(datasetService, 'getActiveDatasetByPid')
				.onCall(0)
				.returns({ datasetid: 123 })
				.onCall(1)
				.returns({ datasetid: 456 })
				.onCall(2)
				.returns({ datasetid: 789 });

			const cohortService = new CohortService(cohortRepository, datasetService);

			await cohortService.addCohort(cohortBody, user);

			expect(addCohortStub.calledOnce).toBe(true);
			expect(getCohortsStub.calledTwice).toBe(true);
			expect(getActiveDatasetByPidStub.calledThrice).toBe(true);
			expect(addCohortStub.calledWithMatch({ ...cohortDocumentExpected, lastRefresh: Date.now(), updatedon: Date.now() })).toBe(true);

			clock.restore();
		});
	});
});

import sinon from 'sinon';
import CohortProfilingService from '../cohortprofiling.service';
import CohortProfilingRepository from '../cohortprofiling.repository';
import { profilingDataInputMock, profilingOutputExpected } from '../__mocks__/cohortprofiling';

describe('CohortProfilingService', () => {
	describe('addCohortProfiling', () => {
		it('should transform, cleanse and update data from cohort profiling', async () => {
			const cohortProfilingRepository = new CohortProfilingRepository();
			const applyTransformedProfilingDataStub = sinon
				.stub(cohortProfilingRepository, 'applyTransformedProfilingData')
				.returns(profilingDataInputMock.pid);

			const cohortProfilingService = new CohortProfilingService(cohortProfilingRepository);

			await cohortProfilingService.saveCohortProfiling(profilingDataInputMock);

			expect(applyTransformedProfilingDataStub.calledWithMatch(profilingDataInputMock.pid, profilingOutputExpected)).toBe(true);
		});
	});
});

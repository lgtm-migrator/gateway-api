import CohortProfilingRepository from './cohortprofiling.repository';
import CohortProfilingService from './cohortProfiling.service';

export const cohortProfilingRepository = new CohortProfilingRepository();
export const cohortProfilingService = new CohortProfilingService(cohortProfilingRepository);

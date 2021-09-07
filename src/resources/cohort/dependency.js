import CohortRepository from './cohort.repository';
import CohortService from './cohort.service';

export const cohortRepository = new CohortRepository();
export const cohortService = new CohortService(cohortRepository);

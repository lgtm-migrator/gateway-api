import CohortRepository from './cohort.repository';
import CohortService from './cohort.service';
import { datasetService } from '../dataset/dependency';

export const cohortRepository = new CohortRepository();
export const cohortService = new CohortService(cohortRepository, datasetService);

import sinon from 'sinon';
import moment from 'moment';
import CohortService from '../cohort.service';
import CohortRepository from '../cohort.repository';
import DatasetService from '../../dataset/dataset.service';
import { cohortBody, user } from '../__mocks__/cohorts';

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
			expect(
				addCohortStub.calledWithMatch({
					type: 'cohort',
					name: 'Title of test cohort',
					activeflag: 'draft',
					userId: '6936200071297669',
					uploaders: [6936200071297669],
					updatedAt: Date.now(),
					lastRefresh: Date.now(),
					updatedon: Date.now(),
					request_id: 'ID1634916312182',
					items: [],
					datasetPids: [
						'0bc0deeb-665d-46f3-bbd2-3a0d3fafe972',
						'6d457b01-4d39-4af9-9b27-ae8a025df457',
						'df49e3e0-9362-40a4-b730-996e80ec6a1b',
					],
					filterCriteria: ['4094814', '8507', '8516'],
					relatedObjects: [
						{
							isLocked: true,
							objectId: 123,
							objectType: 'dataset',
							pid: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972',
							reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
							updated: moment().format('DD MMM YYYY'),
							user: 'Richard Hobbs',
						},
						{
							isLocked: true,
							objectId: 456,
							objectType: 'dataset',
							pid: '6d457b01-4d39-4af9-9b27-ae8a025df457',
							reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
							updated: moment().format('DD MMM YYYY'),
							user: 'Richard Hobbs',
						},
						{
							isLocked: true,
							objectId: 789,
							objectType: 'dataset',
							pid: 'df49e3e0-9362-40a4-b730-996e80ec6a1b',
							reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
							updated: moment().format('DD MMM YYYY'),
							user: 'Richard Hobbs',
						},
					],
					rquestRelatedObjects: [],
					description: '',
					publicflag: true,
					totalResultCount: 20936,
					numberOfDatasets: 3,
					countsPerDataset: [
						{ pid: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972', count: '15015' },
						{ pid: '6d457b01-4d39-4af9-9b27-ae8a025df457', count: '4501' },
						{ pid: 'df49e3e0-9362-40a4-b730-996e80ec6a1b', count: '1420' },
					],
					cohort: {
						result: {
							counts: [
								{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', count: '15015' },
								{ rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395', count: '4501' },
								{ rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395', count: '1420' },
							],
						},
						input: {
							collections: [
								{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', external_id: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972' },
								{ rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395', external_id: '6d457b01-4d39-4af9-9b27-ae8a025df457' },
								{ rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395', external_id: 'df49e3e0-9362-40a4-b730-996e80ec6a1b' },
							],
							cohorts: [
								{
									name: 'cases',
									groups: [
										{
											rules: [
												{ oper: '=', type: 'TEXT', varname: 'OMOP', value: '4094814' },
												{ oper: '=', type: 'TEXT', varname: 'OMOP', value: '8507' },
												{ oper: '!=', type: 'TEXT', varname: 'OMOP', value: '8516' },
											],
											rules_oper: 'AND',
										},
									],
									groups_oper: 'OR',
								},
							],
						},
						application: 'bcrquest_server',
						searched_codes: { searched_codes: [{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', subsume: ['8516'] }] },
						query_url: 'https://rquest.test.healthdatagateway.org/bcrquest/#!search-results/RQ-5dcb930d-34ff-46e6-afd1-bc0e47fe8805',
					},
				})
			).toBe(true);

			clock.restore();
		});
	});
});

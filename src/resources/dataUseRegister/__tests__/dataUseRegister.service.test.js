import sinon from 'sinon';

import DataUseRegisterService from '../dataUseRegister.service';
import DataUseRegisterRepository from '../dataUseRegister.repository';
import dataUseRegisterUtil from '../dataUseRegister.util';
import { dataUseRegisterUploadsWithDuplicates, dataUseRegisterUploads, editedDataUseObject } from '../__mocks__/dataUseRegisters';
import { uploader } from '../__mocks__/dataUseRegisterUsers';
import dbHandler from '../../../config/in-memory-db';

beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ datauseregisters: [dataUseRegisterUploads[0]] });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('DataUseRegisterService', function () {
	describe('filterDuplicateDataUseRegisters', function () {
		it('filters out data uses that have matching project Ids', async function () {
			// Arrange
			const dataUseRegisterRepository = new DataUseRegisterRepository();
			const dataUseRegisterService = new DataUseRegisterService(dataUseRegisterRepository);

			// Act
			const result = dataUseRegisterService.filterDuplicateDataUseRegisters(dataUseRegisterUploadsWithDuplicates);

			// Assert
			expect(dataUseRegisterUploadsWithDuplicates.length).toEqual(6);
			expect(result.length).toEqual(2);
			expect(result[0].projectIdText).not.toEqual(result[1].projectIdText);
			expect(result[0]).toEqual(dataUseRegisterUploadsWithDuplicates[0]);
		});
		it('filters out duplicate data uses that match across the following fields: project title, lay summary, organisation name, dataset names and latest approval date', async function () {
			// Arrange
			const dataUseRegisterRepository = new DataUseRegisterRepository();
			const dataUseRegisterService = new DataUseRegisterService(dataUseRegisterRepository);

			// Act
			const result = dataUseRegisterService.filterDuplicateDataUseRegisters(dataUseRegisterUploadsWithDuplicates);

			// Assert
			expect(dataUseRegisterUploadsWithDuplicates.length).toEqual(6);
			expect(result.length).toEqual(2);
			expect(result[1]).toEqual(dataUseRegisterUploadsWithDuplicates[4]);
		});
	});

	describe('filterExistingDataUseRegisters', function () {
		it('filters out data uses that are found to already exist in the database', async function () {
			// Arrange
			const dataUseRegisterRepository = new DataUseRegisterRepository();
			const dataUseRegisterService = new DataUseRegisterService(dataUseRegisterRepository);

			const checkDataUseRegisterExistsStub = sinon.stub(dataUseRegisterRepository, 'checkDataUseRegisterExists');
			checkDataUseRegisterExistsStub.onCall(0).returns(false);
			checkDataUseRegisterExistsStub.onCall(1).returns(true);
			const getLinkedDatasetsStub = sinon.stub(dataUseRegisterUtil, 'getLinkedDatasets');
			getLinkedDatasetsStub.returns({ linkedDatasets: [], namedDatasets: [] });

			// Act
			const result = await dataUseRegisterService.filterExistingDataUseRegisters(dataUseRegisterUploads);

			// Assert
			expect(checkDataUseRegisterExistsStub.calledTwice).toBe(true);
			expect(dataUseRegisterUploads.length).toBe(2);
			expect(result.length).toBe(1);
			expect(result[0].projectIdText).toEqual(dataUseRegisterUploads[0].projectIdText);
		});
	});

	describe('buildUpdateObject', () => {
		const dataUseRegisterRepository = new DataUseRegisterRepository();
		const dataUseRegisterService = new DataUseRegisterService(dataUseRegisterRepository);

		it('Should return a valid update object when a dataset is approved', async () => {
			const dataUserRegister = dataUseRegisterUploads[0];
			const dataUseRegisterPayload = { activeflag: 'active', rejectionReason: '' };
			const user = uploader;

			const updateObj = await dataUseRegisterService.buildUpdateObject(dataUserRegister, dataUseRegisterPayload, user);

			const expectedResponse = { activeflag: 'active', rejectionReason: '' };

			expect(updateObj).toEqual(expectedResponse);
		});

		it('Should return a valid update object when a dataset is rejected', async () => {
			const dataUserRegister = dataUseRegisterUploads[0];
			const dataUseRegisterPayload = { activeflag: 'rejected', rejectionReason: 'This dataset is rejected' };
			const user = uploader;

			const updateObj = await dataUseRegisterService.buildUpdateObject(dataUserRegister, dataUseRegisterPayload, user);

			const expectedResponse = { activeflag: 'rejected', rejectionReason: 'This dataset is rejected' };

			expect(updateObj).toEqual(expectedResponse);
		});

		it('Should return a valid update object when a dataset is archived', async () => {
			const dataUserRegister = dataUseRegisterUploads[0];
			const dataUseRegisterPayload = { activeflag: 'archived', rejectionReason: '' };
			const user = uploader;

			const updateObj = await dataUseRegisterService.buildUpdateObject(dataUserRegister, dataUseRegisterPayload, user);

			const expectedResponse = { activeflag: 'archived', rejectionReason: '' };

			expect(updateObj).toEqual(expectedResponse);
		});

		it('Should return a valid update object when a dataset is edited', async () => {
			const dataUserRegister = dataUseRegisterUploads[0];
			const dataUseRegisterPayload = editedDataUseObject;
			const user = uploader;

			const updateObj = await dataUseRegisterService.buildUpdateObject(dataUserRegister, dataUseRegisterPayload, user);

			const expectedResponse = {
				relatedObjects: [],
				fundersAndSponsors: ['funder1', 'funder2', 'funder3'],
				otherApprovalCommittees: ['other Approval Committees'],
				projectTitle: 'This a test data use register with an edited title',
			};

			expect(updateObj).toEqual(expectedResponse);
		});
	});
});

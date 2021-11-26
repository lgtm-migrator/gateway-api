import sinon from 'sinon';
import DataRequestRepository from '../../datarequest/datarequest.repository';
import QuestionBankService from '../questionbank.service';
import GlobalService from '../../global/global.service';
import * as questionBank from '../__mocks__/questionbank';
import PublisherService from '../../publisher/publisher.service';
import QuestionBankRepository from '../questionbank.repository';
import PublisherRepository from '../../publisher/publisher.repository';
import * as activeSchemaNotCreatedThroughForm from '../__mocks__/activeSchemaNotCreatedThroughForm';
import * as activeSchemaCreatedThroughForm from '../__mocks__/activeSchemaCreatedThroughForm';
import * as draftSchemaNotCreatedThroughForm from '../__mocks__/draftSchemaCreatedThroughForm';
import * as noSchemaExists from '../__mocks__/noSchemaExists';

describe('Question Bank Service', function () {
	const dataRequestRepository = new DataRequestRepository();
	const globalService = new GlobalService();
	sinon.stub(globalService, 'getGlobal').returns(questionBank.globalDocument);
	const publisherRepository = new PublisherRepository();
	sinon.stub(publisherRepository, 'getPublisher').returns(questionBank.publisherDocument);
	const publisherService = new PublisherService(publisherRepository);
	const questionBankRepository = new QuestionBankRepository();
	const questionBankService = new QuestionBankService(questionBankRepository, publisherService, globalService, dataRequestRepository);
	let dataRequestRepositoryStubGet;
	let dataRequestRepositoryStubCreate;

	afterEach(function () {
		dataRequestRepositoryStubGet.restore();
		dataRequestRepositoryStubCreate.restore();
	});

	it('No data request schema exists', async function () {
		dataRequestRepositoryStubGet = sinon.stub(dataRequestRepository, 'getApplicationFormSchemas').returns([]);
		dataRequestRepositoryStubCreate = sinon
			.stub(dataRequestRepository, 'createApplicationFormSchema')
			.returns(noSchemaExists.expectedSchema);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(noSchemaExists.expectedSchema.questionStatus);
		expect(result.guidance).toEqual(noSchemaExists.expectedSchema.guidance);
		expect(result.countOfChanges).toEqual(noSchemaExists.expectedSchema.countOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});

	it('Draft data request schema exists created through the customize form', async function () {
		dataRequestRepositoryStubGet = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([draftSchemaNotCreatedThroughForm.dataRequestSchema]);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.questionStatus);
		expect(result.guidance).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.guidance);
		expect(result.countOfChanges).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.countOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});

	it('Active data request schema exists created through the customize form', async function () {
		dataRequestRepositoryStubGet = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([activeSchemaCreatedThroughForm.dataRequestSchema]);

		dataRequestRepositoryStubCreate = sinon
			.stub(dataRequestRepository, 'createApplicationFormSchema')
			.returns(activeSchemaCreatedThroughForm.expectedSchema);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
		expect(result.guidance).toEqual(activeSchemaCreatedThroughForm.expectedSchema.guidance);
		expect(result.questionStatus).toEqual(activeSchemaCreatedThroughForm.expectedSchema.questionStatus);
		expect(result.countOfChanges).toEqual(activeSchemaCreatedThroughForm.expectedSchema.countOfChanges);
	});

	it('Active data request schema exists not created through the customize form', async function () {
		dataRequestRepositoryStubGet = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([activeSchemaNotCreatedThroughForm.dataRequestSchema]);

		dataRequestRepositoryStubCreate = sinon
			.stub(dataRequestRepository, 'createApplicationFormSchema')
			.returns(activeSchemaNotCreatedThroughForm.expectedSchema);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(activeSchemaNotCreatedThroughForm.expectedSchema.questionStatus);
		expect(result.guidance).toEqual(activeSchemaNotCreatedThroughForm.expectedSchema.guidance);
		expect(result.countOfChanges).toEqual(activeSchemaNotCreatedThroughForm.expectedSchema.countOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});
});

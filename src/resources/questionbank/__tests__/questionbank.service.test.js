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
	sinon.stub(dataRequestRepository, 'createApplicationFormSchema');
	const globalService = new GlobalService();
	sinon.stub(globalService, 'getGlobal').returns(questionBank.globalDocument);
	const publisherRepository = new PublisherRepository();
	sinon.stub(publisherRepository, 'getPublisher').returns(questionBank.publisherDocument);
	const publisherService = new PublisherService(publisherRepository);
	const questionBankRepository = new QuestionBankRepository();
	const questionBankService = new QuestionBankService(questionBankRepository, publisherService, globalService, dataRequestRepository);
	let dataRequestRepositoryStub;

	afterEach(function () {
		dataRequestRepositoryStub.restore();
	});

	it('No data request schema exists', async function () {
		dataRequestRepositoryStub = sinon.stub(dataRequestRepository, 'getApplicationFormSchemas').returns([]);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(noSchemaExists.expectedQuestionStatus);
		expect(result.guidance).toEqual(noSchemaExists.expectedGuidance);
		expect(result.countOfChanges).toEqual(noSchemaExists.expectedCountOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});

	it('Draft data request schema exists created through the customize form', async function () {
		dataRequestRepositoryStub = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([draftSchemaNotCreatedThroughForm.dataRequestSchema]);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.questionStatus);
		expect(result.guidance).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.guidance);
		expect(result.countOfChanges).toEqual(draftSchemaNotCreatedThroughForm.dataRequestSchema.countOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});

	it('Active data request schema exists created through the customize form', async function () {
		dataRequestRepositoryStub = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([activeSchemaCreatedThroughForm.dataRequestSchema]);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
		expect(result.guidance).toEqual(activeSchemaCreatedThroughForm.expectedGuidance);
		expect(result.questionStatus).toEqual(activeSchemaCreatedThroughForm.expectedQuestionStatus);
		expect(result.countOfChanges).toEqual(activeSchemaCreatedThroughForm.expectedCountOfChanges);
	});

	it('Active data request schema exists not created through the customize form', async function () {
		dataRequestRepositoryStub = sinon
			.stub(dataRequestRepository, 'getApplicationFormSchemas')
			.returns([activeSchemaNotCreatedThroughForm.dataRequestSchema]);

		const result = await questionBankService.getQuestionBankInfo(questionBank.publisherDocument._id);

		expect(result.questionStatus).toEqual(activeSchemaNotCreatedThroughForm.expectedQuestionStatus);
		expect(result.guidance).toEqual(activeSchemaNotCreatedThroughForm.expectedGuidance);
		expect(result.countOfChanges).toEqual(activeSchemaNotCreatedThroughForm.expectedCountOfChanges);
		expect(result.masterSchema).toEqual(questionBank.globalDocument.masterSchema);
	});
});

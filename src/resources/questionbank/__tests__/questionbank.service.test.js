import sinon from 'sinon';
import DataRequestRepository from '../../datarequest/datarequest.repository';
import QuestionBankService from '../questionbank.service';
import GlobalService from '../../global/global.service';
import { globalStub, publisherStub, questionStatusMissingEntriesStub, dataRequestSchemaDraftStub } from '../__mocks__/questionbank';
import PublisherService from '../../publisher/publisher.service';
import QuestionBankRepository from '../questionbank.repository';
import PublisherRepository from '../../publisher/publisher.repository';

describe('Question Bank Service', function () {
	it('When no entry exists in the schema', async function () {
		//dataSchemaModel
		const dataRequestRepository = new DataRequestRepository();
		const dataRequestRepositoryStub = sinon.stub(dataRequestRepository, 'getApplicationFormSchemas').returns([]);
		const dataRequestRepositoryStub2 = sinon.stub(dataRequestRepository, 'createApplicationFormSchema');

		const globalService = new GlobalService();
		const globalServiceStub = sinon.stub(globalService, 'getGlobal').returns(globalStub);

		const publisherRepository = new PublisherRepository();
		const publisherRepositoryStub = sinon.stub(publisherRepository, 'getPublisher').returns({});

		const publisherService = new PublisherService(publisherRepository);

		const questionBankRepository = new QuestionBankRepository();

		const questionBankService = new QuestionBankService(questionBankRepository, publisherService, globalService, dataRequestRepository);

		const result = await questionBankService.getQuestionBankInfo(publisherStub._id);

		//Il risultato
		expect(result.questionStatus).toEqual(questionStatusMissingEntriesStub);
		expect(result.guidance).toEqual({});
		expect(result.countOfChanges).toEqual(0);
		expect(result.masterSchema).toEqual(globalStub.masterSchema);
	});

	it('When entry exists in draft status', async function () {
		//dataSchemaModel
		const dataRequestRepository = new DataRequestRepository();
		const dataRequestRepositoryStub = sinon.stub(dataRequestRepository, 'getApplicationFormSchemas').returns([dataRequestSchemaDraftStub]);
		const dataRequestRepositoryStub2 = sinon.stub(dataRequestRepository, 'createApplicationFormSchema');

		const globalService = new GlobalService();
		const globalServiceStub = sinon.stub(globalService, 'getGlobal').returns(globalStub);

		const publisherRepository = new PublisherRepository();
		const publisherRepositoryStub = sinon.stub(publisherRepository, 'getPublisher').returns({});

		const publisherService = new PublisherService(publisherRepository);

		const questionBankRepository = new QuestionBankRepository();

		const questionBankService = new QuestionBankService(questionBankRepository, publisherService, globalService, dataRequestRepository);

		const result = await questionBankService.getQuestionBankInfo(publisherStub._id);

		expect(result.questionStatus).toEqual(dataRequestSchemaDraftStub.questionStatus);
		expect(result.guidance).toEqual(dataRequestSchemaDraftStub.guidance);
		expect(result.countOfChanges).toEqual(dataRequestSchemaDraftStub.countOfChanges);
		expect(result.masterSchema).toEqual(globalStub.masterSchema);
	});
});

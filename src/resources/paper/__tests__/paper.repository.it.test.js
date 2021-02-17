import dbHandler from '../../../config/in-memory-db';
import PaperRepository from '../paper.repository';
import { papersStub } from '../__mocks__/papers';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: papersStub });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ tools: papersStub });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('PaperRepository', function () {
	describe('getPaper', () => {
		it('should return a paper by a specified id', async function () {
			const paperRepository = new PaperRepository();
			const paper = await paperRepository.getPaper(32300742);
			expect(paper).toEqual(papersStub[0]);
		});
	});

	describe('getPapers', () => {
		it('should return an array of papers', async function () {
			const paperRepository = new PaperRepository();
			const papers = await paperRepository.getPapers();
			expect(papers.length).toBeGreaterThan(0);
		});
	});
});

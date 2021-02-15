import dbHandler from '../../../config/in-memory-db';
import ToolRepository from '../v2/tool.repository';
import { toolsStub } from '../__mocks__/tools';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: toolsStub });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ tools: toolsStub });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('ToolRepository', function () {
	describe('getTool', () => {
		it('should return a tool by a specified id', async function () {
			const toolRepository = new ToolRepository();
			const tool = await toolRepository.getTool(19008);
			expect(tool).toEqual(toolsStub[0]);
		});
	});

	describe('getTools', () => {
		it('should return an array of tools', async function () {
			const toolRepository = new ToolRepository();
			const tools = await toolRepository.getTools();
			expect(tools.length).toBeGreaterThan(0);
		});
	});
});

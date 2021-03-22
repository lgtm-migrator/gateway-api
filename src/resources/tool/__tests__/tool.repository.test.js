import sinon from 'sinon';

import ToolRepository from '../v2/tool.repository';
import { toolsStub } from '../__mocks__/tools';

describe('ToolRepository', function () {
	describe('getTool', function () {
		it('should return a tool by a specified id', async function () {
			const toolStub = toolsStub[0];
			const toolRepository = new ToolRepository();
			const stub = sinon.stub(toolRepository, 'findOne').returns(toolStub);
			const tool = await toolRepository.getTool(toolStub.id);

			expect(stub.calledOnce).toBe(true);

			expect(tool.type).toEqual(toolStub.type);
			expect(tool.id).toEqual(toolStub.id);
			expect(tool.name).toEqual(toolStub.name);
			expect(tool.description).toEqual(toolStub.description);
			expect(tool.resultsInsights).toEqual(toolStub.resultsInsights);
			expect(tool.toolid).toEqual(toolStub.toolid);
			expect(tool.categories).toEqual(toolStub.categories);
			expect(tool.license).toEqual(toolStub.license);
			expect(tool.authors).toEqual(toolStub.authors);
			expect(tool.activeflag).toEqual(toolStub.activeflag);
			expect(tool.counter).toEqual(toolStub.counter);
			expect(tool.discourseTopicId).toEqual(toolStub.discourseTopicId);
			expect(tool.relatedObjects).toEqual(toolStub.relatedObjects);
			expect(tool.uploader).toEqual(toolStub.uploader);
			expect(tool.programmingLanguage).toEqual(toolStub.programmingLanguage);
		});
	});

	describe('getTools', function () {
		it('should return an array of tools', async function () {
			const toolRepository = new ToolRepository();
			const stub = sinon.stub(toolRepository, 'find').returns(toolsStub);
			const tools = await toolRepository.getTools();

			expect(stub.calledOnce).toBe(true);

			expect(tools.length).toBeGreaterThan(0);
		});
	});

	describe('findCountOf', function () {
		it('should return the number of documents found by a given query', async function () {
			const toolRepository = new ToolRepository();
			const stub = sinon.stub(toolRepository, 'findCountOf').returns(1);
			const toolCount = await toolRepository.findCountOf({ name: 'Admitted Patient Care Tool' });
			
			expect(stub.calledOnce).toBe(true);

			expect(toolCount).toEqual(1);
		});
	});
});
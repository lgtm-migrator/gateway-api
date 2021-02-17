import sinon from 'sinon';

import ToolRepository from '../v2/tool.repository';
import ToolService from '../v2/tool.service';
import { toolsStub } from '../__mocks__/tools';

describe('ToolService', function () {
	describe('getTool', function () {
		it('should return a tool by a specified id', async function () {
			const toolStub = toolsStub[0];
			const toolRepository = new ToolRepository();
			const stub = sinon.stub(toolRepository, 'getTool').returns(toolStub);
			const toolService = new ToolService(toolRepository);
			const tool = await toolService.getTool(toolStub.id);

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
			const stub = sinon.stub(toolRepository, 'getTools').returns(toolsStub);
			const toolService = new ToolService(toolRepository);
			const tools = await toolService.getTools();

			expect(stub.calledOnce).toBe(true);

			expect(tools.length).toBeGreaterThan(0);
		});
	});
});

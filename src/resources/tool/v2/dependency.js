import ToolRepository from './tool.repository';
import ToolService from './tool.service';

export const toolRepository = new ToolRepository();
export const toolService = new ToolService(toolRepository);

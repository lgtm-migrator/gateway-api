import ToolClass from '../v2/tool.entity';

describe('ToolEntity', function () {
	describe('constructor', function () {
		it('should create an instance of a tool entity with the expected properties', async function () {
			const tool = new ToolClass(
				19008,
				'C19 Track',
				'Help paint a more accurate picture of covid-19 in your community',
				null,
				'https://c19track.com/',
				'tool',
				{
					category: 'Questionnaire',
					programmingLanguageVersion: '',
					programmingLanguage: [],
				},
				'',
				[190000],
				null,
				'active',
				65,
				null,
				[],
				null,
				[
					{
						programmingLanguage: 'R',
						version: '',
					},
				]
			);

			expect(tool.id).toEqual(19008);
			expect(tool.type).toEqual('tool');
			expect(tool.name).toEqual('C19 Track');
			expect(tool.description).toEqual('Help paint a more accurate picture of covid-19 in your community');
			expect(tool.resultsInsights).toEqual(null);
			expect(tool.link).toEqual('https://c19track.com/');
			expect(tool.categories).toEqual({
				category: 'Questionnaire',
				programmingLanguageVersion: '',
				programmingLanguage: [],
			});
			expect(tool.tags).toEqual(null);
			expect(tool.license).toEqual('');
			expect(tool.authors).toEqual([190000]);
			expect(tool.activeflag).toEqual('active');
			expect(tool.counter).toEqual(65);
			expect(tool.discourseTopicId).toEqual(null);
			expect(tool.relatedObjects).toEqual([]);
			expect(tool.uploader).toEqual(null);
			expect(tool.programmingLanguage).toEqual([
				{
					programmingLanguage: 'R',
					version: '',
				},
			]);
		});
	});
});

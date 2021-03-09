import ProjectClass from '../project.entity';

describe('ProjectEntity', function () {
	describe('constructor', function () {
		it('should create an instance of a project entity with the expected properties', async function () {
			const project = new ProjectClass(
				12234413426179104,
				'BREATHE: COVID-19 Symptom Tracker – Calderdale',
				'BREATHE: COVID-19 Symptom Tracker – Calderdale',
				null,
				'https://www.ed.ac.uk/usher/breathe',
				'project',
				{
					category: 'COVID-19 Research Question',
				},
				null,
				[1636225498764312],
				{
					features: ['COVID-19', 'Population Health', 'BREATHE'],
					topics: [],
				},
				'active',
				11,
				null,
				[],
				22850500618628944
			);

			expect(project.id).toEqual(12234413426179104);
			expect(project.type).toEqual('project');
			expect(project.name).toEqual('BREATHE: COVID-19 Symptom Tracker – Calderdale');
			expect(project.description).toEqual('BREATHE: COVID-19 Symptom Tracker – Calderdale');
			expect(project.resultsInsights).toEqual(null);
			expect(project.categories).toEqual({
				category: 'COVID-19 Research Question',
			});
			expect(project.tags).toEqual({
				features: ['COVID-19', 'Population Health', 'BREATHE'],
				topics: [],
			});
			expect(project.license).toEqual(null);
			expect(project.authors).toEqual([1636225498764312]);
			expect(project.activeflag).toEqual('active');
			expect(project.counter).toEqual(11);
			expect(project.discourseTopicId).toEqual(null);
			expect(project.relatedObjects).toEqual([]);
			expect(project.uploader).toEqual(22850500618628944);
		});
	});
});

import CourseClass from '../v2/course.entity';

describe('CourseEntity', function () {
	describe('constructor', function () {
		it('should create an instance of a course entity with the expected properties', async function () {
			const course = new CourseClass(
				50033,
				'course',
				50000,
				'active',
				5,
				null,
				[],
				'Health Data Analytics',
				'https://www.ucl.ac.uk/health-informatics/study/postgraduate-taught-programmes/health-data-analytics-mscpg-dippg-cert',
				'UCL Institute of Health Informatics',
				'Health data analytics involves extracting insights from health data, either to shape national policy, manage local organisations or inform the care of an individual. As more and more data becomes available electronically, the demand for skilled and trained individuals to take advantage of it becomes increasingly urgent.',
				'campus',
				'London',
				[],
				['Course'],
				[
					{
						flexibleDates: true,
						startDate: null,
						studyMode: '',
						studyDurationNumber: null,
						studyDurationMeasure: '',
						fees: [
							{
								feeDescription: '',
								feeAmount: null,
								feePer: '',
							},
						],
					},
				],
				[
					{
						level: '',
						subject: '',
					},
				],
				'other:Relevant first degree or equivalent experience required',
				[],
				'',
				''
			);

			expect(course.id).toEqual(50033);
			expect(course.type).toEqual('course');
			expect(course.creator).toEqual(50000);
			expect(course.activeflag).toEqual('active');
			expect(course.counter).toEqual(5);
			expect(course.discourseTopicId).toEqual(null);
			expect(course.relatedObjects).toEqual([]);
			expect(course.title).toEqual('Health Data Analytics');
			expect(course.link).toEqual('https://www.ucl.ac.uk/health-informatics/study/postgraduate-taught-programmes/health-data-analytics-mscpg-dippg-cert');
			expect(course.provider).toEqual('UCL Institute of Health Informatics');
			expect(course.description).toEqual(
				'Health data analytics involves extracting insights from health data, either to shape national policy, manage local organisations or inform the care of an individual. As more and more data becomes available electronically, the demand for skilled and trained individuals to take advantage of it becomes increasingly urgent.'
			);
			expect(course.courseDelivery).toEqual('campus');
			expect(course.location).toEqual('London');
			expect(course.keywords).toEqual([]);
			expect(course.domains).toEqual(['Course']);
			expect(course.courseOptions).toEqual([
				{
					flexibleDates: true,
					startDate: null,
					studyMode: '',
					studyDurationNumber: null,
					studyDurationMeasure: '',
					fees: [
						{
							feeDescription: '',
							feeAmount: null,
							feePer: '',
						},
					],
				},
			]);
			expect(course.entries).toEqual([
				{
					level: '',
					subject: '',
				},
			]);
			expect(course.restrictions).toEqual('other:Relevant first degree or equivalent experience required');
			expect(course.award).toEqual([]);
			expect(course.competencyFramework).toEqual('');
			expect(course.nationalPriority).toEqual('');
		});
	});
});

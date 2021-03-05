import DatasetClass from '../dataset.entity';

describe('DatasetEntity', function () {
	describe('constructor', function () {
		it('should create an instance of a dataset entity with the expected properties', async function () {
			const dataset = new DatasetClass({
				id: 675584862177848,
				name: "Admitted Patient Care Dataset",
				description: "This is a dataset about admitted patient care",
				resultsInsights: null,
				license: null,
				type: "dataset",
				categories: {},
				discourseTopicId: null,
				relatedObjects: [],
				datasetv2: {},
				activeflag: "active",
				counter: 15,
				uploader: null,
				authors: [],
				datasetid: "dfb21b3b-7fd9-40c4-892e-810edd6dfc25",
				pid: "4ef841d3-5e86-4f92-883f-1015ffd4b979",
				datasetVersion: "0.0.1",
				datasetfields: { publisher: "Oxford University Hospitals NHS Foundation Trust" }
			});

			expect(dataset.datasetid).toEqual("dfb21b3b-7fd9-40c4-892e-810edd6dfc25");
			expect(dataset.type).toEqual("dataset");
			expect(dataset.id).toEqual(675584862177848);
			expect(dataset.name).toEqual("Admitted Patient Care Dataset");
			expect(dataset.description).toEqual("This is a dataset about admitted patient care");
			expect(dataset.resultsInsights).toEqual(null);
			expect(dataset.datasetid).toEqual("dfb21b3b-7fd9-40c4-892e-810edd6dfc25");
			expect(dataset.categories).toEqual({});
			expect(dataset.license).toEqual(null);
			expect(dataset.authors).toEqual([]);
			expect(dataset.activeflag).toEqual("active");
			expect(dataset.counter).toEqual(15);
			expect(dataset.discourseTopicId).toEqual(null);
			expect(dataset.relatedObjects).toEqual([]);
			expect(dataset.uploader).toEqual(null);
			expect(dataset.pid).toEqual("4ef841d3-5e86-4f92-883f-1015ffd4b979");
			expect(dataset.datasetVersion).toEqual("0.0.1");
			expect(dataset.datasetfields).toEqual({ publisher: "Oxford University Hospitals NHS Foundation Trust" });
			expect(dataset.datasetv2).toEqual({});
		});
    });
    
    describe('checkLatestVersion', function () {
		it('should return a boolean indicating this is the latest version of the dataset', async function () {
			const dataset = new DatasetClass({
				id: 675584862177848,
				name: "Admitted Patient Care Dataset",
				description: "This is a dataset about admitted patient care",
				resultsInsights: null,
				license: null,
				type: "dataset",
				categories: {},
				discourseTopicId: null,
				relatedObjects: [],
				datasetv2: {},
				activeflag: "active",
				counter: 15,
				uploader: null,
				authors: [],
				datasetid: "dfb21b3b-7fd9-40c4-892e-810edd6dfc25",
				pid: "4ef841d3-5e86-4f92-883f-1015ffd4b979",
				datasetVersion: "0.0.1",
				datasetfields: { publisher: "Oxford University Hospitals NHS Foundation Trust" }
			});
            
            const result = dataset.checkLatestVersion(); 

			expect(result).toBe(true);
        });
        
        it('should return a boolean indicating this is not the latest version of the dataset', async function () {
			const dataset = new DatasetClass({
				id: 675584862177848,
				name: "Admitted Patient Care Dataset",
				description: "This is a dataset about admitted patient care",
				resultsInsights: null,
				license: null,
				type: "dataset",
				categories: {},
				discourseTopicId: null,
				relatedObjects: [],
				datasetv2: {},
				activeflag: "archive",
				counter: 15,
				uploader: null,
				authors: [],
				datasetid: "dfb21b3b-7fd9-40c4-892e-810edd6dfc25",
				pid: "4ef841d3-5e86-4f92-883f-1015ffd4b979",
				datasetVersion: "0.0.1",
				datasetfields: { publisher: "Oxford University Hospitals NHS Foundation Trust" }
			});
            
            const result = dataset.checkLatestVersion(); 

			expect(result).toBe(false);
		});
    });
});

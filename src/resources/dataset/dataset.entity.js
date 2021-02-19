import Entity from '../base/entity';

export default class DatasetClass extends Entity {
	constructor(
		id,
		name,
		description,
		resultsInsights,
		link,
		type,
		categories,
		license,
		authors,
		tags,
		activeflag,
		counter,
		discourseTopicId,
		relatedObjects,
		uploader,
		datasetid,
		pid,
		datasetVersion,
		datasetfields,
		datasetv2
	) {
		super();
		this.id = id;
		this.name = name;
		this.description = description;
		this.resultsInsights = resultsInsights;
		this.link = link;
		this.type = type;
		this.categories = categories;
		this.license = license;
		this.authors = authors;
		this.tags = tags;
		this.activeflag = activeflag;
		this.counter = counter;
		this.discourseTopicId = discourseTopicId;
		this.relatedObjects = relatedObjects;
		this.uploader = uploader;
		this.datasetid = datasetid;
		this.pid = pid;
		this.datasetVersion = datasetVersion;
		this.datasetfields = datasetfields;
		this.datasetv2 = datasetv2;
	}

	checkLatestVersion() {
		return this.activeflag === 'active';
	}

	toV2Format() {
		// Version 2 transformer map
		const transformer = {
			dataset: {
				pid: 'pid',
				id: 'datasetid',
				version: 'datasetVersion',
				identifier: 'datasetv2.identifier',
				summary: 'datasetv2.summary',
				documentation: 'datasetv2.documentation',
				revisions: 'datasetv2.revisions',
				modified: 'datasetv2.modified',
				issued: 'datasetv2.issued',
				accessibility: 'datasetv2.accessibility',
				observations: 'datasetv2.observations',
				provenance: 'datasetv2.provenance',
				coverage: 'datasetv2.coverage',
				enrichmentAndLinkage: 'datasetv2.enrichmentAndLinkage',
				structuralMetadata: {
					structuralMetadataCount: {},
					dataClasses: 'datasetfields.technicaldetails',
				},
			},
			relatedObjects: 'relatedObjects',
			metadataQuality: 'datasetfields.metadataquality',
			dataUtility: 'datasetfields.datautility',
			viewCounter: 'counter',
			submittedDataAccessRequests: 'submittedDataAccessRequests',
		};

		// Transform entity into v2 using map, with stict applied to retain null values
		const transformedObject = this.transformTo(transformer, { strict: true });

		// Manually update identifier URL link
		transformedObject.dataset.identifier = `https://web.www.healthdatagateway.org/dataset/${this.datasetid}`;

		// Append static schema details for v2
		const formattedObject = {
			'@schema': {
				type: `Dataset`,
				version: `2.0.0`,
				url: `https://raw.githubusercontent.com/HDRUK/schemata/master/schema/dataset/latest/dataset.schema.json`,
			},
			...transformedObject
		};
		
		// Return v2 object
		return formattedObject;
	}
}

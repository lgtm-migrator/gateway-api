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


}

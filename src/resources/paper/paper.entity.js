import Entity from '../base/entity';

export default class PaperClass extends Entity {
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
		journal,
		journalYear,
		isPreprint
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
		this.journal = journal;
		this.journalYear = journalYear;
		this.isPreprint = isPreprint;
	}
}

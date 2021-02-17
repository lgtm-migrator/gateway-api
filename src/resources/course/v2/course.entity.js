import Entity from '../../base/entity';

export default class CourseClass extends Entity {
	constructor(
		id,
		type,
		creator,
		activeflag,
		counter,
		discourseTopicId,
		relatedObjects,
		title,
		link,
		provider,
		description,
		courseDelivery,
		location,
		keywords,
		domains,
		courseOptions,
		entries,
		restrictions,
		award,
		competencyFramework,
		nationalPriority
	) {
		super();
		this.id = id;
		this.type = type;
		this.creator = creator;
		this.activeflag = activeflag;
		this.counter = counter;
		this.discourseTopicId = discourseTopicId;
		this.relatedObjects = relatedObjects;
		this.title = title;
		this.link = link;
		this.provider = provider;
		this.description = description;
		this.courseDelivery = courseDelivery;
		this.location = location;
		this.keywords = keywords;
		this.domains = domains;
		this.courseOptions = courseOptions;
		this.entries = entries;
		this.restrictions = restrictions;
		this.award = award;
		this.competencyFramework = competencyFramework;
		this.nationalPriority = nationalPriority;
	}
}

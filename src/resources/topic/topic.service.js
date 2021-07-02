export default class TopicService {
	constructor(topicRepository) {
		this.topicRepository = topicRepository;
	}

	getTopicsForDAR(applicationID, messageType) {
		return this.topicRepository.getTopicsForDAR(applicationID, messageType);
	}

	getTopicForDAR(applicationID, questionID, messageType) {
		return this.topicRepository.getTopicForDAR(applicationID, questionID, messageType);
	}

	createTopicForDAR(applicationID, questionID, messageType) {
		return this.topicRepository.createTopicForDAR(applicationID, questionID, messageType);
	}
}

export default class MessageService {
	constructor(messageRepository) {
		this.messageRepository = messageRepository;
	}

	createMessageForDAR(messageBody, topicID, userID, userType) {
		return this.messageRepository.createMessageForDAR(messageBody, topicID, userID, userType);
	}
}

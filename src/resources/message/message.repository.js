import Repository from '../base/repository';
import { MessagesModel } from './message.model';

export default class MessageRepository extends Repository {
	constructor() {
		super(MessagesModel);
		this.messagesModel = MessagesModel;
	}

	createMessageForDAR(messageBody, topicID, userID, userType) {
		return MessagesModel.create({
			messageID: parseInt(Math.random().toString().replace('0.', '')),
			messageObjectID: parseInt(Math.random().toString().replace('0.', '')),
			messageDescription: messageBody,
			topic: topicID,
			createdBy: userID,
			userType,
		});
	}
}

const {PubSub} = require('@google-cloud/pubsub');

const pubSubClient = new PubSub({
    projectId: process.env.PUBSUB_PROJECT_ID,
});

export const pushMessage = async (topicName, message) => {

    const dataBuffer = Buffer.from(JSON.stringify(message));

    // try {
    //     const messageId = pubSubClient
    //       .topic(topicName)
    //       .publish({data: dataBuffer});
    //     console.log(`Message ${messageId} published.`);
    // } catch (error) {
    //     console.error(error);
    //     throw new Error(`Received error while publishing a message to PubSub`);
    // }

    try {
        const messageId = pubSubClient
          .topic(topicName)
          .publishMessage({data: dataBuffer});
        console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error(error);
        throw new Error(`Received error while publishing a message to PubSub`);
    }
};
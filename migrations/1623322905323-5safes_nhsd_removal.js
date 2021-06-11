import { PublisherModel } from '../src/resources/publisher/publisher.model';
import { DataRequestSchemaModel } from '../src/resources/datarequest/datarequest.schemas.model';
/**
 * Make any changes you need to make to the database here
 */
async function up() {
	// Removal of 5Safes for NHSD

	await PublisherModel.findOneAndUpdate(
		{ name: 'ALLIANCE > NHS DIGITAL' },
		{ $set: { allowsMessaging: true, workflowEnabled: false }, $unset: { dataRequestModalContent: '' } }
	);

	await DataRequestSchemaModel.findOneAndDelete({ publisher: 'ALLIANCE > NHS DIGITAL' });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
	// Write migration here
}

module.exports = { up, down };

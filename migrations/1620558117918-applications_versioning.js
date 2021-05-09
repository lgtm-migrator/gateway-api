import { DataRequestModel } from '../src/resources/datarequest/datarequest.model';

async function up() {

	// 1. Add default application type to all applications
	// 2. Add version 1 to all applications
	// 3. Create version tree for all applications

	// Find all access records
	let accessRecords = await DataRequestModel.find();

	// Loop through each record
	for (const accessRecord of accessRecords) {

    accessRecord.applicationType = 'Initial';
    accessRecord.version = 1;
    //accessRecord.versionTree = buildVersionTree(accessRecord);
    
		await accessRecord.save(async (err, doc) => {
			if (err) {
				console.error(`Object update failed for ${accessRecord._id}: ${err.message}`);
			}
		});
	}
}

async function down() {
	// Find all access records
	let accessRecords = await DataRequestModel.find();

	// Loop through each record
	for (const accessRecord of accessRecords) {

    accessRecord.applicationType = undefined;
    accessRecord.version = undefined;
    accessRecord.versionTree = undefined;
    
		await accessRecord.save(async (err, doc) => {
			if (err) {
				console.error(`Object update failed for ${accessRecord._id}: ${err.message}`);
			}
		});
	}
}

module.exports = { up, down };

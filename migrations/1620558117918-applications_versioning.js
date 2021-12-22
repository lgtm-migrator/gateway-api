import { DataRequestModel } from '../src/resources/datarequest/datarequest.model';
import { buildVersionTree } from '../src/resources/datarequest/datarequest.entity';
import constants from '../src/resources/utilities/constants.util';

async function up() {
	// 1. Add default application type to all applications
	// 2. Add version 1 to all applications
	// 3. Create version tree for all applications

	let accessRecords = await DataRequestModel.find()
		.select('_id version versionTree amendmentIterations')
		.lean();
	let ops = [];

	accessRecords.forEach(accessRecord => {
		const versionTree = buildVersionTree(accessRecord);
		const { _id } = accessRecord;
		ops.push({
			updateOne: {src/resources/datarequest/amendment/amendment.service.js
				filter: { _id },
				update: {
					applicationType: constants.submissionTypes.INITIAL,
					majorVersion: 1.0,
					version: undefined,
					versionTree,
				},
				upsert: false,
			},
		});
	});

	await DataRequestModel.bulkWrite(ops);
}

async function down() {
  // 1. Remove application type from all applications
  // 2. Remove version from all applications
  // 3. Remove version tree from all applications

    let accessRecords = await DataRequestModel.find()
		.select('_id version versionTree amendmentIterations')
		.lean();
let ops=[];

 await accessRecords.forEach(accessRecord => {
   ops.push({
updateOne: {
       filter:  { _id: accessRecord._id },
       update: { $set: {version: 1 }, $unset: { versionTree: '',applicationType:'',majorVersion:'' }},
       upsert:  true
   }
   })
})

await DataRequestModel.bulkWrite(ops);
}


module.exports = { up, down };
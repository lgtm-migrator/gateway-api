import { firebaseml_v1beta2, toolresults_v1beta3 } from 'googleapis';
import { PublisherModel } from '../src/resources/publisher/publisher.model';

// import { Data as ToolModel } from '../src/resources/tool/data.model';

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  const publishers = await PublisherModel.find({ "publisherDetails.memberOf": "HUBS" }).lean();
  let tmp = [];
  publishers.forEach((pub => {
		const { _id } = pub;
    const { name } = pub;
    const { memberOf } = pub.publisherDetails
    tmp.push({
			updateOne: {
				filter: { _id },
				update: {
          "publisherDetails.memberOf": replaceHubs(memberOf),
          name : replaceHubs(name),
				}
			},
		});
  }));
  await PublisherModel.bulkWrite(tmp);
}

function replaceHubs(input) {
 return input.replace('HUBS','HUB')
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
}

module.exports = { up, down };

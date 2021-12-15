import { Data } from '../src/resources/tool/data.model';

/**
 * Make any changes you need to make to the database here
 */
async function up() {
	// Write migration here
	const datasets = await Data.find({
		type: 'dataset',
		'datasetfields.metadataquality.weighted_quality_score': { $type: 2 },
	}).lean();
	let tmpDataset = [];
	datasets.forEach(dataset => {
		const { _id } = dataset;
		tmpDataset.push({
			updateOne: {
				filter: { _id },
				update: {
					'datasetfields.metadataquality.weighted_quality_score': parseFloat(dataset.datasetfields.metadataquality.weighted_quality_score),
				},
			},
		});
	});
	await Data.bulkWrite(tmpDataset);
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
	// Write migration here
}

module.exports = { up, down };

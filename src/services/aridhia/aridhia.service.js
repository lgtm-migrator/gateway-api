import axios from 'axios';

// config
let config = {};
config.endpoint = "https://fair.covid-19.aridhia.io/api/datasets/";
config.token = process.env.ARIDHIA_TOKEN;

// httpService starts here
const http = axios.create({
			headers: {
				Authorization: `Bearer ${config.token}`,
			},
			// timeout: 10000
		});



function getAllDatasetCodesFromTheAPI() {
	let res = getListOfAridhiaDatasets();
	const codes = extractCodesFromAridhiaResponse(res);
	return codes;
}

function getAridhiaDatasetsFromTheAPI(codes){}
function mapAridhiaDatasetsToDatasetsModels(aridhiaDatasets){}
function updateDB(datasets){}

// Utilities

function getListOfAridhiaDatasets() {
	return mock.datasetsList;
}

function extractCodesFromAridhiaResponse(res) {
	const codes = [];
	res.items.forEach(item => {
		codes.push(item.code);
	});

	return codes;
}

export default { 
	extractCodesFromAridhiaResponse
};
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



function getAllDatasetCodesFromTheAPI();
function getAridhiaDatasetsFromTheAPI(codes);
function mapAridhiaDatasetsToDatasetsModels(aridhiaDatasets);
function updateDB(datasets);
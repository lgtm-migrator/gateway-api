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

async function getDataset(code){
	const res = await http.get(config.endpoint + code);
	return res;
}

async function getDatasetLists() {
	const res = await http.get(config.endpoint);
	return res;
}

function resToDataset(res) {

	res = res.data;

	let doc = {
		    pid: `test-${res.code}`,
		    activeflag: "active",
		    contactPoint: res.catalogue.contactPoint,
		    created_at: res.created_at,
		    creator: res.catalogue.creator,
		    datasetfields: { publisher: 'ICODA', phenotypes: [] },
		    datasetid: `datasetid-fair-${res.code}`,
		    description: res.catalogue.description,
		    datasetv2: {},
		    doiName: "" || res.catalogue.identifier,
		    license: res.catalogue.license,
		    name: res.name,
		    publisher: res.catalogue.publisher,
		    rights: res.catalogue.rights,
		    tags: { features: [...res.catalogue.keyword] },
		    title: res.name,		    
		    type: "dataset",
		    created_at: res.catalogue.created_at || "",
		    updated_at: res.catalogue.updated_at || "",
		    id: res.id,
		    version: '1', // our internal definition 
		    counter: 3, // ??
		};

	doc.datasetfields.technicaldetails = resToTechMetaData(res);

	return doc;
}


// Utilities
function getListOfAridhiaDatasets() {
	return mock.datasetsList;
}

function extractCodesFromAridhiaResponse(res) {
	let codes = [];
	res.items.forEach(item => {
		codes.push(item.code);
	});

	return codes;
}

function resToTechMetaData(res) {

	let elements = [];
	if (res.dictionaries.length > 0) {
    	const fields = res.dictionaries[0].fields;
    	elements = fields.map(field => fieldToElement(field));
	}

    const technicalMetadata = [
        {
            description: res.catalogue.description,
            label: res.name,
            elements: elements
        }
    ];

    return technicalMetadata;
}

function fieldToElement(field) {
    return {
		    	label: field.label,
	    	    description: field.description,
	       		dataType: {domainType: "PrimitiveType", label: field.type}
    		};
}

export default { 
	extractCodesFromAridhiaResponse,
	getDatasetLists,
	getDataset,
	resToDataset,
};
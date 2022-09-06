import axios from 'axios';

export default class aridhiaService {
	constructor(config) {
		// private (both)
		this.config = config;
	}

	async getDataset(token, code) {
		const res = await axios.get(this.config.endpoint + code, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return res;
	}

	async getDatasetLists(token) {
		const res = await axios.get(this.config.endpoint, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return res;
	}

	resToDataset(res) {
		res = res.data;
console.log(res);
		let doc = {
			pid: `fair-${res.code}`,
			activeflag: 'active',
			contactPoint: res.catalogue.contactPoint,
			creator: res.catalogue.creator,
			datasetfields: { publisher: 'ICODA', phenotypes: [] },
			datasetid: `datasetid-fair-${res.code}`,
			description: res.catalogue.description,
			datasetv2: {},
			license: res.catalogue.license,
			name: res.catalog.title,
			publisher: res.catalogue.publisher,
			rights: res.catalogue.rights,
			tags: { features: [...res.catalogue.keyword] },
			title: res.name,
			type: 'dataset',
			created_at: res.created_at || '',
			updated_at: res.updated_at || '',
			id: res.id,
			version: '1', // our internal definition
		};

		doc.datasetv2 = this.buildV2(res);
		doc.datasetfields.technicaldetails = this.resToTechMetaData(res);

		if (doc.pid === 'fair-icoda-dummy-dataset') {
			doc.datasetfields.publisher = 'ICODA accreditation';
			doc.datasetv2.summary.publisher.name = 'ICODA accreditation';
		}

		return doc;
	}

	extractCodesFromAridhiaResponse(res) {
		let codes = [];
		res.items.forEach(item => {
			codes.push(item.code);
		});

		return codes;
	}

	// private
	resToTechMetaData(res) {
		let elements = [];
		if (res.dictionaries === 0) return elements;

		// Create list of technical metadatas out of the dictonaries in Aridhia API response
		let technicalMetadata = [];
		for (const dict of res.dictionaries) {
			const fields = dict.fields;
			elements = fields.map(field => this.fieldToElement(field));

			const tableData = {
				description: dict.description,
				label: dict.name,
				elements: elements,
			};

			technicalMetadata.push(tableData);
		}

		return technicalMetadata;
	}

	// private
	fieldToElement(field) {
		return {
			label: field.label,
			description: field.description,
			dataType: { domainType: 'PrimitiveType', label: field.type },
		};
	}

	// private
	buildV2(res) {
		const v2 = {
			issued: res.created_at.substring(0, 10) || '',
			modified: res.updated_at.substring(0, 10) || '',
			identifier: '',
			version: res.catalogue.versionInfo,
			provenance: {
				temporal: {
					startDate: '',
				},
				origin: {
					purpose: '',
					source: '',
				},
			},
			observations: [],
			coverage: { spatial: '' },
			enrichmentAndLinkage: { qualifiedRelation: [] },
			revisions: {
				version: res.catalogue.versionInfo,
				url: '',
			},
			summary: {
				title: res.catalogue.title,
				abstract: res.catalogue.description,
				contactPoint: res.catalogue.contactPoint,
				keywords: res.catalogue.keyword,
				access: { rights: res.catalogue.rights },
				publisher: {
					name: res.catalogue.publisher.name,
					identifier: res.catalogue.publisher.url,
					accessService: '',
					accessRequestCost: '',
				},
			},
		};

		v2.doiName = null;
		if (res.catalogue.identifier) v2.summary.doiName = res.catalogue.identifier;

		v2.summary.contactPoint = null;
		if (res.catalogue.creator && res.catalogue.contactPoint) {
			v2.summary.contactPoint = { contactPoint: `${res.catalogue.creator} ; ${res.catalogue.contactPoint}` };
		}

		v2.accessibility = {
			usage: { resourceCreator: '' },
			formatAndStandards: {
				vocabularyEncodingScheme: '',
				conformsTo: '',
				language: '',
			},
			access: { accessRights: res.catalogue.accessRights || res.catalogue.rights || '' },
		};

		// Added due to changes in the schema that were made in HDR UK
		v2.documentation = { description: '' };

		return v2;
	}
}

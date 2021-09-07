export default class aridhiaService {
	constructor(httpService, config) {
		// private (both)
		this.http = httpService;
		this.config = config;
	}

	async getDataset(code){
		const res = await this.http.get(this.config.endpoint + code);
		return res;
	}

	async getDatasetLists() {
		const res = await this.http.get(this.config.endpoint);
		return res;
	}

	resToDataset(res) {

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
			};
	
		doc.datasetv2 = this.buildV2(res);
		doc.datasetfields.technicaldetails = this.resToTechMetaData(res);
	
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
		if (res.dictionaries.length > 0) {
			const fields = res.dictionaries[0].fields;
			elements = fields.map(field => this.fieldToElement(field));
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

	// private
	fieldToElement(field) {
		return {
					label: field.label,
					description: field.description,
					   dataType: {domainType: "PrimitiveType", label: field.type}
				};
	}

	// private
	buildV2(res) {
		const v2 = {
			identifier: '',
			version: res.catalogue.versionInfo,
			provenance : {
				temporal : {
					startDate : ''
				},
				origin : {
					purpose: '',
					source : ''				
				}
			},
			observations: [],
			coverage: { spatial: '' },
			enrichmentAndLinkage: { 'qualifiedRelation': [] },
			revisions: {
				version: res.catalogue.versionInfo,
				url : ''
			},
			summary: {
				title: res.catalogue.title,
				abstract: res.catalogue.description,
				contactPoint : res.catalogue.contactPoint,
				keywords :  res.catalogue.keyword,
				access: { rights: res.catalogue.rights },
				publisher: {
					name: res.catalogue.publisher.name,
					identifier: res.catalogue.publisher.url,
					accessService: '',
					accessRequestCost: ''
				}
			},
		}
	
		v2.doiName = null;
		if (res.catalogue.identifier)
			v2.doiName = res.catalogue.identifier;
	
		v2.summary.contactPoint = null;
		if (res.catalogue.creator && res.catalogue.contactPoint) {
			v2.summary.contactPoint = { contactPoint: `${res.catalogue.creator} ; ${res.catalogue.contactPoint}`};
		}
	
		v2.accessibility = {
			usage: { resourceCreator: '' },
			formatAndStandards: {
				vocabularyEncodingScheme: '',
				conformsTo: '',
				language: ''
			},
			access: { accessRights: res.catalogue.accessRights || res.catalogue.rights || '' }
		};
		
		return v2;
	}
	
}

export default class Controller {
	constructor(service) {
		this.service = service;
	}

	// processQueryParametersForService(query) {
	// 	const { allowedFilters, allowedOptions } = this.service;
	// 	const allowedQueryParameters = [...allowedFilters, ...allowedOptions];
	// 	let opts = {};

	// 	Object.keys(query).forEach(key => {
	// 	 	if (query[key] && allowedQueryParameters.indexOf(key)) {
	// 			 opts[key] = query[key];
	// 	 	}
	// 	});

	// 	return opts;
	// }
}

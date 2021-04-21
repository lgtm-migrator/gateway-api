// Federated Metadata Catalogue
export const metadataCatalogues = Object.keys(process.env)
	.filter(key => key.match(/^MDC_Config_/g))
	.reduce((obj, key) => {
		const match = key.match(/^MDC_Config_(.*?)_(.*?)$/);
		const catalogue = match[1];
        const catalogueParam = match[2];
		const catalogueValue = process.env[key];

		if (Object.keys(obj).some(key => key === catalogue)) {
			obj = { ...obj, [`${catalogue}`]: { ...obj[`${catalogue}`], [`${catalogueParam}`]: catalogueValue } };
		} else {
			obj = { ...obj, [`${catalogue}`]: { [`${catalogueParam}`]: catalogueValue } };
		}
		return obj;
	}, {});

export const validateCatalogueParams = (params) => {
    const { metadataUrl, username, password, source, instanceType } = params;
    if(!metadataUrl || !username || !password || !source || !instanceType ) {
        return false;
    }
    return true;
};

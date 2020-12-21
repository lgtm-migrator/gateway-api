const {
	JWKS: { KeyStore },
} = require('jose');

const generateKeys = async () => {
	const keystore = new KeyStore();
	await Promise.all([keystore.generate('RSA', 2048, { use: 'sig' }), keystore.generate('RSA', 2048, { use: 'enc' })]).then(() => {
		return keystore.toJWKS(true);
	});
};

export { generateKeys };

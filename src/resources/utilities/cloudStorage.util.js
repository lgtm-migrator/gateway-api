import { Storage } from '@google-cloud/storage';
import fs from 'fs';
const bucketName = process.env.SCAN_BUCKET;
const sourceBucket = process.env.DESTINATION_BUCKET;

export const fileStatus = {
	UPLOADED: 'UPLOADED',
	ERROR: 'ERROR',
	SCANNED: 'SCANNED',
	QUARANTINED: 'QUARANTINED',
};

export const processFile = (file, id, uniqueId) =>
	new Promise(async (resolve, reject) => {
		const storage = new Storage({
			projectId: 'hdruk-gateway-dev',
			credentials: {
				client_email: 'fma-local-secrets-access@hdruk-gateway-dev.iam.gserviceaccount.com',
				private_key:
					'-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCV+y8zcTjzV6zA\njhJQ7HxFFXuD2iZz+SYtIQs1woA7HApv3EMRM4b38xwdYU242kCACym09B/BJG1w\nRiJNDU4wemKHAZyw2+lfwQd+DCPmwWO/BRXdJfCSegG96kVKmLRCwk3a08wKXNkX\n+UAW30bgM7q39RszB6gVOh92mEBEWzGZpqR/fBLMdW1UZw4AoOXvpurFaMLIfnu0\nNURNktYX+tKtOIhvZaLVl4hk30B/z6ceE/2tUXtmZBR4779q3YmfWAtoMkqNli5c\noEvoj+QJ6LjhUJ46rXAwpcQ+jkxY+Pqxa6FgHT3UP2/n1vmucjGPEQ/bCj2MRHK1\nrTkzBcTXAgMBAAECggEAJOOw4ubE2rmkYIIxSB06naVgiXhFP/42oSABCVqLPr6x\nZH0ZM+hoGKF/t0xBGSf5eGUGf58SFmf20Qg3FJuisTLQ/CLt3uRgPPCV/q9Ov0mu\n1oOSMqBL0UNYHVW7cFMp90eibaHtjFj0/rwMQvPtE2U11lxfscf+1CXFKl7dY9Jn\nrwchIRKadK1MU31BL9jcA9TapOlpLWAw7IVzMDLW7fexSZ0BdNlsWCuamRN7mR37\nHQpf60oNonUPHJDZxBiaawxIZCcPxazCVGgEvANlmUbAYtvbIQNzNi/iPokklGr5\nG9i8Sb1smQSPs1sNcF2iYwrlTpLVXHs7XBQJILy37QKBgQDTfa/xdtY9EWnfeoIr\n7A3d/dJszpxvY43BjDSL0uE2VaRg4BkT6lcndeQIZINzfN/gfQ35QDO6hL1VIjw0\nHRmNHPsUy2yNaeMphR6IHeb/93fbHFCaxIt3rDUJ0AWBUI4sQ9az+gSlxuHoUP72\ncojzSpWH8BFAzN2sriRJWPGphQKBgQC1i5bF9hAYxwQCqYCQyC0bQuYOp7dGCJOH\nywLor1MGSNPGwP4mmZvnEGPuFJMGjFNC3F1PWh1Vc58+C9xkzNm6TiZfPW/syazX\nSpgBJBPp7fSt4KE7zYC9RxCx0UE82Iq8R0tQolCePSpxlj6FtXdQaMBKshNHq8lW\nAVGqms01qwKBgHqy4s7OSUEoxynWo4rj6q+uQNTLkcq2EVoHA71TXUHuse1aVnJN\ndL76EJAl8HWiLyjIpMDE1L4ToNyxfggmEdriw3CvDI2Grzo5dxs1bf13D1xZsxH3\nkYqeqC7HN0ps9+8KdJf6J5QeLJZh12oXzQiJbvNs/jWAJeO3LGo5ZgsZAoGBAJH1\n19PzYL+7CoNlakN9XZ6ka7juqRB6hrrPwtf3VgYgeXw74FqCd/EPoXhiPE8wdSS1\nbaQF7L2uRyKogJrehFMg0AMUry8uenNhutJ4Aja7JVTC3H7rW41SXJ7Kgev8oZZ8\nr5X12mFPBhfq1vvDiVkxzyB/Cbc+65HlX5aN/V0fAoGAd3ylo4DIFUofFOM+/vb4\npWYyhddemfuZqOIPFRjXkqsN1rm4JdI14Cs7yxFan8WvENPkAL4dxzj4GOShZ+Qm\n3Z9qz1HNY766RBgv0hiFcxKOSQrJCbW0CGdtTyrXruNkM0z1cTotAl4tgB77XeVT\nbRhqFGhcUGG5YWP4ZTeEhrU=\n-----END PRIVATE KEY-----\n',
			},
		});
		let { originalname, path } = file;

		storage.bucket(bucketName).upload(
			path,
			{
				gzip: true,
				destination: `dar-${id.toString()}-${uniqueId}_${originalname}`,
				metadata: { cacheControl: 'none-cache' },
			},
			(err, file) => {
				if (!err) {
					// remove temp dir / path = dir
					fs.unlinkSync(path);
					// resolve
					resolve({ status: fileStatus.UPLOADED, file });
				} else {
					console.log('err', err);
					resolve({ status: fileStatus.ERROR, file });
				}
			}
		);
	});

export const getFile = (file, fileId, id) =>
	new Promise(async resolve => {
		// 1. new storage obj
		const storage = new Storage({
			projectId: 'hdruk-gateway-dev',
			credentials: {
				client_email: 'fma-local-secrets-access@hdruk-gateway-dev.iam.gserviceaccount.com',
				private_key:
					'-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCV+y8zcTjzV6zA\njhJQ7HxFFXuD2iZz+SYtIQs1woA7HApv3EMRM4b38xwdYU242kCACym09B/BJG1w\nRiJNDU4wemKHAZyw2+lfwQd+DCPmwWO/BRXdJfCSegG96kVKmLRCwk3a08wKXNkX\n+UAW30bgM7q39RszB6gVOh92mEBEWzGZpqR/fBLMdW1UZw4AoOXvpurFaMLIfnu0\nNURNktYX+tKtOIhvZaLVl4hk30B/z6ceE/2tUXtmZBR4779q3YmfWAtoMkqNli5c\noEvoj+QJ6LjhUJ46rXAwpcQ+jkxY+Pqxa6FgHT3UP2/n1vmucjGPEQ/bCj2MRHK1\nrTkzBcTXAgMBAAECggEAJOOw4ubE2rmkYIIxSB06naVgiXhFP/42oSABCVqLPr6x\nZH0ZM+hoGKF/t0xBGSf5eGUGf58SFmf20Qg3FJuisTLQ/CLt3uRgPPCV/q9Ov0mu\n1oOSMqBL0UNYHVW7cFMp90eibaHtjFj0/rwMQvPtE2U11lxfscf+1CXFKl7dY9Jn\nrwchIRKadK1MU31BL9jcA9TapOlpLWAw7IVzMDLW7fexSZ0BdNlsWCuamRN7mR37\nHQpf60oNonUPHJDZxBiaawxIZCcPxazCVGgEvANlmUbAYtvbIQNzNi/iPokklGr5\nG9i8Sb1smQSPs1sNcF2iYwrlTpLVXHs7XBQJILy37QKBgQDTfa/xdtY9EWnfeoIr\n7A3d/dJszpxvY43BjDSL0uE2VaRg4BkT6lcndeQIZINzfN/gfQ35QDO6hL1VIjw0\nHRmNHPsUy2yNaeMphR6IHeb/93fbHFCaxIt3rDUJ0AWBUI4sQ9az+gSlxuHoUP72\ncojzSpWH8BFAzN2sriRJWPGphQKBgQC1i5bF9hAYxwQCqYCQyC0bQuYOp7dGCJOH\nywLor1MGSNPGwP4mmZvnEGPuFJMGjFNC3F1PWh1Vc58+C9xkzNm6TiZfPW/syazX\nSpgBJBPp7fSt4KE7zYC9RxCx0UE82Iq8R0tQolCePSpxlj6FtXdQaMBKshNHq8lW\nAVGqms01qwKBgHqy4s7OSUEoxynWo4rj6q+uQNTLkcq2EVoHA71TXUHuse1aVnJN\ndL76EJAl8HWiLyjIpMDE1L4ToNyxfggmEdriw3CvDI2Grzo5dxs1bf13D1xZsxH3\nkYqeqC7HN0ps9+8KdJf6J5QeLJZh12oXzQiJbvNs/jWAJeO3LGo5ZgsZAoGBAJH1\n19PzYL+7CoNlakN9XZ6ka7juqRB6hrrPwtf3VgYgeXw74FqCd/EPoXhiPE8wdSS1\nbaQF7L2uRyKogJrehFMg0AMUry8uenNhutJ4Aja7JVTC3H7rW41SXJ7Kgev8oZZ8\nr5X12mFPBhfq1vvDiVkxzyB/Cbc+65HlX5aN/V0fAoGAd3ylo4DIFUofFOM+/vb4\npWYyhddemfuZqOIPFRjXkqsN1rm4JdI14Cs7yxFan8WvENPkAL4dxzj4GOShZ+Qm\n3Z9qz1HNY766RBgv0hiFcxKOSQrJCbW0CGdtTyrXruNkM0z1cTotAl4tgB77XeVT\nbRhqFGhcUGG5YWP4ZTeEhrU=\n-----END PRIVATE KEY-----\n',
			},
		});
		//  2. set option for file dest
		let options = {
			// The path to which the file should be downloaded
			destination: `${process.env.TMPDIR}${id.toString()}/${fileId}_${file}`,
		};
		// create tmp
		const sanitisedId = id.toString().replace(/[^0-9a-z]/gi, '');

		const filePath = `${process.env.TMPDIR}${sanitisedId}`;

		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath);
		}
		// 3. set path
		const path = `dar/${sanitisedId}/${fileId}_${file}`;
		// 4. get file from GCP
		resolve(storage.bucket(sourceBucket).file(path).download(options));
	});

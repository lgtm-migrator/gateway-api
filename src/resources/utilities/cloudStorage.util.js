import {Storage} from '@google-cloud/storage';
import fs from 'fs';
const bucketName = process.env.SCAN_BUCKET;
const sourceBucket = process.env.DESTINATION_BUCKET;

export const fileStatus = {
	UPLOADED: 'UPLOADED',
  ERROR: 'ERROR',
  SCANNED: 'SCANNED'
};

export const processFile = (file, id, uniqueId) => new Promise(async (resolve, reject) => {
  const storage = new Storage();
  let { originalname, path } = file;
    storage.bucket(bucketName).upload(path, {
      gzip: true,
      destination: `dar-${id}-${uniqueId}_${originalname}`,
      metadata: { cacheControl: 'none-cache'}
    }, (err, file) => {
      if(!err) {
        // remove temp dir / path = dir
        fs.unlinkSync(path);
        // resolve
        resolve({status: fileStatus.UPLOADED, file});
      } else {
        resolve({status: fileStatus.ERROR, file});
      }
    });
});

export const getFile = (file, fileId, id) => new Promise(async (resolve) => {
  // 1. new storage obj
  const storage = new Storage();
  //  2. set option for file dest
  let options = {
    // The path to which the file should be downloaded
    destination: `${process.env.TMPDIR}${id}/${fileId}_${file}`,
  };
  // create tmp
  if (!fs.existsSync(`${process.env.TMPDIR}${id}`)) {
    fs.mkdirSync(`${process.env.TMPDIR}${id}`);
  }
  // 3. set path
  const path = `dar/${id}/${fileId}_${file}`;
  // 4. get file from GCP
  resolve(storage.bucket(sourceBucket).file(path).download(options));
});

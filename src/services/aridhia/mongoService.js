import { MongoClient } from 'mongodb';
import Db from 'mongodb';

const user = process.env.MONGO_USERNAME;;
const password = process.env.MONGO_PASSWORD;


async function main(){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    const uri = `mongodb+srv://${user}:${password}@devcluster.dc8xb.gcp.mongodb.net/icodadev-sam`;
    const client = new MongoClient(uri);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
 		const db = client.db('icodadev-sam');
        let res =  await db.collection("tools").findOne({type: "dataset"});
        // Make the appropriate DB calls
        return db;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertOne(dataset) {
	const uri = `mongodb+srv://${user}:${password}@devcluster.dc8xb.gcp.mongodb.net/icodadev-sam`;
    const client = new MongoClient(uri);
 
    try {
        await client.connect();
 		const db = client.db('icodadev-sam');
        let res =  await db.collection("tools").insertOne(dataset);
        return res;
    } catch (e) {
        console.error("error inside mongo service: " + e);
    } finally {
        await client.close();
    }
}

async function replaceOne(dataset) {
	const uri = `mongodb+srv://${user}:${password}@devcluster.dc8xb.gcp.mongodb.net/icodadev-sam`;
    const client = new MongoClient(uri);
 
    try {
        await client.connect();
 		const db = client.db('icodadev-sam');
        let res =  await db.collection("tools").replaceOne( {type: "dataset"}, dataset);
        return res;
    } catch (e) {
        console.error("error inside mongo service: " + e);
    } finally {
        await client.close();
    }
}

async function findByPid(pid) {
    const uri = `mongodb+srv://${user}:${password}@devcluster.dc8xb.gcp.mongodb.net/icodadev-sam`;
    const client = new MongoClient(uri);

    try {
        await client.connect();
 		const db = client.db('icodadev-sam');
        let res = await db.collection("tools").find({type: "dataset", pid: pid}).toArray();
        return res;
    } catch (e) {
        console.error("error inside mongo service: " + e);
    } finally {
        await client.close();
    }
}

// main().catch(console.error);

export default {
	insertOne,
    replaceOne,
    findByPid
};
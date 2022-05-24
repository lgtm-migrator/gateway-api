import { createClient } from 'redis';
const client = createClient({ 
    url: process.env.CACHE_URL
});

export const publishMessageToChannel = async (channel, message) => {
    await client.connect();

    client.on("connect", () => console.log("Redis cache is ready"));
    client.on("error", (err) => console.log('Redis Client Error', err));
    client.on('ready', () => console.log('redis is running'));

    await client.publish(channel, message);
}
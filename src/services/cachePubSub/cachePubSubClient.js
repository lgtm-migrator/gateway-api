import { createClient } from 'redis';

export const publishMessageToChannel = async (channel, message) => {
    try {
        const client = createClient({ 
            url: process.env.CACHE_URL
        });

        if (!client.isOpen) {
            await client.connect();
        }
    
        client.on("connect", () => console.log("Redis cache is ready"));
        client.on("error", (err) => console.log('Redis Client Error', err));
        client.on('ready', () => console.log('redis is running'));
    
        await client.publish(channel, message);
    
    } catch (e) {
        console.log(e);
        throw new Error(e.message);
    }
}
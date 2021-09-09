import axios from 'axios';

// config
let config = {};
// config.endpoint = process.env.ARIDHIA_ENDPOINT;
config.token = process.env.ARIDHIA_TOKEN;
config.logCategory = "Aridhia Script";

const http = axios.create({
    headers: {
        Authorization: `Bearer ${config.token}`,
    },
    // timeout: 10000
}); 

export { config, http };
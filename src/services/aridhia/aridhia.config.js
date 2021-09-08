import axios from 'axios';

// config
let config = {};
config.endpoint = "https://fair.covid-19.aridhia.io/api/datasets/";
config.token = process.env.ARIDHIA_TOKEN;

const http = axios.create({
    headers: {
        Authorization: `Bearer ${config.token}`,
    },
    // timeout: 10000
}); 

export { config, http };
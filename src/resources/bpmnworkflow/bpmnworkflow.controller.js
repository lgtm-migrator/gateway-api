import bpmnworkflow from '../utilities/bpmnworkflow.util';
import axios from 'axios';

const postOptions = {
    hostname: '',
    port: 80,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const updateOptions = {
    hostname: '',
    port: 80,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const getOptions = {
    hostname: '',
    port: 80,
    path: '/',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};


module.exports = {
    postCreateProcess: async (req, res) => {
        try {
            const req = http.request(postOptions, (res) => {

            });
        } catch {
            return res.status(500).json({ success: false, message: 'An error occurred creating workflow process'});
        }
    },
    postUpdateProcess: async (req, res) => {
        try {
            const req = http.request(updateOptions, (res) => {

            });
        } catch {
            return res.status(500).json({success: false, message: 'An error occurred updating the workflow process'});
        }
    },
    getProcess: async (req, res) => {
        try {
            const req = http.request
        } catch {
            return res.status(500).json({success: false, message: 'Failed to fetch workflow process'});
        }
    }

}
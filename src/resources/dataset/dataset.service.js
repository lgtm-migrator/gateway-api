import { Data } from '../tool/data.model'
import axios from 'axios';

export async function loadDatasets(override) { //force with ID
    

    return true;
};

function splitString (array) {
    var returnArray = [];
    if (array !== null && array !== '' && array !== 'undefined' && array !== undefined) {
        if (array.indexOf(',') === -1) {
            returnArray.push(array.trim());
        }
        else {
            array.split(',').forEach((term) => {
                returnArray.push(term.trim());
            });
        }
    }
    return returnArray;
}
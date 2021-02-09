import express from 'express';
import DatasetController from '../dataset.controller';
import { datasetService } from '../dependency';

const router = express.Router();
const datasetController = new DatasetController(datasetService);

// @route   GET /api/v2/datasets/id
// @desc    Returns a dataset based on either dataset ID or PID (persistent identifier) provided
// @access  Public
router.get('/:id', (req, res) => datasetController.getDataset(req, res));

// @route   GET /api/v2/datasets
// @desc    Returns a collection of datasets based on supplied query parameters
// @access  Public
//router.get('/', datasetController.getDatasets);

module.exports = router;

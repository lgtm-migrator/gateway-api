import express from 'express';
import {
    checkInputMiddleware,
    checkMinLengthMiddleware,
} from '../../middlewares/index';

const router = express.Router();
const LocationController = require('./LocationController');

router.get(
    '/:filter',
    [checkInputMiddleware, checkMinLengthMiddleware],
    (req, res) => LocationController.getData(req, res),
);

module.exports = router;
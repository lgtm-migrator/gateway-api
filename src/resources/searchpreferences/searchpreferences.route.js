/* eslint-disable no-undef */
import express from 'express';
import passport from 'passport';
import {
	addUserSearchPreference,
	deleteUserSearchPreference,
	getAllSavedSearchPreferences,
	getSavedSearchPreference,
} from '../searchpreferences/searchpreferences.repository';
const router = express.Router();

// @router   POST /api/v1/search-preferences
// @desc     Add search preferences for a user
// @access   Private
router.post('/', passport.authenticate('jwt'), async (req, res) => {
	await addUserSearchPreference(req)
		.then(response => {
			return res.json({ success: true, response });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @router   GET /api/v1/search-preferences
// @desc     Returns List of all search-preferences for a user
// @access   Private
router.get('/', passport.authenticate('jwt'), async (req, res) => {
	await getAllSavedSearchPreferences(req)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @router   GET /api/v1/search-preferences
// @desc     Returns a single search preferences for a user
// @access   Private
router.get('/:id', passport.authenticate('jwt'), async (req, res) => {
	await getSavedSearchPreference(req)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @router   DELETE /api/v1/search-preferences
// @desc     Deletes a single search preferences for a user
// @access   Private
router.delete('/:id', passport.authenticate('jwt'), async (req, res) => {
	await deleteUserSearchPreference(req)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

module.exports = router;

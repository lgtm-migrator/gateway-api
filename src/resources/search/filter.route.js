import express from 'express';
import { getObjectFilters, getFilter } from './search.repository';
import { filtersService } from '../filters/dependency';
import { isEqual, lowerCase, isEmpty } from 'lodash';

const router = express.Router();

// @route   GET api/v1/search/filter
// @desc    GET Get filters
// @access  Public
router.get('/', async (req, res) => {
	let searchString = req.query.search || ''; //If blank then return all
	let tab = req.query.tab || ''; //If blank then return all
	if (tab === '') {
		let searchQuery = { $and: [{ activeflag: 'active' }] };
		if (searchString.length > 0) searchQuery['$and'].push({ $text: { $search: searchString } });

		await Promise.all([
			getFilter(searchString, 'tool', 'tags.topic', true, getObjectFilters(searchQuery, req, 'tool')),
			getFilter(searchString, 'tool', 'tags.features', true, getObjectFilters(searchQuery, req, 'tool')),
			getFilter(searchString, 'tool', 'programmingLanguage.programmingLanguage', true, getObjectFilters(searchQuery, req, 'tool')),
			getFilter(searchString, 'tool', 'categories.category', false, getObjectFilters(searchQuery, req, 'tool')),

			getFilter(searchString, 'project', 'tags.topics', true, getObjectFilters(searchQuery, req, 'project')),
			getFilter(searchString, 'project', 'tags.features', true, getObjectFilters(searchQuery, req, 'project')),
			getFilter(searchString, 'project', 'categories.category', false, getObjectFilters(searchQuery, req, 'project')),

			getFilter(searchString, 'paper', 'tags.topics', true, getObjectFilters(searchQuery, req, 'project')),
			getFilter(searchString, 'paper', 'tags.features', true, getObjectFilters(searchQuery, req, 'project')),
		]).then(values => {
			return res.json({
				success: true,
				allFilters: {
					toolTopicFilter: values[0][0],
					toolFeatureFilter: values[1][0],
					toolLanguageFilter: values[2][0],
					toolCategoryFilter: values[3][0],

					projectTopicFilter: values[4][0],
					projectFeatureFilter: values[5][0],
					projectCategoryFilter: values[6][0],

					paperTopicFilter: values[7][0],
					paperFeatureFilter: values[8][0],
				},
				filterOptions: {
					toolTopicsFilterOptions: values[0][1],
					featuresFilterOptions: values[1][1],
					programmingLanguageFilterOptions: values[2][1],
					toolCategoriesFilterOptions: values[3][1],

					projectTopicsFilterOptions: values[4][1],
					projectFeaturesFilterOptions: values[5][1],
					projectCategoriesFilterOptions: values[6][1],

					paperTopicsFilterOptions: values[7][1],
					paperFeaturesFilterOptions: values[8][1],
				},
			});
		});
	} else {
		const type = !isEmpty(tab) && typeof tab === 'string' ? lowerCase(tab.substring(0, tab.length - 1)) : '';
		let defaultQuery = { $and: [{ activeflag: 'active' }] };
		if (tab === 'collection') {
			defaultQuery['$and'].push({ publicflag: true });
		} else if (tab === 'course') {
			defaultQuery['$and'].push({
				$or: [{ 'courseOptions.startDate': { $gte: new Date(Date.now()) } }, { 'courseOptions.flexibleDates': true }],
			});
		}

		if (searchString.length > 0) defaultQuery['$and'].push({ $text: { $search: searchString } });
		const filterQuery = getObjectFilters(defaultQuery, req, type);
		const useCachedFilters = isEqual(defaultQuery, filterQuery) && searchString.length === 0;

		const filters = await filtersService.buildFilters(type, filterQuery, useCachedFilters);
		return res.json({
			success: true,
			filters,
		});
	}
});

// @route   GET api/v1/search/filter/topic/:type
// @desc    GET Get list of topics by entity type
// @access  Public
router.get('/topic/:type', async (req, res) => {
	await getFilter('', req.params.type, 'tags.topics', true, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/feature/:type
// @desc    GET Get list of features by entity type
// @access  Public
router.get('/feature/:type', async (req, res) => {
	await getFilter('', req.params.type, 'tags.features', true, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/language/:type
// @desc    GET Get list of languages by entity type
// @access  Public
router.get('/language/:type', async (req, res) => {
	await getFilter(
		'',
		req.params.type,
		'programmingLanguage.programmingLanguage',
		true,
		getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type)
	)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/category/:type
// @desc    GET Get list of categories by entity type
// @access  Public
router.get('/category/:type', async (req, res) => {
	await getFilter(
		'',
		req.params.type,
		'categories.category',
		false,
		getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type)
	)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/license/:type
// @desc    GET Get list of licenses by entity type
// @access  Public
router.get('/license/:type', async (req, res) => {
	await getFilter('', req.params.type, 'license', false, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/organisation/:type
// @desc    GET Get list of organisations by entity type
// @access  Public
router.get('/organisation/:type', async (req, res) => {
	await getFilter('', req.params.type, 'organisation', false, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/domains/:type
// @desc    GET Get list of features by entity type
// @access  Public
router.get('/domains/:type', async (req, res) => {
	await getFilter('', req.params.type, 'domains', true, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/keywords/:type
// @desc    GET Get list of features by entity type
// @access  Public
router.get('/keywords/:type', async (req, res) => {
	await getFilter('', req.params.type, 'keywords', true, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

// @route   GET api/v1/search/filter/awards/:type
// @desc    GET Get list of features by entity type
// @access  Public
router.get('/awards/:type', async (req, res) => {
	await getFilter('', req.params.type, 'award', true, getObjectFilters({ $and: [{ activeflag: 'active' }] }, req, req.params.type))
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

module.exports = router;

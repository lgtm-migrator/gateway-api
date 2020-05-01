import express from 'express'
import { RecordSearchData } from '../../../database/schema';
import { Data } from '../tool/data.model'

const router = express.Router();

/**
 * {get} /api/search Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/', async (req, res) => {
    var result;
    var startIndex = 0;
    var maxResults = 25;
    var searchString = "";
    var typeString = "";
    var programmingLanguage = "";
    var category = "";
    var features = "";
    var topics = "";
  
    if (req.query.startIndex) {
      startIndex = req.query.startIndex;
    }
  
    if (req.query.maxResults) {
      maxResults = req.query.maxResults;
    }
  
    if (req.query.search) {
      searchString = req.query.search;
    }
  
    if (req.query.type) {
      if (req.query.type === "all") {
        typeString = '';
      }
      else {
        typeString = req.query.type;
      }
    }
  
    if (req.query.programmingLanguage) {
      programmingLanguage = req.query.programmingLanguage;
  }
  
    if (req.query.category) {
      category = req.query.category;
    }
  
    if (req.query.features) {
      features = req.query.features;
    }
  
    if (req.query.topics) {
      topics = req.query.topics;
    }
  
    var searchQuery = { $and: [{ activeflag: 'active' }] };
    var aggregateQueryTypes = [
      {
        $match: {
          $and: [
            { activeflag: 'active' }
          ]
        }
      },
      {
        $group: {
          _id: "$type", count: { $sum: 1 }
        }
      }
    ];
  
    if (typeString !== '') {
      searchQuery["$and"].push({ type: typeString });
      aggregateQueryTypes[0]["$match"]["$and"].push({ type: typeString });
    }
  
    if (searchString.length > 0) {
      searchQuery["$and"].push({ $text: { $search: searchString } });
      aggregateQueryTypes[0]["$match"]["$and"].push({ $text: { $search: searchString } });
    }
  
    if (programmingLanguage.length > 0) {
      var pl = [];
      if (!Array.isArray(programmingLanguage)) {
        pl = [{ "categories.programmingLanguage": programmingLanguage }];
      } else {
        for (var i = 0; i < programmingLanguage.length; i++) {
          pl[i] = { "categories.programmingLanguage": programmingLanguage[i] };
        }
      }
      searchQuery["$and"].push({ "$or": pl });
      aggregateQueryTypes[0]["$match"]["$and"].push({ "$or": pl });
    }
  
    if (category.length > 0) {
      var tc = [];
      if (!Array.isArray(category)) {
        tc = [{"categories.category": category}];
      } else {
        for (var i = 0; i < category.length; i++) {
          tc[i] = {"categories.category":category[i]};
        }
      }
      searchQuery["$and"].push({"$or":tc});
      aggregateQueryTypes[0]["$match"]["$and"].push({"$or":tc});
    } 
  
    if (features.length > 0) {
      var f = [];
      if (!Array.isArray(features)) {
        f = [{"tags.features": features}];
      } else {
        for (var i = 0; i < features.length; i++) {
          f[i] = {"tags.features":features[i]};
        }
      }
      searchQuery["$and"].push({"$or":f});
      aggregateQueryTypes[0]["$match"]["$and"].push({"$or":f});
    } 
  
    if (topics.length > 0) {
      var t = [];
      if (!Array.isArray(topics)) {
        t = [{"tags.topics": topics}];
      } else {
        for (var i = 0; i < topics.length; i++) {
          t[i] = {"tags.topics":topics[i]};
        }
      }
      searchQuery["$and"].push({"$or":t});
      aggregateQueryTypes[0]["$match"]["$and"].push({"$or":t});
    } 
  
    var x = Data.aggregate(aggregateQueryTypes);
    x.exec((errx, dataTypes) => {
      if (errx) return res.json({ success: false, error: errx });
  
      var counts = {}; //hold the type (i.e. tool, person, project) counts data
      for (var i = 0; i < dataTypes.length; i++) { //format the result in a clear and dynamic way
        counts[dataTypes[i]._id] = dataTypes[i].count;
      }
  
      var q = '';
      if (searchString.length > 0) {
        q = Data.aggregate([
          { $match: searchQuery },
          { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
          { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "objects" } },
          { $lookup: { from: "reviews", localField: "id", foreignField: "toolID", as: "reviews" } }
        ]).sort({ score: { $meta: "textScore" } }).skip(parseInt(startIndex)).limit(parseInt(maxResults));
      }
      else {
        q = Data.aggregate([
          { $match: searchQuery },
          { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
          { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "objects" } },
          { $lookup: { from: "reviews", localField: "id", foreignField: "toolID", as: "reviews" } }
        ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
      }
  
      q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        result = res.json({ success: true, data: data, summary: counts });
        let recordSearchData = new RecordSearchData();
        recordSearchData.searched = searchString;
        recordSearchData.returned.tool = counts.tool;
        recordSearchData.returned.project = counts.project;
        recordSearchData.returned.person = counts.person;
        recordSearchData.datesearched = Date.now();
        recordSearchData.save((err) => { });
      });
    });
    return result;
  });

  module.exports = router;
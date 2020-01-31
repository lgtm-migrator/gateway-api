const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const Data = require('./models/tools');
//const DataNew = require('./models/newData');

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();

/*const dbName = 'sample_airbnb';
const collectionName = 'listingsAndReviews';*/

const dbName = 'HDRUKRDT';
//const collectionName = 'testCollection';

// this is our MongoDB database
const dbRoute =
    'mongodb://first-user:Password2@cluster0-shard-00-00-cenin.gcp.mongodb.net:27017,cluster0-shard-00-01-cenin.gcp.mongodb.net:27017,cluster0-shard-00-02-cenin.gcp.mongodb.net:27017/'+dbName+'?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority';
// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true });





let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));

// checks if connection with the database is successful
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));



// this is our get method
// this method fetches all available data in our database
/* router.get('/getData', (req, res) => {
    Data.find((err, data) => {
        if (err) return res.json({ success: false, error: err });
        
        return res.json({ success: true, data: data });
    }); //.sort({id: 'asc'}).limit(2)
}); */

//Same as above, just with query built before excuting
router.get('/getData', (req, res) => {
  var q = Data.find().sort({id: 'desc'}).limit(3);

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});




//this is a get method that only returns what we look for i.e. 
//search matches 
router.post('/getDataSearch', (req, res) => {
    const { search } = req.body;
    Data.find({ $or: [
      {name: { "$regex": search, "$options": "i" }},
      {description: { "$regex": search, "$options": "i" }
    }]}, (err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
});





// this is our update method
// this method overwrites existing data in our database
router.post('/updateData', (req, res) => {
  const { id, update } = req.body;
  Data.findByIdAndUpdate(id, update, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});





// this is our delete method
// this method removes existing data in our database
router.delete('/deleteData', (req, res) => {
  const { id } = req.body;
  Data.findByIdAndRemove(id, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});






// this is our create methid
// this method adds new data in our database
router.post('/putData', (req, res) => {
  let data = new Data();

  const { id, type, name, description, rating, link } = req.body;

  if ((!id && id !== 0) || !type || !name) {
    return res.json({
      success: false,
      error: 'INVALID INPUTS',
    });
  }

  data.id = id;
  data.type = type;
  data.name = name;
  data.description = description;
  data.rating = rating;
  data.link = link;

  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });

  
});




// append /api for our http requests
app.use('/api', router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));



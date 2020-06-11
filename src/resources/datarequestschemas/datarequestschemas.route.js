import express from 'express';
import axios from 'axios';
import { DataRequestSchemaModel } from './datarequestschemas.model';
import { find } from 'async';

const router = express.Router();

// @router   POST /datarequestschemas/
// @desc     Add a data request schema
// @access   Private
router.post('/', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
  const { version, status, dataSetId, userId, jsonSchema } = req.body;
  const dataRequestSchema = new DataRequestSchemaModel();
  dataRequestSchema.id = parseInt(Math.random().toString().replace('0.', ''));
  dataRequestSchema.status = status;
  dataRequestSchema.version = version;
  dataRequestSchema.dataSetId = dataSetId;
  dataRequestSchema.jsonSchema = JSON.stringify(jsonSchema);

  await dataRequestSchema.save(async (err) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, id: dataRequestSchema.id });
  });
  await archiveOtherVersions(dataRequestSchema.id, dataSetId, status);
});

// @router   GET /datarequestschemas/schema
// @desc     Get a data request schema
// @access   Private
router.get('/schema', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
  const { dataSetId } = req.body;
  let dataRequestSchema = await DataRequestSchemaModel.findOne({ $and: [{ dataSetId: dataSetId }, { status: 'active' }] });
  return res.json({ jsonSchema: dataRequestSchema.jsonSchema });
});
module.exports = router;

async function archiveOtherVersions(id, dataSetId, status) {
  try {
    if ((status = 'active')) {
      await DataRequestSchemaModel.updateMany(
        { $and: [{ dataSetId: dataSetId }, { id: { $ne: id } }] },
        { $set: { status: 'archive' } },
        async (err) => {
          if (err) return new Error({ success: false, error: err });

          return { success: true };
        }
      );
    }
  } catch (err) {
    console.log(err);
  }
}

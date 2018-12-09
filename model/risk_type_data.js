const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Risk Type Data Schema
const RiskTypeDataSchema = mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  project_risk_type_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectRiskTypeData' }],

  risk_title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    trim: true
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

const RiskTypeData = module.exports = mongoose.model('RiskTypeData', RiskTypeDataSchema);

module.exports.getRiskTypeDataById = function (id, callback) {
  RiskTypeData.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.addRiskTypeData = function (newRiskTypeData, callback) {
  newRiskTypeData.save(callback);
}

module.exports.getAllRiskTypeData = function (organization_id, callback) {
  let query = {};
  if (organization_id) {
    query = { organization_id };
  }
  RiskTypeData.find(query, callback);
}
const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Project Risk Priority Data Schema
const ProjectRiskPriorityDataSchema = mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  risk_priority_title: {
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

const ProjectRiskPriorityData = module.exports = mongoose.model('ProjectRiskPriorityData', ProjectRiskPriorityDataSchema);

module.exports.getProjectRiskPriorityDataById = function (id, callback) {
  ProjectRiskPriorityData.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.addProjectRiskPriorityData = function (newProjectRiskPriorityData, callback) {
  newProjectRiskPriorityData.save(callback);
}

module.exports.getAllProjectRiskPriorityData = function (organization_id, callback) {
  let query = {};
  if (organization_id) {
    query = { organization_id };
  }
  ProjectRiskPriorityData.find(query, callback);
}
const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Project Risk Type Schema
const ProjectRiskTypeSchema = mongoose.Schema({

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

    description: {
      type: String,
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

const ProjectRiskType = module.exports = mongoose.model('ProjectRiskType', ProjectRiskTypeSchema);

module.exports.getProjectRiskTypeById = function(id, callback) {
    ProjectRiskType.findOne({ "_id": mongoose.Types.ObjectId(id) },callback)
}

module.exports.addProjectRiskType = function(newProjectRiskType, callback) {
  newProjectRiskType.save(callback);
}

module.exports.getAllProjectRiskType = function(callback) {
    ProjectRiskType.find({}).exec(callback);
}
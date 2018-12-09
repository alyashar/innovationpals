const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Project Risk Priority Schema
const ProjectRiskPrioritySchema = mongoose.Schema({

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

const ProjectRiskPriority = module.exports = mongoose.model('ProjectRiskPriority', ProjectRiskPrioritySchema);

module.exports.getProjectRiskPriorityById = function(id, callback) {
  ProjectRiskPriority.findOne({ "_id": mongoose.Types.ObjectId(id) },callback)
}

module.exports.addProjectRiskPriority = function(newProjectRiskPriority, callback) {
  newProjectRiskPriority.save(callback);
}

module.exports.getAllProjectRiskPriority = function(callback) {
  ProjectRiskPriority.find({}).exec(callback);
}
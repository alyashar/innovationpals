const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Project Risk Schema
const ProjectRiskSchema = mongoose.Schema({

    risk_title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    probability: {
      type: String,
      required: true,
      trim: true
    },

    impact: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: Boolean,
      default: true
    },

    identified_date: {
      type: Date,
      default: Date.now
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
// OrganizationSchema.plugin(mongooseAutopopulate);

const ProjectRisk = module.exports = mongoose.model('ProjectRisk', ProjectRiskSchema);

module.exports.addProjectRisk = function(newProjectRisk, callback) {
    newProjectRisk.save(callback);
}

module.exports.getAllProjectRisk = function(callback) {
    ProjectRisk.find({},callback)
}

module.exports.getProjectRiskById = function (id, callback) {
  ProjectRisk.findById({ "_id": id.toString() }).
      exec(callback);
}

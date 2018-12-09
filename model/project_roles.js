const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Project Roles Schema
const ProjectRolesSchema = mongoose.Schema({

    title: {
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

ProjectRolesSchema.plugin(mongoosePaginate);

const ProjectRoles = module.exports = mongoose.model('ProjectRoles', ProjectRolesSchema);

module.exports.addProjectRoles = function(newProjectRoles, callback) {
    newProjectRoles.save(callback);
}

module.exports.getProjectRolesById = function(id, callback) {
    ProjectRoles.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getProjectRoles = function(page, limit, callback) {
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false
        }
        ProjectRoles.paginate({}, options, callback);
    } else {
        ProjectRoles.find({})
            .exec(callback);
    }
}
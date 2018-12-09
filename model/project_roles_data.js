const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Project Roles Data Schema
const ProjectRolesDataSchema = mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

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

ProjectRolesDataSchema.plugin(mongoosePaginate);

const ProjectRolesData = module.exports = mongoose.model('ProjectRolesData', ProjectRolesDataSchema);

module.exports.addProjectRolesData = function (newProjectRolesData, callback) {
    newProjectRolesData.save(callback);
}

module.exports.getProjectRolesDataById = function (id, callback) {
    ProjectRolesData.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getProjectRolesData = function (organization_id, page, limit, callback) {
    let query = {};
    if (organization_id) {
        query = { organization_id };
    }
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false
        }
        ProjectRolesData.paginate(query, options, callback);
    } else {
        ProjectRolesData.find(query)
            .exec(callback);
    }
}
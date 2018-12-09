const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

const TeamMemberSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    reporting_to_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project_role: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectRolesData' },

    created_at: {
        type: Date,
        default: Date.now
    },

    updated_at: {
        type: Date,
        default: Date.now
    }
});

TeamMemberSchema.plugin(mongoosePaginate);

const TeamMember = module.exports = mongoose.model('TeamMember', TeamMemberSchema);

module.exports.addTeamMember = function(newTeamMember, callback) {
    newTeamMember.save(callback);
}

module.exports.getAllTeamMember = function(project_id, page, limit, callback) {
    let query = {};
    if (project_id) {
        query = { project_id };
    }
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false,
            populate: [{
                path: 'user_id reporting_to_user_id project_role'
            }]
        }
        TeamMember.paginate(query, options, callback);
    } else {
        TeamMember.find(query)
            .populate({
                path: 'user_id reporting_to_user_id project_role'
            })
            .exec(callback);
    }
}

module.exports.getAllTeamMemberLocations = function(project_id, callback) {
    let query = {};
    if (project_id) {
        query = { project_id };
    }
    TeamMember.find(query)
        .populate({
            path: 'user_id',
            select: 'name address_x address_y'
        })
        .exec(callback);
}
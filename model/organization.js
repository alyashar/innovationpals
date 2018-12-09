const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Organization Schema
const OrganizationSchema = mongoose.Schema({
    project_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    user_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        trim: true
    },

    unique_id: {
        type: String,
        required: true,
    },

    status: {
        type: Boolean,
        default: true
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

OrganizationSchema.plugin(mongoosePaginate);

const Organization = module.exports = mongoose.model('Organization', OrganizationSchema);

// save registar organization
module.exports.addOrganization = function(newOrganization, callback) {
    newOrganization.save(callback);
}

// get organization data
module.exports.getOrganizationById = function(id, callback) {
    Organization.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

// get organization data
module.exports.deleteById = function(id, callback) {
    Organization.findByIdAndRemove({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllOrganization = function(query, page, limit, callback) {
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { 'name': 1 },
            lean: false,
            populate: [{
                path: 'project_id',
                select: '_id'
            }],
            populate: [{
                path: 'user_id',
                select: '_id',
                match: { 'status': true, 'is_deleted': false }
            }]
        }
        Organization.paginate(query, options, callback);
    } else {
        Organization.find(query, callback);
    }
}
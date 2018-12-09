const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Activity Schema
const ActivitySchema = mongoose.Schema({
    task_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

    activity_title: {
        type: String,
        required: true,
        default: null,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    planned_from: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    planned_to: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    planned_duration: {
        type: String,
        required: false,
        trim: true,
        default: '0'
    },
    actual_from: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    actual_to: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    actual_duration: {
        type: String,
        required: false,
        trim: true,
        default: '0'
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

ActivitySchema.plugin(mongoosePaginate);

const Activity = module.exports = mongoose.model('Activity', ActivitySchema);

module.exports.addActivity = function(newActivity, callback) {
    newActivity.save(callback);
}

module.exports.getActivityById = function(id, callback) {
    Activity.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllActivityByProjectID = function(project_id, page, limit, callback) {
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
                path: 'project_id'
            }]
        }
        Activity.paginate(query, options, callback);
    } else {
        Activity.find(query)
            .populate({
                path: 'project_id'
            })
            .exec(callback);
    }
}
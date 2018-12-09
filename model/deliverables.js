const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Deliverables Schema
const DeliverablesSchema = mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

    deliverables: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: 1
    },
    completion_date: {
        type: Date,
        required: true
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

DeliverablesSchema.plugin(mongoosePaginate);

const Deliverables = module.exports = mongoose.model('Deliverables', DeliverablesSchema);

// Add Deliverables
module.exports.addDeliverables = function (newDeliverables, callback) {
    newDeliverables.save(callback);
}

// Return All Deliverables
module.exports.getAllDeliverables = function (project_id, page, limit, callback) {
    let query = {};
    if (page && limit) {
        if (project_id) {
            query = { project_id };
        }
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false,
            populate: [{
                path: 'created_by'
            }]
        }
        Deliverables.paginate(query, options, callback);
    } else {
        query = { 'status': true, project_id: project_id };
        Deliverables.find(query)
            .populate({
                path: 'created_by'
            })
            .exec(callback);
    }
}
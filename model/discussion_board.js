const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

//Organization Schema
const DiscussionBoardSchema = mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    comment_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    created_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    response_count: {
        type: Number,
        required: true,
        default: 0
    },
    reason: {
        type: String,
        default: null
    },
    closed_date: {
        type: Date,
        default: null
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

DiscussionBoardSchema.plugin(mongoosePaginate);
const DiscussionBoard = module.exports = mongoose.model('DiscussionBoard', DiscussionBoardSchema);

module.exports.addDiscussionBoard = function (newDiscussionBoard, callback) {
    newDiscussionBoard.save(callback);
}

module.exports.getDiscussionBoardById = function (id, callback) {
    DiscussionBoard.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllDiscussionBoard = function (callback) {
    DiscussionBoard.find({}, callback)
}
module.exports.getProjectDiscussionBoard = function (project_id, callback) {
    DiscussionBoard.find({ "project_id": mongoose.Types.ObjectId(project_id) }, callback)
}

module.exports.getAllDiscussionBoardList = function (organization_id, page, limit, callback) {
    let query = {};
    if (organization_id) {
        query = { organization_id };
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    var options = {
        page: page,
        limit: parseInt(limit),
        sort: { created_at: -1 },
        lean: false,
        populate: [{
            path: 'project_id', select: 'project_name'
        }]
    }
    DiscussionBoard.paginate(query, options, callback);
}

module.exports.getProjectDiscussionBoardList = function (organization_id, page, limit, project_id, callback) {
    let query = {};
    if (organization_id) {
        query = { organization_id };
    }
    if (project_id) {
        query = { project_id: mongoose.Types.ObjectId(project_id) };
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    var options = {
        page: page,
        limit: parseInt(limit),
        sort: { created_at: -1 },
        lean: false,
        populate: [{
            path: 'project_id', select: 'project_name'
        }]
    }
    DiscussionBoard.paginate(query, options, callback);
}
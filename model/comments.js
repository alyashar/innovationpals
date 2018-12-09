const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');
const ObjectId = require('mongodb').ObjectID;

//Organization Schema
const CommentSchema = mongoose.Schema({
    discussionBoard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionBoard' },
    message: {
        type: String,
        required: true,
    },
    replied: [{
        index: Number,
        message: String,
        created_at: String,
        us: {
            type: String,
            default: 'User'
        },
        user_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'replied.us' }
    }],
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
CommentSchema.plugin(mongoosePaginate);

const Comment = module.exports = mongoose.model('Comment', CommentSchema);

module.exports.addComment = function (newComment, callback) {
    newComment.save(callback);
}

module.exports.getCommentById = function (id, callback) {
    Comment.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback);
}

module.exports.getCommentByIdPopulate = function (id, callback) {
    //Comment.findOne({ "_id": mongoose.Types.ObjectId(id) },callback)
    Comment.find({ '_id': mongoose.Types.ObjectId(id) }).populate('replied.user_id').exec((err, results) => {
        callback(err, results[0]);
    })
}


module.exports.getAllComment = function (id, page, limit, callback) {
    // Comment.find({'user_id' : mongoose.Types.ObjectId("5af5a1106bee681e4117cae5") }).populate('replied.user_id').exec((err,results)=>{
    //     callback(err,results);
    // })
    if (page && limit) {
        var options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: -1 },
            lean: false,
            populate: [{
                path: 'user_id replied.user_id',
                select: 'name profile_pic'
            }]
        }
        Comment.paginate({ "discussionBoard_id": mongoose.Types.ObjectId(id) }, options, callback);
    } else {
        Comment.find({ "discussionBoard_id": mongoose.Types.ObjectId(id) })
            .exec(callback);
    }
}

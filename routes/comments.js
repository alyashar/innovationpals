const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');

const ValidationUtility = require('../utility/validations')
const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Comment = require('../model/comments');
const DiscussionBoard = require('../model/discussion_board');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

router.post('/add', Auth.isSuperAdminOrAdminOrStudent, ValidationUtility.validateCommentsAddForm, function(req, res) {
    let messageObj = null,
        newComment = null;
    let message_id = req.body.message_id;
    if (message_id) {
        messageObj = {
            index: 1,
            message: req.body.message,
            user_id: ObjectId(req.authData._id),
            created_at: req.body.created_at,
        }
    } else {
        newComment = new Comment({
            discussionBoard_id: ObjectId(req.body.discussionBoard_id),
            user_id: ObjectId(req.authData._id),
            message: req.body.message,
            created_at: req.body.created_at
        });
    }
    if (!message_id) {
        DiscussionBoard.findById(ObjectId(req.body.discussionBoard_id), (error, board) => {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (!board) {
                return res.status(404).json({ success: false, error: msg.DiscussionNotFound });
            } else {
                Comment.addComment(newComment, (err, comment) => {
                    if (err || !comment) {
                        return res.status(422).json({ success: false, error: err });
                    } else {
                        board.response_count = board.response_count + 1;
                        board.comment_id.push(ObjectId(newComment._id))
                        board.save((error, result) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: err });
                            } else {
                                return res.json({ success: true, message: msg.CommentAdded, comment });
                            }
                        })
                    }
                })
            }
        })
    } else {
        DiscussionBoard.findById(ObjectId(req.body.discussionBoard_id), (error, board) => {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (!board) {
                return res.status(404).json({ success: false, error: msg.DiscussionNotFound });
            } else {
                Comment.getCommentByIdPopulate(ObjectId(message_id), (err, comment) => {
                    if (error) {
                        return res.status(422).json({ success: false, error });
                    } else if (!board) {
                        return res.status(404).json({ success: false, error: msg.MessageNotFound });
                    } else {
                        messageObj.index = comment.replied.length + 1;
                        comment.replied.push(messageObj);
                        Comment.updateOne({ "_id": ObjectId(message_id) }, { replied: comment.replied }, (er, childReply) => {
                            if (er || !childReply) {
                                return res.status(422).json({ success: false, error: er });
                            } else {
                                return res.json({ success: true, message: msg.CommentAdded, comment });
                            }
                        });
                    }
                })
            }
        })
    }
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdminOrStudent, ValidationUtility.validateCommentsAddForm, function(req, res) {
    let message = req.body.message
    let id = req.params.id
    Comment.getCommentById(id, (err, comment) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!comment) {
            return res.status(422).json({ success: false });
        } else {
            Comment.updateOne({ _id: ObjectId(id) }, { message }, function(err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false });
                } else {
                    return res.json({ success: true });
                }
            })
        }
    })
});

router.delete('/remove/:comment_id/:index', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function(req, res) {
    let id = req.params.comment_id;
    let index = parseInt(req.params.index);
    Comment.getCommentById(id, (err, comment) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!comment) {
            return res.status(422).json({ success: false, error: msg.CommentNotFound });
        } else {
            if (index > 0) {
                comment.replied.find(x => x.index === index);
                comment.replied.map((obj, ind) => {
                    if (ind == 0)
                        comment.replied = [];
                    if (obj.index !== index)
                        comment.replied.push(obj);
                });
                Comment.updateOne({ "_id": ObjectId(id) }, { replied: comment.replied }, (er, childReply) => {
                    if (er || !childReply) {
                        return res.status(422).json({ success: false, error: er });
                    } else {
                        return res.json({ success: true, message: msg.CommentRemoved });
                    }
                });
            } else {
                Comment.remove({ _id: ObjectId(id) }, function(err, result) {
                    if (err || !result) {
                        return res.status(422).json({ success: false });
                    } else {
                        DiscussionBoard.findById(ObjectId(comment.discussionBoard_id), (error, board) => {
                            if (error) {
                                return res.status(422).json({ success: false, error });
                            } else if (!board) {
                                return res.status(404).json({ success: false, error: msg.DiscussionNotFound });
                            } else {
                                board.response_count = board.response_count - 1;
                                board.comment_id.pop(ObjectId(comment._id))
                                board.save((error, result) => {
                                    if (err) {
                                        console.log("Error while deleting comment from board");
                                    } else {
                                        console.log("Comment deleted from board");
                                    }
                                })
                            }
                        });
                        return res.json({ success: true, message: msg.CommentRemoved });
                    }
                })
            }
        }
    });
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
    if (req.params.id) {
        Comment.getCommentById(req.params.id, (err, comment) => {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!comment) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, comment });
            }
        })
    } else {
        return res.status(422).json({ success: false });
    }
});

router.get('/list/:thread_id', function(req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Comment.getAllComment(req.params.thread_id, page, limit, (err, comments) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!comments) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, comments: comments });
        }
    })
});

module.exports = router;
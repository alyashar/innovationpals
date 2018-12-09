const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');

const ValidationUtility = require('../utility/validations')
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Activity = require('../model/activity');
const Project = require('../model/project');
const Task = require('../model/tasks');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

// Add Activity
router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateActivityAddForm, function(req, res) {
    let {
        description,
        activity_title,
        project_id
    } = req.body
    let findProjectQuery = {}
    if (req.isUserMasterAdmin) {
        findProjectQuery = { _id: ObjectId(project_id) }
    } else {
        findProjectQuery = { _id: ObjectId(project_id), organization_id: ObjectId(req.authData.organization_id) }
    }
    Project.findOne(findProjectQuery, (error, project) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!project) {
            return res.status(422).json({ success: false, error: msg.ProjectNotFound });
        } else {
            let organization_id = req.authData.organization_id;
            let newActivity = new Activity({
                description,
                activity_title,
                project_id: ObjectId(project_id),
                organization_id
            });
            Activity.addActivity(newActivity, (err, activity) => {
                if (err || !activity) {
                    return res.status(422).json({ success: false, error: msg.ActivityAddFailed });
                } else {
                    let id = activity._id;
                    // Activity added to the Project
                    Project.updateOne({ _id: ObjectId(project_id) }, { $push: { 'activity_id': id } }, (err, result) => {
                        console.log('Activity Assigned To Project');
                    });

                    project.activity_id.push(newActivity._id)
                    return res.json({ success: true, message: msg.ActivityAddSuccess });
                }
            })
        }
    })
});

// Update Activity
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateActivityAddForm, function(req, res) {
    let {
        description,
        activity_title,
        project_id
    } = req.body
    let newActivity = {
        description,
        activity_title,
        updated_at: new Date()
    }
    Activity.getActivityById(req.params.id, (err, activity) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!activity) {
            return res.status(422).json({ success: false, error: msg.ActivityNotFound });
        } else {
            let id = req.params.id;
            Activity.updateOne({ _id: ObjectId(id) }, newActivity, function(err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.ActivityUpdateFailed });
                } else {
                    return res.json({ success: true, message: msg.ActivityUpdateSuccess });
                }
            })
        }
    })
});

// Fetch Activity By ID
router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
    Activity.getActivityById(req.params.id, (err, activity) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!activity) {
            return res.status(422).json({ success: false, error: msg.ActivityNotFound });
        } else {
            return res.json({ success: true, activity });
        }
    })
});

// Add All Activities By Project ID
router.get('/list/:project_id', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Activity.getAllActivityByProjectID(req.params.project_id, page, limit, (error, activity) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!activity.total) {
                return res.status(422).json({ success: false, error: msg.ActivityNotFound });
            } else {
                return res.json({ success: true, activity });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!activity) {
                return res.status(422).json({ success: false, error: msg.ActivityNotFound });
            } else {
                return res.json({ success: true, activity });
            }
        }
    })
});

// Remove Activity
router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    Activity.getActivityById(req.params.id, (err, activity) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!activity) {
            return res.status(422).json({ success: false, error: msg.ActivityNotFound });
        } else {
            let project_id = activity.project_id;
            let id = req.params.id.toString();
            // Check Task Association With the Activity
            Task.find({ 'activity_id': ObjectId(id) }, (err, tasks) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (tasks.length) {
                    return res.status(422).json({ success: false, error: msg.TaskAssociatedWithActivity });
                } else {
                    Activity.remove({ _id: ObjectId(id) }, (err, result) => {
                        if (err || !result) {
                            return res.status(422).json({ success: false, error: msg.ActivityDeleteFailed });
                        } else {
                            // Activity Removed From Project
                            Project.find({ "_id": ObjectId(project_id) }, (err, result) => {
                                if (err || !result) {
                                    //return res.json({ success: false, error: msg.ProjectNotFound });
                                    console.log("Project Not Found");
                                } else {
                                    Project.update({ _id: ObjectId(project_id) }, { $pull: { 'activity_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                        console.log("Activity Removed From Project");
                                    });
                                }
                            });

                            return res.json({ success: true, message: msg.ActivityDeleteSuccess });
                        }
                    });
                }
            });
        }
    })
});

module.exports = router;
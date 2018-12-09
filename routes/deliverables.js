const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');
const base64ToImage = require('base64-to-image');

const fs = require('fs');
const base64Img = require('base64-img');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Organization = require('../model/organization');
const Project = require('../model/project');
const User = require('../model/user');
const Deliverables = require('../model/deliverables');

const ValidationUtility = require('../utility/validations')
const videoUpload = require('../utility/videoUploadOptions')

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

// Add Deliverables To a Project
router.post('/add', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        deliverables: 'required',
        project_id: 'required',
        completion_date: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            let organization_id = req.authData.organization_id;
            let created_by = req.authData._id;
            let {
                deliverables,
                project_id,
                completion_date
            } = req.body

            let newDeliverables = new Deliverables({
                deliverables,
                project_id,
                completion_date,
                organization_id,
                created_by
            });
            Deliverables.addDeliverables(newDeliverables, (err, newdeliverables) => {
                if (err || !newdeliverables) {
                    return res.status(422).json({ success: false, error: err || newdeliverables });
                } else {
                    let deliverables_id = newdeliverables._id;
                    // Project Risk Type Data added to the Project
                    Project.updateOne({ _id: ObjectId(project_id) }, { $push: { 'deliverables_id': deliverables_id } }, (err, result) => {
                        console.log('Deliverables Assigned To Project');
                    });
                    return res.json({ success: true, message: msg.DeliverablesAddSuccess });
                }
            });
        } else {
            var newErrormsg = Object.keys(validator.errors).map((key, index) => {
                if (index == 0) {
                    return validator.errors[key].message
                }
            });
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    });
});

// Update Deliverables
router.put('/update/:id', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        deliverables: 'required',
        completion_date: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            Deliverables.findOne(ObjectId(req.params.id.toString()), (err, deliverables) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!deliverables) {
                    return res.status(404).json({ success: false, error: msg.DeliverablesNotFound });
                } else {
                    let {
                        deliverables,
                        completion_date
                    } = req.body
                    let newDeliverablesData = {
                        deliverables,
                        completion_date,
                        updated_at: new Date()
                    };
                    Deliverables.updateOne({ _id: req.params.id.toString() }, newDeliverablesData, function(err, result) {
                        if (err && !result) {
                            return res.status(422).json({ success: false, error: msg.DeliverablesUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.DeliverablesUpdateSuccess });
                        }
                    });
                }
            });
        } else {
            var newErrormsg = Object.keys(validator.errors).map((key, index) => {
                if (index == 0) {
                    return validator.errors[key].message
                }
            });
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    });
});

// Fetch All Deliverables
router.get('/list/:id', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Deliverables.getAllDeliverables(ObjectId(req.params.id.toString()), page, limit, (error, deliverables) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!deliverables.total) {
                return res.status(422).json({ success: false, error: msg.DeliverablesNotFound });
            } else {
                return res.json({ success: true, deliverables });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!deliverables) {
                return res.status(422).json({ success: false, error: msg.DeliverablesNotFound });
            } else {
                return res.json({ success: true, deliverables });
            }
        }
    });
});

// Update Deliverables Status
router.put('/update-status/:id', Auth.isAdmin, function(req, res) {
    Deliverables.findOne(ObjectId(req.params.id.toString()), (err, deliverables) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!deliverables) {
            return res.status(404).json({ success: false, error: msg.DeliverablesNotFound });
        } else {
            let deliverables_status;
            if (deliverables.status) {
                deliverables_status = false;
            } else {
                deliverables_status = true;
            }
            let newDeliverablesData = {
                status: deliverables_status,
                updated_at: new Date()
            };
            Deliverables.updateOne({ _id: req.params.id.toString() }, newDeliverablesData, function(err, result) {
                if (err && !result) {
                    return res.status(422).json({ success: false, error: msg.DeliverablesStatusFailed });
                } else {
                    if (deliverables_status) {
                        return res.json({ success: true, message: msg.DeliverablesReOpened });
                    } else {
                        return res.json({ success: true, message: msg.DeliverablesCompleted });
                    }
                }
            });
        }
    });
});

// Remove Deliverables
router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    Deliverables.findOne(ObjectId(req.params.id.toString()), (err, deliverables) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!deliverables) {
            return res.status(422).json({ success: false, error: msg.DeliverablesNotFound });
        } else {
            let project_id = deliverables.project_id;
            let id = req.params.id;
            Deliverables.remove({ _id: ObjectId(id) }, (err, result) => {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.DeliverablesDeleteFailed });
                } else {
                    // Deliverables Removed From Project
                    Project.find({ "_id": ObjectId(project_id) }, (err, result) => {
                        if (err || !result) {
                            console.log("Project Not Found");
                        } else {
                            Project.update({ _id: ObjectId(project_id) }, { $pull: { 'deliverables_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                console.log("Deliverables Removed From Project");
                            });
                        }
                    });
                    return res.json({ success: true, message: msg.TaskDeleteSuccess });
                }
            });
        }
    })
});

module.exports = router;
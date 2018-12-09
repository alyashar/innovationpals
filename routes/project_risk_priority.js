const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRiskPriority = require('../model/project_risk_priority');
const User = require('../model/user');
const ValidationUtility = require('../utility/validations');

const { filterString } = require('../utility/index');

const {
    SUPER_ADMIN_ID, ADMIN_ID, STUDENT_ID, VISITOR_ID
} = require("../constants/roleConst")

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Add Project Risk Priority
router.post('/add', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        risk_priority_title: 'required',
        description: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let {
                risk_priority_title, description
            } = req.body

            var slug = filterString(risk_priority_title);
            ProjectRiskPriority.findOne({ slug }, (err, isExitsProjectRiskPriority) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsProjectRiskPriority) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskPriorityShouldBeUnique });
                } else {
                    let newProjectRiskPriority = new ProjectRiskPriority({
                        risk_priority_title, 
                        slug,
                        description
                    });
                    ProjectRiskPriority.addProjectRiskPriority(newProjectRiskPriority, (err, project) => {
                        if (err || !project) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskPriorityAddFailed });
                        } else {
                            return res.json({ success: true, message: msg.ProjectRiskPriorityAddSuccess });
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

// Update Project Risk Priority
router.put('/update/:id', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        risk_priority_title: 'required',
        description: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            ProjectRiskPriority.getProjectRiskPriorityById(req.params.id, (err, projectRiskPriority) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectRiskPriority) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskPriorityNotFound });
                } else {
                    let {
                        risk_priority_title, description
                    } = req.body
                    var slug = filterString(risk_priority_title);
                    ProjectRiskPriority.findOne({ 'slug': { $eq: slug }, '_id': { $ne: req.params.id } }, (err, isExitsProjectRiskPriority) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });
                        } else if (isExitsProjectRiskPriority) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskPriorityShouldBeUnique });
                        } else {
                            let newProjectRiskPriority = {
                                risk_priority_title,
                                slug,
                                description,
                                updated_at: new Date()
                            };
                            ProjectRiskPriority.updateOne({ _id: req.params.id.toString() }, newProjectRiskPriority, function (err, result) {
                                if (err) {
                                    return res.status(422).json({ success: false, error: msg.ProjectRiskPriorityUpdateFailed });
                                } else {
                                    return res.json({ success: true, message: msg.ProjectRiskPriorityUpdateSuccess });
                                }
                            });
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

// Select Project Risk Priorities
router.get('/list', function (req, res) {
    ProjectRiskPriority.getAllProjectRiskPriority((err, projectriskpriority) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (projectriskpriority.length === 0) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskPriorityNotFound });
        } else {
            return res.json({ success: true, projectriskpriority });
        }
    })
});

// Delete Project Risk Priority
router.delete('/delete/:id', Auth.isSuperAdmin, function (req, res) {
    ProjectRiskPriority.findById(req.params.id, (error, projectriskpriority) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectriskpriority) {
            return res.status(404).json({ success: false, error: msg.ProjectRiskPriorityNotFound });
        } else {
            ProjectRiskPriority.remove({ '_id': req.params.id }, (err, result) => {
                if (err && !result) {
                    return res.json({ success: false, error: msg.ProjectRiskPriorityDeleteFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRiskPriorityDeleteSuccess });
                }
            });
        }
    });
});

module.exports = router;
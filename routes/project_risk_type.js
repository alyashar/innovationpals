const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRiskType = require('../model/project_risk_type');
const User = require('../model/user');
const ValidationUtility = require('../utility/validations');

const { filterString } = require('../utility/index');

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

// Add Project Risks
router.post('/add', Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        risk_title: 'required',
        description: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            let {
                risk_title,
                description
            } = req.body

            var slug = filterString(risk_title);
            ProjectRiskType.findOne({ slug }, (err, isExitsProjectRiskType) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsProjectRiskType) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeShouldBeUnique });
                } else {
                    let newProjectRiskType = new ProjectRiskType({
                        risk_title,
                        description,
                        slug
                    });
                    ProjectRiskType.addProjectRiskType(newProjectRiskType, (err, projectRiskTypes) => {
                        if (err || !projectRiskTypes) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeAddFailed });
                        } else {
                            return res.json({ success: true, message: msg.ProjectRiskTypeAddSuccess });
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

// Update Project Risks
router.put('/update/:id', Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        risk_title: 'required',
        description: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            ProjectRiskType.getProjectRiskTypeById(req.params.id, (err, projectRiskType) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectRiskType) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                } else {
                    let {
                        risk_title,
                        description
                    } = req.body
                    var slug = filterString(risk_title);
                    ProjectRiskType.findOne({ 'slug': { $eq: slug }, '_id': { $ne: req.params.id } }, (err, isExitsProjectRiskType) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });
                        } else if (isExitsProjectRiskType) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeShouldBeUnique });
                        } else {
                            let newProjectRiskType = {
                                risk_title,
                                description,
                                updated_at: new Date()
                            };
                            ProjectRiskType.updateOne({ _id: req.params.id.toString() }, newProjectRiskType, function(err, result) {
                                if (err) {
                                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeUpdateFailed });
                                } else {
                                    return res.json({ success: true, message: msg.ProjectRiskTypeUpdateSuccess });
                                }
                            });
                        }
                    });
                }
            })
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

// Select Project Risks
router.get('/list', function(req, res) {
    ProjectRiskType.getAllProjectRiskType((err, projectrisktype) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (projectrisktype.length === 0) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            return res.json({ success: true, projectrisktype });
        }
    })
});

// Delete Project Risk Type
router.delete('/delete/:id', Auth.isSuperAdmin, function(req, res) {
    ProjectRiskType.findById(req.params.id, (error, projectrisktype) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectrisktype) {
            return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            ProjectRiskType.remove({ '_id': req.params.id }, (err, result) => {
                if (err && !result) {
                    return res.json({ success: false, error: msg.ProjectRiskTypeDeleteFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRiskTypeDeleteSuccess });
                }
            });
        }
    });
});

module.exports = router;
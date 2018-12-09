const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRiskTypeData = require('../model/project_risk_type_data');
const RiskTypeData = require('../model/risk_type_data');
const Project = require('../model/project');
const User = require('../model/user');
const ValidationUtility = require('../utility/validations');

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

// Add Project Risk Type Data
router.post('/add', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        project_risk_type_id: 'required',
        project_id: 'required',
        identified_date: 'required',
        risk_title: 'required',
        description: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            let organization_id = req.authData.organization_id;
            let {
                project_risk_type_id,
                risk_title,
                description,
                project_id,
                identified_date
            } = req.body
            let newProjectRiskTypeData = new ProjectRiskTypeData({
                project_risk_type_id,
                risk_title,
                description,
                identified_date,
                project_id,
                organization_id
            });
            ProjectRiskTypeData.addProjectRiskTypeData(newProjectRiskTypeData, (err, projectrisktypedata) => {
                if (err || !projectrisktypedata) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeAddFailed });
                } else {
                    let project_risk_type_data_id = projectrisktypedata._id;
                    // Project Risk Type Data added to the Project
                    Project.updateOne({ _id: ObjectId(project_id) }, { $push: { 'project_risk_type_data_id': project_risk_type_data_id } }, (err, result) => {
                        console.log('Project Risk Type Data Assigned To Project');
                    });
                    return res.json({ success: true, message: msg.ProjectRiskTypeAddSuccess });
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

// Update Project Risk Type Data
router.put('/update/:id', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        project_risk_type_id: 'required',
        identified_date: 'required',
        risk_title: 'required',
        description: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            ProjectRiskTypeData.findOne(ObjectId(req.params.id.toString()), (err, projectRiskTypeData) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectRiskTypeData) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                } else {
                    let {
                        project_risk_type_id,
                        risk_title,
                        description,
                        identified_date
                    } = req.body
                    let newProjectRiskTypeData = {
                        project_risk_type_id,
                        risk_title,
                        description,
                        identified_date,
                        updated_at: new Date()
                    };
                    ProjectRiskTypeData.updateOne({ _id: req.params.id.toString() }, newProjectRiskTypeData, function(err, result) {
                        if (err && !result) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.ProjectRiskTypeUpdateSuccess });
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

// Fetch All Project Risk Type Data
router.get('/list/:id', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Project.findOne({ '_id': req.params.id.toString() }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, err });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            ProjectRiskTypeData.getAllProjectRiskTypeData(ObjectId(req.params.id.toString()), page, limit, (error, projectrisktypeData) => {
                if (error) {
                    return res.status(422).json({ success: false });
                } else if (projectrisktypeData.length === 0) {
                    return res.status(422).json({ success: false });
                } else {
                    return res.json({ success: true, projectrisktypeData });
                }
            });
        }
    });
});

// Update Project Risk Type Data Status
router.put('/update-status/:id', Auth.isAdmin, function(req, res) {
    ProjectRiskTypeData.findOne(ObjectId(req.params.id.toString()), (err, projectRiskTypeData) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!projectRiskTypeData) {
            return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            let risk_status;
            if (projectRiskTypeData.status) {
                risk_status = false;
            } else {
                risk_status = true;
            }
            let newProjectRiskTypeData = {
                status: risk_status,
                updated_at: new Date()
            };
            ProjectRiskTypeData.updateOne({ _id: req.params.id.toString() }, newProjectRiskTypeData, function(err, result) {
                if (err && !result) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeStatusFailed });
                } else {
                    if (risk_status) {
                        return res.json({ success: true, message: msg.ProjectRiskReOpened });
                    } else {
                        return res.json({ success: true, message: msg.ProjectRiskCompleted });
                    }
                }
            });
        }
    });
});

// Remove Project Risk Type Data
router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    ProjectRiskTypeData.findOne(ObjectId(req.params.id.toString()), (err, projectRiskTypeData) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!projectRiskTypeData) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            let project_id = projectRiskTypeData.project_id;
            let id = req.params.id;
            ProjectRiskTypeData.remove({ _id: ObjectId(id) }, (err, result) => {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeDeleteFailed });
                } else {
                    // Project Risk Type Data Removed From Project
                    Project.find({ "_id": ObjectId(project_id) }, (err, result) => {
                        if (err || !result) {
                            console.log("Project Not Found");
                        } else {
                            Project.update({ _id: ObjectId(project_id) }, { $pull: { 'project_risk_type_data_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                console.log("Project Risk Type Data Removed From Project");
                            });
                        }
                    });
                    return res.json({ success: true, message: msg.ProjectRiskTypeDeleteSuccess });
                }
            });
        }
    })
});

// Fetch Data For Project's Risk Type Chart
router.get('/risk-types/:project_id', function(req, res, next) {
    Project.findOne({ '_id': req.params.project_id.toString() }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, err });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            ProjectRiskTypeData.getAllProjectRiskTypes(ObjectId(req.params.project_id.toString()), (error, allProjectRiskTypes) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!allProjectRiskTypes) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                } else {
                    return res.status(200).json({ success: true, allProjectRiskTypes });
                }
            });
        }
    });
});

// Fetch All Project's Risk Type Data
router.get('/risk-type-list/:id/:project_id', function(req, res) {
    Project.findOne({ '_id': req.params.project_id.toString() }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, err });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            RiskTypeData.findOne({ '_id': req.params.id.toString() }, (err, riskTypeData) => {
                if (err) {
                    return res.status(422).json({ success: false, err });
                } else if (!riskTypeData) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                } else {
                    ProjectRiskTypeData.getAllProjectRiskTypesDatas(ObjectId(req.params.id.toString()), ObjectId(req.params.project_id.toString()), (error, projectrisktypeData) => {
                        if (error) {
                            return res.status(422).json({ success: false });
                        } else if (!projectrisktypeData) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                        } else {
                            return res.status(200).json({ success: true, projectrisktypeData });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
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
const ProjectRisk = require('../model/project_risk');
const Project = require('../model/project');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateprojectRiskAddForm, function(req, res) {
    let {
        risk_title,
        description,
        identified_date,
        probability,
        impact
    } = req.body
    let newProjectRisk = new ProjectRisk({
        risk_title,
        description,
        identified_date,
        probability,
        impact,
        status: true
    });
    ProjectRisk.addProjectRisk(newProjectRisk, (err, projectRisk) => {
        if (err || !projectRisk) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskAddFailed });
        } else {
            return res.json({ success: true, message: msg.ProjectRiskAddSuccess });
        }
    })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateprojectRiskAddForm, function(req, res) {
    let {
        risk_title,
        description,
        identified_date,
        probability,
        impact,
        status
    } = req.body

    let newProjectRisk = {
        risk_title,
        description,
        identified_date,
        probability,
        impact,
        status,
        updated_at: new Date()
    }
    ProjectRisk.findById(req.params.id, (err, projectRisk) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskUpdateFailed });
        } else if (!projectRisk) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskShouldBeUnique });
        } else {
            ProjectRisk.updateOne({ _id: ObjectId(req.params.id) }, newProjectRisk, function(err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskUpdateFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRiskUpdateSuccess });
                }
            })
        }
    })
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {

    ProjectRisk.findById(ObjectId(req.params.id), (err, projectRisk) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!projectRisk) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, projectRisk });
        }
    })
});

router.get('/list', function(req, res) {
    ProjectRisk.getAllProjectRisk((err, projectRisk) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!projectRisk) {
            return res.json({ success: false });
        } else {
            return res.json({ success: true, projectRisk });
        }
    })
});

// Project Risk Deactivated
router.put('/status/:project_risk_id', Auth.isSuperAdminOrAdmin, function(req, res, next) {
    let project_risk_id = req.params.project_risk_id;
    ProjectRisk.getProjectRiskById(project_risk_id, (err, targetProjectRisk) => {
        if (err) {
            return res.status(404).json({ success: false, error: msg.UnableToDeactivateProjectRisk });
        } else if (!targetProjectRisk) {
            return res.status(401).json({ success: false, error: msg.ProjectRiskNotFound });
        } else {
            var status = { 'status': !targetProjectRisk.status }
            ProjectRisk.updateOne({ "_id": project_risk_id }, status, function(err, result) {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else {
                    let message = (targetProjectRisk.status) ? msg.ProjectRiskdeactivated : msg.ProjectRiskActivated;
                    return res.json({ success: true, message: message });
                }
            });
        }
    })
});

// Delete Project Risk
router.delete('/delete/:id', Auth.isSuperAdminOrAdmin, function(req, res) {
    ProjectRisk.getProjectRiskById(req.params.id, (error, projectRisk) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectRisk) {
            return res.status(404).json({ success: false, error: msg.ProjectRiskNotFound });
        } else {
            projectRisk.remove({ '_id': req.params.id.toString() }, function(err, result) {
                if (err) {
                    Log.ManageLog(err);
                    return res.json({ status: 422, success: false, error: err });
                } else if (!result.n) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskDeleteFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRiskDeleteSuccess });
                }
            });
        }
    })
});

module.exports = router;
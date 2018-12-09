const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const RiskTypeData = require('../model/risk_type_data');
const User = require('../model/user');
const ValidationUtility = require('../utility/validations');

const ProjectRiskTypeData = require('../model/project_risk_type_data');

const { filterString } = require('../utility/index');

const {
    SUPER_ADMIN_ID, ADMIN_ID, STUDENT_ID, VISITOR_ID
} = require("../constants/roleConst")

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Add Risk Type Data
router.post('/add', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        risk_title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let {
                risk_title
            } = req.body
            let organization_id = req.authData.organization_id;
            var slug = filterString(risk_title);
            RiskTypeData.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: organization_id } }, (err, isExitsRiskTypeData) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsRiskTypeData) {
                    return res.status(422).json({ success: false, error: msg.ProjectRiskTypeShouldBeUnique });
                } else {
                    let newRiskTypeData = new RiskTypeData({
                        risk_title,
                        slug,
                        organization_id
                    });
                    RiskTypeData.addRiskTypeData(newRiskTypeData, (err, projectrisktype) => {
                        if (err || !projectrisktype) {
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

// Update Risk Type Data
router.put('/update/:id', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        risk_title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            RiskTypeData.getRiskTypeDataById(req.params.id, (err, projectrisktype) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectrisktype) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
                } else {
                    let {
                        risk_title
                    } = req.body
                    let id = req.params.id;
                    let organization_id = req.authData.organization_id;
                    var slug = filterString(risk_title);
                    RiskTypeData.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: organization_id }, '_id': { $ne: id } }, (err, isExitsRiskTypeData) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });
                        } else if (isExitsRiskTypeData) {
                            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeShouldBeUnique });
                        } else {
                            let newRiskTypeData = {
                                risk_title,
                                slug,
                                organization_id,
                                updated_at: new Date()
                            };
                            RiskTypeData.updateOne({ _id: req.params.id.toString() }, newRiskTypeData, function (err, result) {
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

// Select Risk Types Data
router.get('/list', function (req, res) {
    let organization_id = req.authData.organization_id;
    RiskTypeData.getAllRiskTypeData(organization_id, (err, projectrisktype) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (projectrisktype.length === 0) {
            return res.status(422).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            return res.json({ success: true, projectrisktype });
        }
    })
});

// Delete Risk Type
router.delete('/delete/:id', Auth.isAdmin, function (req, res) {
    RiskTypeData.findById(req.params.id, (error, projectrisktype) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectrisktype) {
            return res.status(404).json({ success: false, error: msg.ProjectRiskTypeNotFound });
        } else {
            ProjectRiskTypeData.findOne({ 'project_risk_type_id': ObjectId(req.params.id.toString()) }, (error, projectRiskTypeData) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (projectRiskTypeData) {
                    return res.status(404).json({ success: false, error: msg.ProjectRiskTypeAssociatedWithData });
                } else {
                    RiskTypeData.remove({ '_id': req.params.id }, (err, result) => {
                        if (err && !result) {
                            return res.json({ success: false, error: msg.ProjectRiskTypeDeleteFailed });
                        } else {
                            return res.json({ success: true, message: msg.ProjectRiskTypeDeleteSuccess });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
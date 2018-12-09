const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRolesData = require('../model/project_roles_data');
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

// Add Project Role Data
router.post('/add', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let {
                title
            } = req.body
            let organization_id = req.authData.organization_id;
            let newProjectRolesData = new ProjectRolesData({
                title,
                organization_id
            });
            ProjectRolesData.addProjectRolesData(newProjectRolesData, (err, projectRolesData) => {
                if (err || !projectRolesData) {
                    return res.status(422).json({ success: false, error: msg.ProjectRoleAddFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRoleAddSuccess });
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

// Update Project Role Data
router.put('/update/:id', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            ProjectRolesData.getProjectRolesDataById(req.params.id, (err, projectRolesData) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectRolesData) {
                    return res.status(404).json({ success: false, error: msg.ProjectRoleNotFound });
                } else {
                    let {
                        title
                    } = req.body
                    let id = req.params.id;
                    let newProjectRolesData = {
                        title,
                        updated_at: new Date()
                    };
                    ProjectRolesData.updateOne({ _id: req.params.id.toString() }, newProjectRolesData, function (err, result) {
                        if (err) {
                            return res.status(422).json({ success: false, error: msg.ProjectRoleUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.ProjectRoleUpdateSuccess });
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

// Select Project Roles Data
router.get('/list', function (req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    let organization_id = req.authData.organization_id;
    ProjectRolesData.getProjectRolesData(organization_id, page, limit, (err, projectRolesData) => {
        if (page && limit) {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!projectRolesData.total) {
                return res.status(422).json({ success: false, error: msg.ProjectRoleNotFound });
            } else {
                return res.json({ success: true, projectRolesData });
            }
        } else {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!projectRolesData) {
                return res.status(422).json({ success: false, error: msg.ProjectRoleNotFound });
            } else {
                return res.json({ success: true, projectRolesData });
            }
        }
    })
});

// Delete Project Role Data
router.delete('/delete/:id', Auth.isAdmin, function (req, res) {
    ProjectRolesData.findById(req.params.id, (error, projectRolesData) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectRolesData) {
            return res.status(404).json({ success: false, error: msg.ProjectRoleNotFound });
        } else {
            ProjectRolesData.remove({ '_id': req.params.id }, (err, result) => {
                if (err && !result) {
                    return res.json({ success: false, error: msg.ProjectRoleDeleteFailed });
                } else {
                    return res.json({ success: true, message: msg.ProjectRoleDeleteSuccess });
                }
            });
        }
    });
});

module.exports = router;
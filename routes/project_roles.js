const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRoles = require('../model/project_roles');
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

// Add Project Role
router.post('/add', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let {
                title
            } = req.body
            let newProjectRoles = new ProjectRoles({
                title
            });
            ProjectRoles.addProjectRoles(newProjectRoles, (err, allProjectRoles) => {
                if (err || !allProjectRoles) {
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

// Update Project Role
router.put('/update/:id', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            ProjectRoles.getProjectRolesById(req.params.id, (err, projectRole) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!projectRole) {
                    return res.status(404).json({ success: false, error: msg.ProjectRoleNotFound });
                } else {
                    let {
                        title
                    } = req.body
                    let newProjectRole = {
                        title,
                        updated_at: new Date()
                    };
                    ProjectRoles.updateOne({ _id: req.params.id.toString() }, newProjectRole, function (err, result) {
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

// Select Project Roles
router.get('/list', function (req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    ProjectRoles.getProjectRoles(page, limit, (error, projectRoles) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!projectRoles.total) {
                return res.status(422).json({ success: false, error: msg.ProjectRoleNotFound });
            } else {
                return res.json({ success: true, projectRoles });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!projectRoles) {
                return res.status(422).json({ success: false, error: msg.ProjectRoleNotFound });
            } else {
                return res.json({ success: true, projectRoles });
            }
        }
    })
});

// Delete Project Role
router.delete('/delete/:id', Auth.isSuperAdmin, function (req, res) {
    ProjectRoles.findById(req.params.id, (error, projectRole) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectRole) {
            return res.status(404).json({ success: false, error: msg.ProjectRoleNotFound });
        } else {
            ProjectRoles.remove({ '_id': req.params.id }, (err, result) => {
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
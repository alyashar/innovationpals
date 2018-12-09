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
const TeamMember = require('../model/team_members');
const Task = require('../model/tasks');
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

// Add Team Member
router.post('/add', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        user_id: 'required',
        project_id: 'required',
        reporting_to_user_id: 'required',
        project_role: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            let {
                user_id,
                project_id,
                reporting_to_user_id,
                project_role
            } = req.body
            TeamMember.findOne({ 'project_id': ObjectId(project_id), 'user_id': ObjectId(user_id) }, (error, teamMember) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (teamMember) {
                    return res.status(422).json({ success: false, error: msg.TeamMemberAlreadyExistProject });
                } else {
                    Project.findOne(ObjectId(project_id), (error, project) => {
                        if (error) {
                            return res.status(422).json({ success: false, error });
                        } else if (!project) {
                            return res.status(422).json({ success: false, error: msg.ProjectNotFound });
                        } else {
                            let created_by = req.authData._id;
                            let organization_id = req.authData.organization_id;
                            let newTeamMember = new TeamMember({
                                user_id,
                                project_id,
                                reporting_to_user_id,
                                organization_id,
                                created_by,
                                project_role
                            });
                            TeamMember.addTeamMember(newTeamMember, (err, team_member) => {
                                if (err || !team_member) {
                                    return res.json({ success: false, error: msg.TeamMemberAddFailed });
                                } else {
                                    return res.json({ success: true, message: msg.TeamMemberAddSuccess });
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

// Update Team Member
router.put('/update/:id', Auth.isAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        reporting_to_user_id: 'required',
        project_role: 'required'
    });
    validator.check().then(function(matched) {
        if (matched) {
            let {
                reporting_to_user_id,
                project_role
            } = req.body
            TeamMember.findOne(ObjectId(req.params.id), (error, teamMember) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!teamMember) {
                    return res.status(422).json({ success: false, error: msg.TeamMemberNotFound });
                } else {
                    let newTeamMember = {
                        reporting_to_user_id,
                        project_role,
                        updated_at: new Date()
                    };
                    TeamMember.updateOne({ _id: req.params.id.toString() }, newTeamMember, function(err, team_member) {
                        if (err && !team_member) {
                            return res.status(422).json({ success: false, error: msg.TeamMemberUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.TeamMemberUpdateSuccess });
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

// Fetch All Team Members
router.get('/list/:id', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    TeamMember.getAllTeamMember(ObjectId(req.params.id.toString()), page, limit, (error, team_members) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!team_members.docs) {
                return res.status(422).json({ success: false, error: msg.TeamMemberNotFound });
            } else {
                return res.json({ success: true, team_members });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!team_members) {
                return res.status(422).json({ success: false, error: msg.TeamMemberNotFound });
            } else {
                return res.json({ success: true, team_members });
            }
        }
    });
});

// Remove Team Member
router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    TeamMember.findOne(ObjectId(req.params.id.toString()), (err, team_member) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!team_member) {
            return res.status(422).json({ success: false, error: msg.TeamMemberNotFound });
        } else {
            let student_id = team_member.student_id;
            Task.findOne({ 'student_id': student_id }, (err, tasks) => {
                if (err) {
                    return res.status(404).json({ success: false });
                } else if (tasks) {
                    return res.status(404).json({ success: false, error: msg.StudentAlreadyAssociatedWithProject });
                } else {
                    let id = req.params.id;
                    TeamMember.remove({ _id: ObjectId(id) }, (err, result) => {
                        if (err || !result) {
                            return res.status(422).json({ success: false, error: msg.DeliverablesDeleteFailed });
                        } else {
                            return res.json({ success: true, message: msg.TaskDeleteSuccess });
                        }
                    });
                }
            });
        }
    })
});

// Fetch All Team Members For Organization Chart
router.get('/org-chart/:id', function(req, res) {
    Project.findOne({ '_id': req.params.id.toString() }).select('project_manager_id').
    populate({ path: 'project_manager_id', select: 'name profile_pic dob' }).exec((error, project) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            if (project.project_manager_id && project.project_manager_id.length) {
                let project_id = project._id;
                let managers = project.project_manager_id;
                // Fetch Project's Team Member(s)
                TeamMember.find({ 'project_id': project_id }, { 'user_id': 1, '_id': 1, 'reporting_to_user_id': 1 }, { populate: { path: 'user_id reporting_to_user_id project_role', select: 'name profile_pic dob title' } }, (error, team_members) => {
                    if (error) {
                        return res.status(422).json({ success: false, error });
                    } else {
                        if (team_members && team_members.length) {
                            // If Manager(s)
                            var newTeamMembers = [];
                            if (managers && managers.length) {
                                managers.forEach((user, index) => {
                                    var obj = {
                                        _id: user._id,
                                        name: user.name,
                                        userObj: [],
                                    }
                                    newTeamMembers.push(obj);
                                });
                            }

                            // If Team Member(s)
                            var new_team_members = [];
                            if (team_members && team_members.length) {
                                team_members.forEach((user, index) => {
                                    var obj = {
                                        _id: user.user_id._id,
                                        name: user.user_id.name,
                                        dob: user.user_id.dob,
                                        profile_pic: user.user_id.profile_pic,
                                        project_role: user.project_role.title,
                                        reporting_to_user_id: user.reporting_to_user_id
                                    }
                                    new_team_members.push(obj);
                                });
                            }

                            // If Team Member(s)
                            if (new_team_members && new_team_members.length) {
                                new_team_members.forEach((user, index) => {
                                    newTeamMembers.find(x => {
                                        if (x._id.toString() === user.reporting_to_user_id._id.toString()) {
                                            x.userObj.push(user);
                                        }
                                    });
                                });
                            }

                            return res.json({ success: true, managers, newTeamMembers });
                        } else if (managers && managers.length) { // No Team Member(s) only Project Manager(s)
                            return res.json({ success: true, managers });
                        }
                    }
                });
            } else {
                return res.status(404).json({ success: false, error: msg.ProjectMustHaveManager });
            }
        }
    });
});

module.exports = router;
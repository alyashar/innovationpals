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
const DashboardSearch = require('../model/dashboard_search');
const ValidationUtility = require('../utility/validations');
const videoUpload = require('../utility/videoUploadOptions');

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

// Student Dashboard
router.get('/search-by-name/:name', function(req, res, next) {
    let search = req.params.name;
    DashboardSearch.getSearchByName(search, (err, result) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else {
            let project = [];
            let user = [];
            if (result != null) {
                let total_p = 0;
                let total = 0
                project = result.project;
                if (project != "Null") {
                    let new_project = {};
                    project.forEach((projects, index) => {
                        if (projects.task_id.length) {
                            projects.task_id.forEach(data => {
                                total_p = Number(total_p) + Number(data.actual_hours);
                            });
                        }
                        projects = JSON.parse(JSON.stringify(projects))
                        projects['total_actual_hours'] = Number(total_p);
                        project[index] = projects;
                        new_project = {
                            'project_id': project[index],
                            'average_rating': project[index].rating_id == undefined ? 0 : project[index].rating_id.average_rating
                        };
                        total_p = 0;

                        delete project[index].task_id;
                        delete project[index].rating_id;
                        project[index] = new_project;
                    });
                }

                user = result;
                if (user) {
                    let new_user = {};
                    user.forEach((users, index) => {
                        if (users.task_id.length) {
                            users.task_id.forEach(data => {
                                total = Number(total) + Number(data.actual_hours);
                            })
                        }
                        users = JSON.parse(JSON.stringify(users))
                        users['total_actual_hours'] = Number(total);
                        users['total_project'] = users.project_id.length;
                        user[index] = users;
                        new_user = {
                            'user_id': user[index],
                            'average_rating': user[index].rating_id == undefined ? 0 : user[index].rating_id.average_rating
                        };
                        delete user[index].task_id;
                        delete user[index].project_id;
                        delete user[index].rating_id;
                        user[index] = new_user;
                        total = 0;
                    })
                }
            }
            return res.json({ success: true, message: msg.SearchResult, projects: project, users: user });
        }
    });
});

// Student Dashboard
router.get('/dashboard-count', function(req, res, next) {
    let organization_id = 0;
    DashboardSearch.getDashBoardCount(organization_id, (err, result) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else {
            total_users = result.users;
            total_projects = result.projects;
            total_visitors = result.visitors;

            return res.json({ success: true, message: msg.DashBoardCount, total_users, total_projects, total_visitors });
        }
    });
});

module.exports = router;
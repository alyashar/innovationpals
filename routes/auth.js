const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const jwt = require('jsonwebtoken');
const passwordHash = require('password-hash');
const path = require('path');
const fs = require('fs');
const multer = require('multer')
const base64ToImage = require('base64-to-image');
const base64Img = require('base64-img');

const AppConfig = require("../constants/appConfig")
const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Utility = require('../utility/index');
const User = require('../model/user');
const Log = require('../manage-log');

const UserRating = require('../model/user_ratings');
const ProjectRating = require('../model/project_rating');
const Calendar = require('../model/calendar');
const News = require('../model/news');
const DashboardSearch = require('../model/dashboard_search');
const DiscussionBoard = require('../model/discussion_board');
const Comment = require('../model/comments');
const Project = require('../model/project');
const ProjectRiskTypeData = require('../model/project_risk_type_data');
const RiskTypeData = require('../model/risk_type_data');
const TeamMember = require('../model/team_members');
const Deliverables = require('../model/deliverables');
const ProjectPhotosAndVideos = require('../model/project_photos_and_videos.js');
const NotificationSubscription = require('../model/notification_subscriptions');

const fieldEncryption = require('mongoose-field-encryption');
const Validation = require('node-input-validator');

const ValidationUtility = require('../utility/validations')
let resurved = {}; // first argument for constructor will always be blank object
// This empty object (i.e. r in this case) will be used in future
let blocked = '';
let setting = {};

router.use(function (req, res, next) {
    next();
});

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst");

// user login
router.post('/login', ValidationUtility.validateLoginForm, (req, res, next) => {
    // fetch data by role and user_name
    User.getForLogin(req.body.email, req.body.password, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            res.status(422)
            return res.json({ success: false, error: err });
        } else if (!user) {
            res.status(422)
            return res.json({ success: false, error: msg.UserDoesNotExist });
            // Password matching for login
        } else if (user.is_deleted || !user.status) {
            res.status(422)
            return res.json({ success: false, error: msg.UserIsDeactivated });
            // Password matching for login
        } else if (!passwordHash.verify(req.body.password, user.password)) {
            res.status(422)
            return res.json({ success: false, error: msg.wrongPassword });
        } else {
            // Create token after successfull loging by valid User
            let secret = '';
            let token = '';
            // make token with life 365 days
            secret = user.toObject();
            token = jwt.sign(secret, AppConfig.JWT_AUTHTOKEN_SECRET, {
                expiresIn: '365d'
            });
            User.getUserById(user._id, (err, new_user) => {
                return res.json({
                    success: true,
                    token: token,
                    user: new_user
                });
            });
        }
    });
});

// Forgot Password
router.post('/forgot-password', function (req, res) {
    let validator = new Validation(resurved, req.body, {
        email: 'required|email',
    });
    validator.check().then(function (matched) {
        if (matched) {
            User.findOne({ "email": req.body.email }, (err, user) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.json({ status: 422, success: false, error: err });
                } else if (!user) {
                    return res.json({ status: 422, success: false, error: msg.emailNotFound });
                } else {
                    let id = user._id;
                    var systemGenratedPassword = Utility.systemGenrateRandomPassword();
                    // var systemGenratedPassword = "123456";
                    console.log("systemGenratedPassword", systemGenratedPassword);
                    var hashedPassword = passwordHash.generate(systemGenratedPassword);
                    console.log("HashPassword", hashedPassword);
                    // email encryption
                    var date = new Date();
                    date.setDate(date.getDate() + 2);
                    var data = { time: date, email: req.body.email }
                    // email encryption
                    let encrypted = fieldEncryption.encrypt(JSON.stringify(data), 'secret');
                    var templateContent = fs.readFileSync('email_templates/reset-password.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', '<p>Email Address : ' + user.email + '</p><p>New Password : ' + systemGenratedPassword + '</p>');

                    User.updateOne({ '_id': id.toString() }, { 'password': hashedPassword }, function (err, result) {
                        if (err) {
                            return res.json({ status: 422, success: false, error: msg.SomethingWentWrong });
                        } else if (!result.nModified) {
                            return res.json({ status: 422, success: false, error: msg.SomethingWentWrong });
                        } else {
                            // send mail for account verification
                            Utility.sendEmail(templateContent, user.email, msg.ES_ResetPassword)
                            return res.json({
                                success: true,
                                message: msg.PasswordSentToEmail
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
            return res.json({ status: 422, success: false, error: newErrormsg[0] || null });
        }
    });
});

// forget  password reset
router.post('/resend-link', function (req, res) {

    let validator = new Validation(resurved, req.body, {
        email: 'required|email',
    });
    validator.check().then(function (matched) {
        if (matched) {
            User.checkForReg('email', req.body.email, (err, user) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.json({ success: 422, success: false, error: err });
                } else if (!user) {

                    return res.json({ success: 422, success: false, error: msg.emailNotFound });
                } else {
                    // varification email sending after successfull registraion
                    // create expire time for link
                    var date = new Date();
                    date.setDate(date.getDate() + 2);
                    var data = { time: date, email: req.body.email }
                    // email encryption
                    let encrypted = fieldEncryption.encrypt(JSON.stringify(data), 'secret');
                    var templateContent = fs.readFileSync('email_templates/verify-link.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', '<p>Click <a href="' + config.email_varify_link + encrypted + '">here</a> to activate your account</p>');
                    Utility.sendEmail(templateContent, req.body.email, msg.ES_VerifyLink)
                    return res.json({
                        success: 200,
                        success: true,
                        message: msg.accountActivationLink
                    });
                }
            });
        } else {
            var newErrormsg = Object.keys(validator.errors).map((key, index) => {
                if (index == 0) {
                    return validator.errors[key].message
                }
            });
            return res.json({ success: 422, success: false, error: newErrormsg[0] || null });
        }
    });
});

// Register visitor
router.post('/register-visitor', ValidationUtility.validateUserRegisterationForm, function (req, res) {
    // chech that email is alredy register or not
    User.checkForReg('email', req.body.email, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!user) {
            var systemGenratedPassword = Utility.systemGenrateRandomPassword();
            console.log("systemGenratedPassword", systemGenratedPassword);
            var hashedPassword = passwordHash.generate(systemGenratedPassword);
            let role_id = ObjectId(VISITOR_ID);
            let newUser = new User({
                email: req.body.email.toLowerCase(),
                password: hashedPassword,
                role_id,
                name: req.body.name,
                status: true,
                number: req.body.number,
            });
            // const base64Str = req.body.profile_pic;
            // const type = base64Str.split(';')[0].split('/')[1];
            // const imagePath = 'public/UserProfile/';
            // const fileName = ObjectId() + "_user";
            // const imageFullName = fileName + "." + type;
            // base64Img.img(base64Str, imagePath, fileName, function (err, filepath) {
            //     if (err) {
            //         Log.ManageLog(err, "File image write error");
            //     } else {
            //         newUser['profile_pic'] = imageFullName
            //     }
            User.addUser(newUser, (err, user) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (user) {
                    var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', '<p>Your Password for this Email address is "' + systemGenratedPassword + '"</p>');
                    Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                    return res.json({
                        success: true,
                        message: msg.VisitorRegistered
                    });
                } else {
                    return res.status(422).json({ success: false, error: msg.registrationFail });
                }
            });
            // });
        } else {
            return res.status(422).json({ success: false, error: msg.emailValidation });
        }
    });
});

// top 10 user by rating
router.get('/top-user-by-rating', function (req, res) {
    let top_ratings = 10;
    UserRating.getRatings(top_ratings, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            return res.status(422).json({ success: false });
        } else {
            let total = 0
            rating.forEach((ratings, index) => {
                if (ratings.user_id.role_id && ratings.user_id.role_id == STUDENT_ID) {
                    if (ratings.user_id.task_id.length) {
                        ratings.user_id.task_id.forEach(data => {
                            total = Number(total) + Number(data.actual_hours);
                        });
                    }
                    ratings = JSON.parse(JSON.stringify(ratings))
                    ratings.user_id['total_actual_hours'] = Number(total);
                    ratings.user_id['total_project'] = ratings.user_id.project_id.length;
                    rating[index] = ratings;
                    delete rating[index].user_id.task_id;
                    delete rating[index].user_id.project_id;
                    total = 0;
                }
            });
            if (rating.length == 0) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, rating });
            }
        }
    })
});

// average rating of user
router.get('/user-rating-select/:user_id', function (req, res) {
    UserRating.getRatingById(req.params.user_id, null, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            let rating = my_rating = 0;
            return res.status(200).json({ success: false, rating, my_rating });
        } else {
            let my_rating = 0;
            if (rating.my_ratings) {
                my_rating = rating.my_ratings;
            }
            return res.json({ success: true, rating, my_rating });
        }
    });
});

// top 10 project
router.get('/top-project-by-rating', function (req, res) {
    let top_ratings = 10;
    ProjectRating.getRatings(top_ratings, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            return res.status(422).json({ success: false });
        } else {
            let total = 0
            rating.forEach((ratings, index) => {
                if (ratings.project_id.task_id && ratings.project_id.task_id.length) {
                    ratings.project_id.task_id.forEach(data => {
                        total = Number(total) + Number(data.actual_hours);
                    });
                }
                ratings = JSON.parse(JSON.stringify(ratings))
                ratings.project_id['total_actual_hours'] = Number(total);
                rating[index] = ratings;
                delete rating[index].project_id.task_id;
                total = 0;
            });
            var limit = 20;
            ProjectPhotosAndVideos.getPhotosAndVideos(limit, (err, result) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else {
                    if (rating.length == 0) {
                        return res.status(422).json({ success: false });
                    } else {
                        let photos = result.photos;
                        let videos = result.videos;
                        return res.json({ success: true, rating, photos, videos });
                    }
                }
            });
            // if (rating.length == 0) {
            //     return res.status(422).json({ success: false });
            // } else {
            //     return res.json({ success: true, rating });
            // }
        }
    });
});

// average rating of project
router.get('/project-rating-select/:project_id', function (req, res) {
    ProjectRating.getRatingById(req.params.project_id, null, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            return res.status(422).json({ success: false });
        } else {
            let my_rating = 0;
            if (rating.my_ratings) {
                my_rating = rating.my_ratings;
            }
            return res.json({ success: true, rating, my_rating });
        }
    });
});

// news list without auth
router.get('/news-list', function (req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    News.getAllNews(page, limit, (err, news) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!news) {
            return res.json({ success: false, error: msg.NewsNotFound });
        } else {
            return res.json({ success: true, news });
        }
    })
});

// calender list without auth
router.get('/calendar-list', function (req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Calendar.getAllActiveEvents(page, limit, (err, calendars) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!calendars) {
            return res.json({ success: false, error: msg.EventNotFound });
        } else {
            return res.json({ success: true, calendars });
        }
    })
});

// Dashboard count
router.get('/dashboard-count', function (req, res, next) {
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

// select user by id without auth
router.get('/user-select/:id', function (req, res, next) {
    User.getUserProjectsById(req.params.id, (err, user) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!user.length) {
            return res.status(404).json({ success: false, error: msg.UserNotFound });
        } else {
            user = user[0];
            return res.json({ success: true, message: msg.Profile, user });
        }
    });
});

// Notification Subscribe
router.post('/notification-subscribe', ValidationUtility.validateSubscription, (req, res, next) => {
    NotificationSubscription.getUserByEmailId(req.body.email, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            res.status(422)
            return res.json({ success: false, error: err });
        } else if (user) {
            return res.status(422).json({
                success: false,
                error: msg.AlreadyEmailSubscribe
            });
        } else {
            var newNotificationSubscription = new NotificationSubscription({
                email: req.body.email
            })
            NotificationSubscription.addSubscription(newNotificationSubscription, (err, new_user) => {
                if (err) {
                    Log.ManageLog(err);
                    res.status(422)
                    return res.json({ success: false, error: err });
                } else if (!new_user) {
                    return res.status(422).json({
                        success: false,
                        error: msg.FailedToSubscribe
                    });
                } else {
                    var templateContent = fs.readFileSync('email_templates/email-subscription.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', '<p>You have subscribed for the Newsletter</p>');
                    Utility.sendEmail(templateContent, req.body.email, msg.ES_EmailSubscription)
                    return res.json({
                        success: true,
                        message: msg.EmailSubscription
                    });
                }
            });
        }
    });
});

// Notification Subscribe
router.get('/notification-subscribe', (req, res, next) => {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    NotificationSubscription.getSubscribedEmailAddresses(page, limit, (err, notification_subscribe) => {
        if (err) {
            Log.ManageLog(err);
            res.status(422)
            return res.json({ success: false, error: err });
        } else {
            return res.json({
                success: true,
                message: msg.SubscribeList,
                notification_subscribe
            });
        }
    });
});

// Notification Subscribe Email
router.delete('/notification-subscribe/:email', (req, res, next) => {
    // fetch data by role and user_name
    NotificationSubscription.remove({ "email": req.params.email }, (err, notification_subscribe) => {
        if (err) {
            Log.ManageLog(err);
            res.status(422)
            return res.json({ success: false, error: err });
        } else {
            return res.json({
                success: true,
                message: msg.UnSubscribeSuccessfull
            });
        }
    });
});

// Fetch User's Data such as Projects, Task, Project Category and Student Category
router.get('/user-select/:id', function (req, res, next) {
    User.getUserProjectsById(req.params.id, (err, user) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!user.length) {
            return res.status(404).json({ success: false, error: msg.UserNotFound });
        } else {
            user = user[0];
            return res.json({ success: true, message: msg.Profile, user });
        }
    });
});

// Ftech Discussion Board By Project ID
router.get('/discussion-board-list/:project_id', function (req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    let organization_id = false;
    DiscussionBoard.getProjectDiscussionBoardList(organization_id, page, limit, req.params.project_id, (err, discussionBoard) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!discussionBoard) {
            return res.status(422).json({ success: false, error: msg.DiscussionBoardNotFound });
        } else {
            return res.json({ success: true, discussionBoard });
        }
    })
});

// Fetch Project Details Like Activities, Tasks, etc.
router.get('/project-dashboard/:id', function (req, res) {
    Project.getProjectDashboardById(ObjectId(req.params.id), (error, project) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            ProjectPhotosAndVideos.getPhotosAndVideosOfProject(ObjectId(req.params.id), (err, result) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else {

                    let photos = result.photos;
                    let videos = result.videos;
                    project = project[0];
                    return res.json({ success: true, project, photos, videos });

                }
            });
            // project = project[0];
            // return res.json({ success: true, project });
        }
    });
});

// Fetch Data For Project's Risk Type Chart
router.get('/project-risk-types/:project_id', function (req, res, next) {
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

// Fetch All Team Members For Organization Chart
router.get('/team-member-org-chart/:id', function (req, res) {
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
                                            dob: user.dob,
                                            profile_pic: user.profile_pic,
                                            project_role: user.project_role,
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

// Student Dashboard
router.get('/dashboard-search-by-name/:name', function (req, res, next) {
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

// Fetch All Deliverables
router.get('/deliverables-list/:id', function (req, res) {
    let page = 0;
    let limit = 0;
    Deliverables.getAllDeliverables(ObjectId(req.params.id.toString()), page, limit, (error, deliverables) => {
        if (error) {
            return res.status(422).json({ success: false });
        } else if (!deliverables) {
            return res.status(422).json({ success: false, error: msg.DeliverablesNotFound });
        } else {
            return res.json({ success: true, deliverables });
        }
    });
});

// Student list For Admin and Super Admin For MAP Locator
router.get('/find-all-registered-students', function (req, res, next) {
    let role_id = STUDENT_ID; // User role id
    let organization_id = 0;
    User.getAllRegisteredStudents(role_id, organization_id, (err, users) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!users) {
            return res.json({ success: false, error: msg.noData });
        } else {
            return res.status(200).json({ success: true, message: msg.userAccount, users });
        }
    });
});

// Student list For Admin and Super Admin For MAP Locator Project Wise
router.get('/find-all-registered-students/:project_id', function (req, res, next) {
    let role_id = STUDENT_ID; // User role id
    Project.getProjectById(req.params.project_id.toString(), (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            TeamMember.getAllTeamMemberLocations(ObjectId(req.params.project_id.toString()), (error, users) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!users) {
                    return res.json({ success: false, error: msg.TeamMemberNotFound });
                } else {
                    return res.status(200).json({ success: true, users });
                }
            });
        }
    });
});

// Check Email Configuration
router.get('/check-email', function (req, res, next) {
    // send mail for account verification
    let body = 'HELLO WORLD';
    let to = 'mahi.patidar13@gmail.com';
    let subject = 'Test Mail';
    Utility.sendEmail(body, to, subject);
    return res.json({
        success: true,
        message: "Email Sent"
    });
});

// Fetch All Project's Risk Type Data
router.get('/risk-type-list/:id/:project_id', function (req, res) {
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

// Get News Detail by ID
router.get('/news-detail/:id', function (req, res) {
    News.getNewsDetailsById(ObjectId(req.params.id), (err, news) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!news) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else {
            return res.json({ success: true, news });
        }
    });
});

// Get Event Detail by ID
router.get('/event-detail/:id', function (req, res) {
    Calendar.getEventDetailsById(ObjectId(req.params.id), (err, event) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!event) {
            return res.status(404).json({ success: false, error: msg.EventNotFound });
        } else {
            return res.json({ success: true, event });
        }
    })
});

router.get('/discussion-detail/:id', function (req, res) {
    DiscussionBoard.getDiscussionBoardById(req.params.id, (err, discussionBoard) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!discussionBoard) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, discussionBoard });
        }
    })
});

router.get('/comments/:thread_id', function (req, res) {
    Comment.getAllComment(req.params.thread_id, 0, 0, (err, comments) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!comments) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, comments: comments });
        }
    })
});

module.exports = router;
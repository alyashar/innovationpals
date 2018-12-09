const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const jwt = require('jsonwebtoken');
const passwordHash = require('password-hash');
const path = require('path')
const fs = require('fs');
const multer = require('multer')
const base64Img = require('base64-img');

const AppConfig = require("../constants/appConfig")
const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const User = require('../model/user');
const Organization = require('../model/organization');
const StudentCategory = require('../model/student_category');
const Utility = require('../utility/index');
const Log = require('../manage-log');
const Project = require('../model/project');
const Task = require('../model/tasks');

const fieldEncryption = require('mongoose-field-encryption');
const Validation = require('node-input-validator');
const ValidationUtility = require('../utility/validations')

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

let resurved = {}; // first argument for constructor will always be blank object
// This empty object (i.e. r in this case) will be used in future
let blocked = '';
let setting = {};

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Register Super Admin
router.post('/register-super-admin', Auth.isSuperAdmin, ValidationUtility.validateRegisterSuperAdminForm, function (req, res) {
    // chech that email is alredy register or not
    User.checkForReg('email', req.body.email, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!user) {
            var systemGenratedPassword = Utility.systemGenrateRandomPassword()
            console.log("systemGenratedPassword", systemGenratedPassword);
            var systemGenratedHashedPassword = passwordHash.generate(systemGenratedPassword);
            let newUser = new User({
                email: req.body.email.toLowerCase(),
                password: systemGenratedHashedPassword,
                role_id: ObjectId(SUPER_ADMIN_ID),
                name: req.body.name,
                status: true,
                isUserLoggedInFirstTime: true
            });
            // save data of newlly register user
            User.addUser(newUser, (err, user) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (user) {
                    // varification email sending after successfull registraion\
                    // create expire time for link
                    var date = new Date();
                    date.setDate(date.getDate() + 2);
                    var data = { time: date, email: req.body.email }
                    // email encryption
                    let encrypted = fieldEncryption.encrypt(JSON.stringify(data), 'secret');
                    var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', '<p>Your password for this email address in this organization is "' + systemGenratedPassword + '"</p>');

                    Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                    return res.json({
                        success: true,
                        message: msg.SuperAdminRegistered,
                        user: {
                            email: req.body.email,
                        }
                    });
                } else {
                    return res.status(422).json({ success: false, error: msg.registrationFail });
                }
            });
        } else {
            return res.status(422).json({ success: false, error: msg.emailValidation });
        }
    });
});

// Register Admin
router.post('/register-admin', Auth.isSuperAdminOrAdmin, ValidationUtility.validateRegisterAdminForm, function (req, res) {
    // chech that email is alredy register or not
    User.checkForReg('email', req.body.email, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!user) {
            let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id.toString()
            Organization.getOrganizationById(organization_id, (err, organization) => {
                if (err || !organization) {
                    return res.status(422).json({ success: false, error: msg.OrganizationNotFound });
                } else {
                    var systemGenratedPassword = Utility.systemGenrateRandomPassword()
                    console.log("systemGenratedPassword", systemGenratedPassword);
                    var systemGenratedHashedPassword = passwordHash.generate(systemGenratedPassword);
                    let newUser = new User({
                        email: req.body.email.toLowerCase(),
                        password: systemGenratedHashedPassword,
                        role_id: ObjectId(ADMIN_ID),
                        organization_id: ObjectId(organization_id),
                        name: req.body.name,
                        status: true,
                        isUserLoggedInFirstTime: true
                    });
                    // save data of newlly register user
                    User.addUser(newUser, (err, user) => {
                        if (err) {
                            Log.ManageLog(err);
                            return res.status(422).json({ success: false, error: err });
                        } else if (user) {
                            var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                            templateContent = templateContent.replace('####EmailBody####', '<p>Your password for this email address in this organization is "' + systemGenratedPassword + '"</p>');
                            Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                            return res.json({
                                success: true,
                                message: msg.AdminRegistered,
                                user: {
                                    email: req.body.email,
                                }
                            });
                        } else {
                            return res.status(422).json({ success: false, error: msg.registrationFail });
                        }
                    });
                }
            })
        } else {
            return res.status(422).json({ success: false, error: msg.emailValidation });
        }
    });
});

// Register Student
router.post('/register', Auth.isAdmin, ValidationUtility.validateUserRegisterationForm, function (req, res) {
    // chech that email is alredy register or not
    User.checkForReg('email', req.body.email, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!user) {
            StudentCategory.findById(ObjectId(req.body.student_category_id), (error, studentCategory) => {
                if (err || !studentCategory) {
                    return res.status(404).json({ success: false, error: msg.StudentCategoryNotFound });
                }
            })
            var systemGenratedPassword = Utility.systemGenrateRandomPassword();
            console.log("systemGenratedPassword", systemGenratedPassword);
            var hashedPassword = passwordHash.generate(systemGenratedPassword);
            let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id.toString();
            let role_id = ObjectId(STUDENT_ID);
            let newUser = new User({
                email: req.body.email.toLowerCase(),
                password: hashedPassword,
                role_id,
                organization_id,
                name: req.body.name,
                status: true,
                number: req.body.number,
                age: req.body.age,
                dob: req.body.dob,
                description: req.body.description,
                certificate: req.body.certificate,
                isUserLoggedInFirstTime: true,
                address_x: req.body.address_X,
                address_y: req.body.address_Y,
                address: req.body.address,
                student_category_id: ObjectId(req.body.student_category_id)
            });
            if (req.body.profile_pic && req.body.profile_pic.length) {
                Auth.getImageURL(req, req.body.profile_pic, 'CategoryImage').then(function (image_link) {
                    newUser['profile_pic'] = image_link;
                    User.addUser(newUser, (err, user) => {
                        if (err) {
                            Log.ManageLog(err);
                            return res.status(422).json({ success: false, error: err });
                        } else if (user) {
                            let user_id = user._id;
                            // Student Added to the Organization
                            Organization.updateOne({ _id: ObjectId(organization_id) }, { $push: { 'user_id': user_id } }, (err, result) => {
                                console.log('Student Added to the Organization');
                            });

                            var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                            templateContent = templateContent.replace('####EmailBody####', '<p>Your Password for this Email address is "' + systemGenratedPassword + '"</p>');
                            Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                            return res.json({
                                success: true,
                                message: msg.userRegistration,
                                user: {
                                    email: req.body.email,
                                }
                            });
                        } else {
                            return res.status(422).json({ success: false, error: msg.registrationFail });
                        }
                    });
                });
            } else {
                User.addUser(newUser, (err, user) => {
                    if (err) {
                        Log.ManageLog(err);
                        return res.status(422).json({ success: false, error: err });
                    } else if (user) {
                        let user_id = user._id;
                        // Student Added to the Organization
                        Organization.updateOne({ _id: ObjectId(organization_id) }, { $push: { 'user_id': user_id } }, (err, result) => {
                            console.log('Student Added to the Organization');
                        });

                        var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                        templateContent = templateContent.replace('####EmailBody####', '<p>Your Password for this Email address is "' + systemGenratedPassword + '"</p>');
                        Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                        return res.json({
                            success: true,
                            message: msg.userRegistration,
                            user: {
                                email: req.body.email,
                            }
                        });
                    } else {
                        return res.status(422).json({ success: false, error: msg.registrationFail });
                    }
                });
            }
        } else {
            return res.status(422).json({ success: false, error: msg.emailValidation });
        }
    });
});

// Update Student
router.put('/update-user/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, ValidationUtility.validateUserRegisterationUpdateForm, function (req, res, next) {
    User.getUserById(req.params.id, (err, user) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!user) {
            return res.status(422).json({ success: false, error: msg.userNotFound });
        } else if (user.role_id._id.toString() !== STUDENT_ID) {
            return res.status(422).json({ success: false, error: msg.UserIsNotStudent });
        } else if (!req.isUserMasterAdmin && user.organization_id._id.toString() !== req.authData.organization_id.toString()) {
            return res.status(422).json({ success: false, error: msg.AdminNotAllowdToUpdateOtherOrganization });
        } else {
            let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id.toString();
            let newData = {
                name: req.body.name,
                number: req.body.number,
                dob: req.body.dob,
                description: req.body.description,
                certificate: req.body.certificate,
                address_x: req.body.address_X == undefined ? user.address_x : req.body.address_X,
                address_y: req.body.address_Y == undefined ? user.address_y : req.body.address_Y,
                address: req.body.address,
                updated_at: new Date(),
                student_category_id: ObjectId(req.body.student_category_id)
            }
            if (req.body.profile_pic && req.body.profile_pic.length) {
                Auth.getImageURL(req, req.body.profile_pic, 'CategoryImage').then(function (image_link) {
                    newData['profile_pic'] = image_link;
                    User.updateOne({ _id: ObjectId(req.params.id) }, newData, function (err, result) {
                        if (err) {
                            Log.ManageLog(err);
                            return res.status(422).json({ success: false, error: err });
                        } else {
                            return res.json({ success: true, message: msg.userProfileUpdate });
                        }
                    });
                });
            } else {
                User.updateOne({ _id: ObjectId(req.params.id) }, newData, function (err, result) {
                    if (err) {
                        Log.ManageLog(err);
                        return res.status(422).json({ success: false, error: err });
                    } else {
                        return res.json({ success: true, message: msg.userProfileUpdate });
                    }
                });
            }
        }
    })
});

// Update Admin and Super Admin Data
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res, next) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:2'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let newData = {
                name: req.body.name,
                updated_at: new Date()
            };
            let id = req.authData._id;
            User.getUserById(req.params.id, (err, user) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });

                } else if (!user) {
                    return res.status(422).json({ success: false, error: msg.userNotFound });

                } else if (user.role_id._id.toString() === SUPER_ADMIN_ID && req.authData._id.toString() === ADMIN_ID) {
                    return res.status(401).json({ success: false, error: msg.authFail });

                } else if (!req.isUserMasterAdmin && user.organization_id._id.toString() !== req.authData.organization_id.toString()) {
                    return res.status(422).json({ success: false, error: msg.AdminNotAllowdToUpdateOtherOrganization });

                } else {
                    User.updateOne({ _id: ObjectId(req.params.id) }, newData, function (err, result) {
                        if (err) {
                            Log.ManageLog(err);
                            return res.status(422).json({ success: false, error: err });
                        } else {
                            return res.json({ success: true, message: msg.userProfileUpdate });
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

// Update User Data
router.put('/update', Auth.isSuperAdminOrAdmin, function (req, res, next) {

    let validator = new Validation({}, req.body, {
        name: 'required|minLength:2'
    });

    validator.check().then(function (matched) {
        if (matched) {
            let newData = {
                name: req.body.name,
                updated_at: new Date()
            };
            let id = req.authData._id;
            User.updateOne({ _id: ObjectId(id) }, newData, function (err, result) {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else {
                    User.getnewToken(id, (err, data) => {
                        let secret = data.toObject();
                        const token = jwt.sign(secret, AppConfig.JWT_AUTHTOKEN_SECRET, {
                            expiresIn: '365d'
                        });
                        return res.json({
                            success: true,
                            message: msg.passwordChange,
                            token: token
                        });
                    });
                    //return res.json({ success: true, message: msg.userProfileUpdate });
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

// fatch logged user data by id
router.get('/select', function (req, res, next) {
    return res.json({ success: true, message: "Your Profile", user: req.authUser });
});

// Change password
router.put('/change-password', ValidationUtility.validateChangePasswordForm, function (req, res, next) {
    const id = req.authData._id;
    User.getnewToken(id, (err, user) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (passwordHash.verify(req.body.old_password, user.password)) {
            // password encryptoin
            var hashedPassword = passwordHash.generate(req.body.new_password);
            var password = {
                password: hashedPassword,
                updated_at: new Date(),
                isUserLoggedInFirstTime: false
            };
            // query to update password
            User.updateOne({ _id: ObjectId(id) }, password, function (err, result) {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else {
                    User.getnewToken(id, (err, data) => {
                        let secret = data.toObject();
                        const token = jwt.sign(secret, AppConfig.JWT_AUTHTOKEN_SECRET, {
                            expiresIn: '365d'
                        });
                        return res.json({
                            success: true,
                            message: msg.passwordChange,
                            token: token
                        });
                    });
                }
            });
        } else {
            return res.status(422).json({ success: false, error: msg.wrongInfo });
        }
    });
});

//  Update profile Image
router.put('/upload-image', function (req, res, next) {
    let id = req.authData._id;
    let validator = new Validation({}, req.body, {
        profile_pic: 'required',
    });
    validator.check().then(function (matched) {
        if (matched) {
            if (req.body.profile_pic && req.body.profile_pic.length) {
                Auth.getImageURL(req, req.body.profile_pic, 'CategoryImage').then(function (image_link) {
                    var userToUpdate = id;
                    var profile_pic = { profile_pic: image_link, updated_at: new Date() };
                    User.updateOne({ _id: ObjectId(userToUpdate) }, profile_pic, function (err, result) {
                        if (err) {
                            Log.ManageLog(err);
                            return res.status(422).json({ success: false, error: err });
                        } else {
                            return res.status(422).json({ success: false, error: msg.failToChangeImage });
                        }
                    });
                });
            }
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

// Account varifiacation by email
router.get('/active/:encrypted/', function (req, res, next) {
    let decrypted = fieldEncryption.decrypt(req.params.encrypted, 'secret');
    decrypted = JSON.parse(decrypted)
    var current_time = new Date();
    // createing link only for one time use only
    var data = '';
    User.findOne({ 'email': decrypted.email }, function (err, result) {
        Log.ManageLog(err);
        data = result.status;

        if (Date.parse(decrypted.time) < Date.parse(current_time) || data) {
            return res.status(422).json({ success: false, error: msg.cantAccessLink });
        } else {
            const update_query = { $set: { success: true, updated_at: new Date() } };
            const query = { email: decrypted['email'] };
            User.updateOne(query, update_query, function (err, user) {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (user.nModified) {
                    return res.json({ success: true, message: msg.accountActivate });
                } else {
                    return res.status(422).json({ success: false, error: msg.failToAactivateAccount });
                }
            });
        }
    });
});

// user account deactivated
router.put('/deactivate/:user_id', Auth.isSuperAdminOrAdmin, function (req, res, next) {
    let id = req.params.user_id;
    var uid = id.toString();
    User.getUserById(uid, (err, targetUser) => {
        if (err) {
            return res.status(404).json({ success: false });
        } else if (!targetUser) {
            return res.status(401).json({ success: false, error: msg.UserNotFound });
        } else if (req.authUser.role_id._id.toString() === ADMIN_ID && targetUser.role_id._id.toString() === SUPER_ADMIN_ID) {
            return res.status(401).json({ success: false, error: msg.authFail });
        } else if (req.authUser._id.toString() === targetUser._id.toString()) {
            return res.status(401).json({ success: false, error: msg.authFail });
        } else if (!req.isUserMasterAdmin && req.authData.organization_id.toString() === targetUser.organization_id._id.toString()) {
            // Check if user is a student
            if (targetUser.role_id._id.toString() === STUDENT_ID) {
                Task.findOne({ 'student_id': uid }, (err, tasks) => {
                    if (err) {
                        return res.status(404).json({ success: false });
                    } else if (tasks) {
                        return res.status(404).json({ success: false, error: msg.StudentAlreadyAssociatedWithProject });
                    } else {
                        var status = { 'is_deleted': !targetUser.is_deleted, 'status': !targetUser.status }
                        User.updateOne({ "_id": uid }, status, function (err, result) {
                            if (err) {
                                Log.ManageLog(err);
                                return res.status(422).json({ success: false, error: err });
                            } else {
                                let message = targetUser.status ? msg.accountDeactivate : msg.AccountActivated
                                return res.json({ success: true, message });
                            }
                        });
                    }
                });
            } else {
                var status = { 'is_deleted': !targetUser.is_deleted, 'status': !targetUser.status }
                User.updateOne({ "_id": uid }, status, function (err, result) {
                    if (err) {
                        Log.ManageLog(err);
                        return res.status(422).json({ success: false, error: err });
                    } else {
                        let message = targetUser.status ? msg.accountDeactivate : msg.AccountActivated
                        return res.json({ success: true, message });
                    }
                });
            }
        } else if (req.isUserMasterAdmin) {
            var status = { 'is_deleted': !targetUser.is_deleted, 'status': !targetUser.status }
            User.updateOne({ "_id": uid }, status, function (err, result) {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else {
                    let message = targetUser.status ? msg.accountDeactivate : msg.AccountActivated
                    return res.json({ success: true, message });
                }
            });
        } else {
            return res.status(401).json({ success: false, error: msg.UserOrganizationNotSameAsAdmin });
        }
    });
});

// Make Admin
router.post('/make-admin', Auth.isSuperAdmin, function (req, res, next) {

    let validator = new Validation({}, req.body, {
        user_id: 'required',
        organization_id: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            let id = req.body.user_id;
            let organization_id = req.body.organization_id
            var uid = id.toString();
            User.getUserById(uid, (err, user) => {
                if (err || !user) {
                    return res.status(422).json({ success: false, error: msg.UserNotFound });

                } else if (uid === req.authData._id.toString()) {
                    return res.status(422).json({ success: false, error: msg.authFail });

                } else {
                    Organization.getOrganizationById(organization_id, (err, organization) => {
                        if (err || !organization) {
                            return res.status(422).json({ success: false, error: msg.OrganizationNotFound });
                        } else {
                            var data = {
                                role_id: ObjectId(ADMIN_ID),
                                organization_id,
                                isUserLoggedInFirstTime: true
                            }
                            var systemGenratedPassword = Utility.systemGenrateRandomPassword()
                            console.log("systemGenratedPassword", systemGenratedPassword);
                            data.password = passwordHash.generate(systemGenratedPassword);
                            User.updateOne({ "_id": uid }, data, function (err, result) {
                                if (err) {
                                    Log.ManageLog(err);
                                    return res.status(422).json({ success: false, error: err });
                                } else {
                                    var templateContent = fs.readFileSync('email_templates/register-account.html', encoding = "utf8");
                                    templateContent = templateContent.replace('####EmailBody####', '<p>Your password for email address "' + user.email + '" is "' + systemGenratedPassword + '"</p>');
                                    Utility.sendEmail(templateContent, user.email, msg.ES_RegisterNewAccount)
                                    return res.json({ success: true, message: msg.AdminRegistered });
                                }
                            });
                        }
                    })
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
    })
});

// Soft delete user
router.delete('/remove', Auth.isSuperAdminOrAdmin, function (req, res, next) {
    var id = req.authData._id;
    // Check if user is a student
    if (req.authUser.role_id._id.toString() === STUDENT_ID) {
        Task.findOne({ 'student_id': uid }, (err, tasks) => {
            if (err) {
                return res.status(404).json({ success: false });
            } else if (tasks) {
                return res.status(404).json({ success: false, error: msg.StudentAlreadyAssociatedWithProject });
            } else {
                var updateQuery = { 'is_deleted': !req.authData.is_deleted, 'status': !req.authData.status }
                User.updateOne({ '_id': ObjectId(id) }, updateQuery, function (err, result) {
                    if (err) {
                        Log.ManageLog(err);
                        return res.status(422).json({ success: false, error: err });
                    } else {
                        return res.json({ success: true, message: msg.deleteAccount });
                    }
                });
            }
        });
    } else {
        var updateQuery = { 'is_deleted': !req.authData.is_deleted, 'status': !req.authData.status }
        User.updateOne({ '_id': ObjectId(id) }, updateQuery, function (err, result) {
            if (err) {
                Log.ManageLog(err);
                return res.status(422).json({ success: false, error: err });
            } else {
                return res.json({ success: true, message: msg.deleteAccount });
            }
        });
    }
});

// find by user name
router.get('/find/:page/:num_records/:name', function (req, res, next) {
    var query = { "name": { $regex: new RegExp(req.params.name, 'i') }, "role": 'User', "is_deleted": false };
    User.paginate(query, { page: req.params.page, limit: parseInt(req.params.num_records), sort: { 'name': 1 } }, function (err, user) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (user.docs.length) {
            let length = user.docs.length
            var j = 0;
            var obj = [];
            for (var i = 0; i < length; i++) {
                if (user.docs[i]._id.toString() != id.toString()) {
                    user.docs[i].password = null;
                    user.docs[i].survey_id = null;
                    obj[j] = user.docs[i];
                    j++;
                }
            }
            user.docs = obj;
            if (user.docs.length) {
                return res.json({ success: true, message: msg.userAccount, user });
            } else {
                return res.status(422).json({ success: false, error: msg.userNotFound });
            }
        } else {
            return res.status(422).json({ success: false, error: msg.userNotFound });
        }
    });
});

// Find by Role
router.get('/find-by-role/:page/:num_records/:role_id', function (req, res, next) {
    let { role_id, num_records, page } = req.params;
    let notInUserArray = [req.authData._id.toString(), SUPER_ADMIN_ID];
    notInUserArray = Array.from(new Set(notInUserArray));
    let isRoleStudent = role_id === STUDENT_ID;

    let organization_id = false;
    if (req.isUserMasterAdmin) {
        organization_id = (req.query.organization_id != 'undefined' && req.query.organization_id != undefined && req.query.organization_id != '') ? req.query.organization_id : false;
    } else {
        organization_id = req.authData.organization_id;
    }

    User.getAllUserList(page, num_records, role_id, organization_id, notInUserArray, isRoleStudent, function (err, users) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (users && !users.total) {
            return res.json({ success: false, userList: users });
        } else {
            return res.json({ success: true, message: msg.userAccount, users });
        }
    });
});

// List All Students
router.get('/list-students', function (req, res, next) {
    let role_id = STUDENT_ID;
    let findUserQuery = req.isUserMasterAdmin ? { role_id, is_deleted: false, status: true } : { role_id, organization_id: ObjectId(req.authUser.organization_id._id), is_deleted: false, status: true };
    User.find(findUserQuery, { "name": 1, "_id": 1 }, function (err, users) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else {
            return res.json({ success: true, message: msg.StudentList, studentList: users });
        }
    });
});

// Fetch User's Data such as Projects, Task, Project Category and Student Category
router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res, next) {
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

// Student Dashboard
router.get('/my-dashboard', objectIdErrorHandlerMiddleware, Auth.isStudent, function (req, res, next) {
    let user_id = req.authUser._id;
    User.getUserProjectsById(user_id, (err, user) => {
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

// forget password reset
router.put('/reset-password/:encrypted', function (req, res) {

    let decrypted = fieldEncryption.decrypt(req.params.encrypted, 'secret');
    decrypted = JSON.parse(decrypted)
    var current_time = new Date();

    if (Date.parse(decrypted.time) < Date.parse(current_time)) {
        return res.status(422).json({ success: false, error: msg.cantAccessLink });
    } else {

        let validator = new Validation({}, req.body, {
            password: 'required|minLength:6',
            c_password: 'required|same:password',
        });
        validator.check().then(function (matched) {
            if (matched) {
                var hashedPassword = passwordHash.generate(req.body.password);
                var password = { "password": hashedPassword }
                User.updateOne({ "email": decrypted.email }, password, function (err, user) {
                    if (err) {
                        Log.ManageLog(err);
                        return res.status(422).json({ success: false, error: err });
                    } else if (!user.nModified) {
                        return res.status(422).json({ success: false, error: msg.failToResetPassword });
                    }

                    return res.json({
                        success: true,
                        message: msg.resetPassword
                    });

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
    }
});

// find by user name
router.get('/list-students/:page/:num_records', function (req, res, next) {
    let { num_records, page } = req.params
    let organization_id = false
    let notInUserArray = []
    let isRoleStudent = true
    let role_id = ObjectId(STUDENT_ID)

    num_records = parseInt(num_records)
    page = parseInt(page)

    User.getPaginateStudentList(page, num_records, role_id, organization_id, notInUserArray, isRoleStudent, function (err, users) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (users && !users.total) {
            return res.json({ success: false, userList: users });
        } else {
            fiterStudentDetail(users)
                .then(usersList => {
                    return res.json({ success: true, message: msg.userAccount, usersList });
                })
        }
    });
});

router.get('/student-detail/:id', objectIdErrorHandlerMiddleware, function (req, res, next) {
    let { id: student_id } = req.params

    let organization_id = ObjectId(req.authData.organization_id)
    let role_id = ObjectId(STUDENT_ID)

    User.getStudentDetails(student_id, role_id, organization_id, function (err, student) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!student) {
            return res.status(404).json({ success: false, error: msg.StudentNotFound });
        } else {
            return res.json({ success: true, message: msg.userAccount, student });
        }
    });
})

// Users (Master Admin, Super Admin, Admin and Student) Dashboard Counts
router.get('/dashboard', Auth.isSuperAdminOrAdmin, function (req, res, next) {
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.organization_id._id;
    let role_id = req.authUser.role_id._id;
    User.getDashboardCounts(role_id, organization_id, (result) => {
        if (result && result.length) {
            let total = {};
            if (role_id == ADMIN_ID) {
                total = {
                    'total_students': result[0],
                    'total_projects': result[1]
                };
            } else {
                total = {
                    'total_super_admins': result[0],
                    'total_admins': result[1],
                    'total_students': result[2],
                    'total_projects': result[3]
                };
            }
            return res.json({ success: true, message: msg.DashboardCount, total });
        } else {
            return res.status(422).json({ success: false });
        }
    })
});

// Student list for login admin without pagination
router.get('/find-students-for-login-admin', function (req, res, next) {
    let role_id = STUDENT_ID; // User role id
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.organization_id._id
    let notInUserArray = req.authData._id.toString();

    User.getAllUserListForLoginAdmin(role_id, organization_id, notInUserArray, (err, users) => {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!users.length) {
            return res.json({ success: false, error: msg.noData });
        } else {
            return res.status(200).json({ success: true, message: msg.userAccount, users });
        }
    });
});

// List All Admins
router.get('/list-admins', function (req, res, next) {
    let role_id = ADMIN_ID;
    let findUserQuery = req.isUserMasterAdmin ? { role_id, is_deleted: false, status: true } : { role_id, organization_id: ObjectId(req.authUser.organization_id._id), is_deleted: false, status: true };
    User.find(findUserQuery, { "name": 1, "_id": 1 }, function (err, admin_users) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else {
            return res.json({ success: true, admin_users });
        }
    });
});

// Student list For Admin and Super Admin For MAP Locator
router.get('/find-all-registered-students', function (req, res, next) {
    let role_id = STUDENT_ID; // User role id
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.organization_id._id
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

module.exports = router;

function fiterStudentDetail({ studentList }) {
    let userList = []
    return new Promise(resolve => {
        studentList.forEach(user => {
            user.totalProject = user.project_id.length
            userList.push(user)
        })
        resolve(userList)
    })
}
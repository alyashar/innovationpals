const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const Validation = require('node-input-validator');

const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Log = require('../manage-log');
const base64ToImage = require('base64-to-image');
const StudentCategory = require('../model/student_category');
const User = require('../model/user');
const Organization = require('../model/organization');
const { filterString } = require('../utility/index');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Add Student Category
router.post('/add', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        student_category_image: 'string',
        organization_id: req.isUserMasterAdmin ? "required" : "string"
    });
    validator.check().then(function (matched) {
        if (matched) {
            var slug = filterString(req.body.name)
            StudentCategory.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: req.body.organization_id } }, (err, isStudentCategoryExist) => {
                //StudentCategory.findOne({ slug }, function (err, isStudentCategoryExist) {
                if (err) {
                    return res.status(422).json({ success: false, error: msg.StudentCategoryAddFailed });
                } else if (isStudentCategoryExist) {
                    return res.status(422).json({ success: false, error: msg.StudentCategoryShouldBeUnique });
                } else {
                    let organization_id = req.isUserMasterAdmin ? ObjectId(req.body.organization_id) : ObjectId(req.authData.organization_id)
                    let newStudentCategory = new StudentCategory({
                        name: req.body.name,
                        slug,
                        organization_id,
                        created_by_user_id: ObjectId(req.authData._id)
                    });
                    if (req.body.student_category_image && req.body.student_category_image.length) {
                        Auth.getImageURL(req, req.body.student_category_image, 'CategoryImage').then(function (image_link) {
                            newStudentCategory['student_category_image'] = image_link;
                            StudentCategory.addStudentCategory(newStudentCategory, (err, studentCategory) => {
                                if (err || !studentCategory) {
                                    return res.status(422).json({ success: false, error: msg.StudentCategoryAddFailed });
                                } else {
                                    return res.json({ success: true, message: msg.StudentCategoryAddSuccess });

                                }
                            });
                        });
                    } else {
                        StudentCategory.addStudentCategory(newStudentCategory, (err, studentCategory) => {
                            if (err || !studentCategory) {
                                return res.status(422).json({ success: false, error: msg.StudentCategoryAddFailed });
                            } else {
                                return res.json({ success: true, message: msg.StudentCategoryAddSuccess });

                            }
                        });
                    }
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

// Update Student Category
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        organization_id: req.isUserMasterAdmin ? "required" : "string"
    });
    validator.check().then(function (matched) {
        if (matched) {
            StudentCategory.getStudentCategoryId(req.params.id, (err, studentCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: msg.StudentCategoryUpdateFailed });
                } else if (!studentCategory) {
                    return res.status(404).json({ success: false, error: msg.StudentCategoryNotFound });
                } else {
                    var slug = filterString(req.body.name)
                    let id = req.params.id;
                    let organization_id = req.isUserMasterAdmin ? ObjectId(req.body.organization_id) : ObjectId(req.authData.organization_id)
                    let newStudentCategory = {
                        name: req.body.name.trim(),
                        slug,
                        "organization_id": organization_id,
                        updated_at: new Date()
                    };
                    if (slug === studentCategory.slug) {
                        if (req.body.student_category_image && req.body.student_category_image.length) {
                            Auth.getImageURL(req, req.body.student_category_image, 'CategoryImage').then(function (image_link) {
                                newStudentCategory['student_category_image'] = image_link;
                                StudentCategory.updateOne({ _id: ObjectId(id) }, newStudentCategory, function (err, result) {
                                    if (err || !result) {
                                        return res.status(422).json({ success: false });
                                    } else {
                                        return res.json({ success: true, message: msg.StudentCategoryUpdateSuccess });
                                    }
                                });
                            });
                        } else {
                            StudentCategory.updateOne({ _id: ObjectId(id) }, newStudentCategory, function (err, result) {
                                if (err || !result) {
                                    return res.status(422).json({ success: false });
                                } else {
                                    return res.json({ success: true, message: msg.StudentCategoryUpdateSuccess });
                                }
                            });
                        }
                    } else {
                        StudentCategory.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: req.body.organization_id }, '_id': { $ne: id } }, (err, isStudentCategoryExist) => {
                            //StudentCategory.findOne({ 'slug': { $eq: slug }, '_id': { $ne: id } }, (err, isStudentCategoryExist) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: msg.StudentCategoryUpdateFailed });
                            } else if (isStudentCategoryExist) {
                                return res.status(422).json({ success: false, error: msg.StudentCategoryShouldBeUnique });
                            } else {
                                if (req.body.student_category_image && req.body.student_category_image.length) {
                                    Auth.getImageURL(req, req.body.student_category_image, 'CategoryImage').then(function (image_link) {
                                        newStudentCategory['student_category_image'] = image_link;
                                        StudentCategory.updateOne({ _id: ObjectId(id) }, newStudentCategory, function (err, result) {
                                            if (err || !result) {
                                                return res.status(422).json({ success: false });
                                            } else {
                                                return res.json({ success: true, message: msg.StudentCategoryUpdateSuccess });
                                            }
                                        });
                                    });
                                } else {
                                    StudentCategory.updateOne({ _id: ObjectId(id) }, newStudentCategory, function (err, result) {
                                        if (err || !result) {
                                            return res.status(422).json({ success: false });
                                        } else {
                                            return res.json({ success: true, message: msg.StudentCategoryUpdateSuccess });
                                        }
                                    })
                                }
                            }
                        });
                    }
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

// Fetch Student Categories
router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
    if (req.params.id) {
        StudentCategory.getAllStudentCategoryById(req.params.id, (err, studentCategory) => {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!studentCategory) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, studentCategory });
            }
        })
    } else {
        return res.status(422).json({ success: false });
    }
});

// Get Student Category by Organization
router.get('/category', function (req, res) {
    let organization_id = ObjectId(req.authData.organization_id);
    Organization.findById(organization_id, (error, organization) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!organization) {
            return res.status(404).json({ success: false, error: msg.OrganizationNotFound });
        } else {
            StudentCategory.getAllStudentCategory(organization_id, 0, 0, (err, studentCategory) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else if (!studentCategory) {
                    return res.status(422).json({ success: false, error: msg.StudentCategoryNotFound });
                } else {
                    return res.json({ success: true, studentCategory });
                }
            })
        }
    });
});

// Get All Student Category
router.get('/list', function (req, res) {
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.organization_id._id;
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    StudentCategory.getAllStudentCategory(organization_id, page, limit, (err, studentCategories) => {
        if (page && limit) {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!studentCategories.total) {
                return res.json({ success: false, error: msg.StudentCategoryNotFound });
            } else {
                return res.json({ success: true, studentCategories: studentCategories });
            }
        } else {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!studentCategories.length) {
                return res.json({ success: false, error: msg.StudentCategoryNotFound });
            } else {
                return res.json({ success: true, studentCategories: studentCategories });
            }
        }
    })
});

// Delete Student Category
router.delete('/delete/:id', Auth.isAdmin, function (req, res) {
    StudentCategory.findById(req.params.id, (error, studentCategory) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!studentCategory) {
            return res.status(404).json({ success: false, error: msg.StudentCategoryNotFound });
        } else {
            let media_thumbnail = studentCategory.student_category_image;
            User.findOne({ 'student_category_id': ObjectId(req.params.id.toString()) }, (error, user) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (user) {
                    return res.status(404).json({ success: false, error: msg.StudentCategoryAssociatedWithUser });
                } else {
                    StudentCategory.remove({ '_id': req.params.id }, (err, result) => {
                        if (err && !result) {
                            return res.json({ success: false, error: msg.StudentCategoryDeleteFailed });
                        } else {
                            if (result.n) {
                                let image_path = 'public/StudentCategoryImage/' + media_thumbnail;
                                if (fs.existsSync(image_path)) {
                                    fs.unlink(image_path, function (err) {
                                        if (err) {
                                            throw err;
                                            console.log('File deletion error')
                                        } else {
                                            console.log('File delted');
                                        }
                                    });
                                } else {
                                    console.log('File not exist');
                                }
                                return res.json({ success: true, message: msg.StudentCategoryDeleteSuccess });
                            } else {
                                return res.json({ success: true, message: msg.NoFileToDelete });
                            }
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
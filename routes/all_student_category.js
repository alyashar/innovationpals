const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const AllStudentCategory = require('../model/all_student_category');
const User = require('../model/user');
const ValidationUtility = require('../utility/validations');

const { filterString } = require('../utility/index');

const base64ToImage = require('base64-to-image');

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Add All Student Category
router.post('/add', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required',
        category_image: "string"
    });
    validator.check().then(function (matched) {
        if (matched) {
            let {
                title
            } = req.body
            var slug = filterString(title);
            AllStudentCategory.findOne({ slug }, (err, isExitsAllStudentCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsAllStudentCategory) {
                    return res.status(422).json({ success: false, error: msg.AllStudentCategoryShouldBeUnique });
                } else {
                    if (req.body.category_image && req.body.category_image.length) {
                        Auth.getImageURL(req, req.body.category_image, 'CategoryImage').then(function (image_link) {
                            newAllStudentCategory['category_image'] = image_link;
                            AllStudentCategory.addAllStudentCategory(newAllStudentCategory, (err, allStudentCategory) => {
                                if (err || !allStudentCategory) {
                                    return res.status(422).json({ success: false, error: msg.AllStudentCategoryAddFailed });
                                } else {
                                    return res.json({ success: true, message: msg.AllStudentCategoryAddSuccess });
                                }
                            });
                        });
                    } else {
                        let newAllStudentCategory = new AllStudentCategory({
                            title,
                            slug
                        });
                        AllStudentCategory.addAllStudentCategory(newAllStudentCategory, (err, allStudentCategory) => {
                            if (err || !allStudentCategory) {
                                return res.status(422).json({ success: false, error: msg.AllStudentCategoryAddFailed });
                            } else {
                                return res.json({ success: true, message: msg.AllStudentCategoryAddSuccess });
                            }
                        });
                    }
                }
            });
        } else {
            var newErrormsg = Object.keys(validator.errors).map((key, index) => {
                if (index == 0) {
                    return validator.errors[key].message;
                }
            });
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    });
});

// Update All Student Category
router.put('/update/:id', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            AllStudentCategory.getAllStudentCategoryById(req.params.id, (err, allStudentCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!allStudentCategory) {
                    return res.status(404).json({ success: false, error: msg.AllStudentCategoryNotFound });
                } else {
                    let {
                        title
                    } = req.body
                    let id = req.params.id;
                    var slug = filterString(title);
                    AllStudentCategory.findOne({ 'slug': { $eq: slug }, '_id': { $ne: req.params.id } }, (err, isExitsAllStudentCategory) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });
                        } else if (isExitsAllStudentCategory) {
                            return res.status(422).json({ success: false, error: msg.AllStudentCategoryShouldBeUnique });
                        } else {
                            let newAllStudentCategory = {
                                title,
                                slug,
                                updated_at: new Date()
                            };

                            if (req.body.category_image && req.body.category_image.length) {
                                Auth.getImageURL(req, req.body.category_image, 'CategoryImage').then(function (image_link) {
                                    newAllStudentCategory['category_image'] = image_link;
                                    AllStudentCategory.updateOne({ _id: req.params.id.toString() }, newAllStudentCategory, function (err, result) {
                                        if (err) {
                                            return res.status(422).json({ success: false, error: msg.AllStudentCategoryUpdateFailed });
                                        } else {
                                            return res.json({ success: true, message: msg.AllStudentCategoryUpdateSuccess });
                                        }
                                    });
                                });
                            } else {
                                AllStudentCategory.updateOne({ _id: req.params.id.toString() }, newAllStudentCategory, function (err, result) {
                                    if (err) {
                                        return res.status(422).json({ success: false, error: msg.AllStudentCategoryUpdateFailed });
                                    } else {
                                        return res.json({ success: true, message: msg.AllStudentCategoryUpdateSuccess });
                                    }
                                });
                            }
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

// Select All Student Category
router.get('/list', function (req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    AllStudentCategory.getAllStudentCategory(page, limit, (error, allStudentCategory) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!allStudentCategory.total) {
                return res.status(422).json({ success: false, error: msg.AllStudentCategoryNotFound });
            } else {
                return res.json({ success: true, allStudentCategory });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!allStudentCategory) {
                return res.status(422).json({ success: false, error: msg.AllStudentCategoryNotFound });
            } else {
                return res.json({ success: true, allStudentCategory });
            }
        }
    })
});

// Delete All Student Category
router.delete('/delete/:id', Auth.isSuperAdmin, function (req, res) {
    AllStudentCategory.findById(req.params.id, (error, allStudentCategory) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!allStudentCategory) {
            return res.status(404).json({ success: false, error: msg.AllStudentCategoryNotFound });
        } else {
            let media_thumbnail = allStudentCategory.category_image;
            AllStudentCategory.remove({ '_id': req.params.id }, (err, result) => {
                if (err && !result) {
                    return res.json({ success: false, error: msg.AllStudentCategoryDeleteFailed });
                } else {
                    if (result.n) {
                        let image_path = 'public/ProjectCategoryImage/' + media_thumbnail;
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
                        return res.json({ success: true, message: msg.ProjectCategoryDeleteSuccess });
                    } else {
                        return res.json({ success: true, message: msg.NoFileToDelete });
                    }
                }
            });
        }
    });
});

module.exports = router;
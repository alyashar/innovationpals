const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const Validation = require('node-input-validator');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const AllProjectCategory = require('../model/all_project_category');
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

// Add All Project Category
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
            AllProjectCategory.findOne({ slug }, (err, isExitsAllProjectCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsAllProjectCategory) {
                    return res.status(422).json({ success: false, error: msg.AllProjectCategoryShouldBeUnique });
                } else {
                    if (req.body.category_image && req.body.category_image.length) {
                        Auth.getImageURL(req, req.body.category_image, 'CategoryImage').then(function (image_link) {
                            newAllProjectCategory['category_image'] = image_link;
                            AllProjectCategory.addAllProjectCategory(newAllProjectCategory, (err, allProjectCategory) => {
                                if (err || !allProjectCategory) {
                                    return res.status(422).json({ success: false, error: msg.AllProjectCategoryAddFailed });
                                } else {
                                    return res.json({ success: true, message: msg.AllProjectCategoryAddSuccess });
                                }
                            });
                        });
                    } else {
                        let newAllProjectCategory = new AllProjectCategory({
                            title,
                            slug
                        });
                        AllProjectCategory.addAllProjectCategory(newAllProjectCategory, (err, allProjectCategory) => {
                            if (err || !allProjectCategory) {
                                return res.status(422).json({ success: false, error: msg.AllProjectCategoryAddFailed });
                            } else {
                                return res.json({ success: true, message: msg.AllProjectCategoryAddSuccess });
                            }
                        });
                    }
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

// Update All Project Category
router.put('/update/:id', Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        title: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            AllProjectCategory.getAllProjectCategoryById(req.params.id, (err, allProjectCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!allProjectCategory) {
                    return res.status(404).json({ success: false, error: msg.AllProjectCategoryNotFound });
                } else {
                    let {
                        title
                    } = req.body
                    let id = req.params.id;
                    var slug = filterString(title);
                    AllProjectCategory.findOne({ 'slug': { $eq: slug }, '_id': { $ne: req.params.id } }, (err, isExitsAllProjectCategory) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });
                        } else if (isExitsAllProjectCategory) {
                            return res.status(422).json({ success: false, error: msg.AllProjectCategoryShouldBeUnique });
                        } else {
                            let newAllProjectCategory = {
                                title,
                                slug,
                                updated_at: new Date()
                            };

                            if (req.body.category_image && req.body.category_image.length) {
                                Auth.getImageURL(req, req.body.category_image, 'CategoryImage').then(function (image_link) {
                                    newAllProjectCategory['category_image'] = image_link;
                                    AllProjectCategory.updateOne({ _id: req.params.id.toString() }, newAllProjectCategory, function (err, result) {
                                        if (err) {
                                            return res.status(422).json({ success: false, error: msg.AllProjectCategoryUpdateFailed });
                                        } else {
                                            return res.json({ success: true, message: msg.AllProjectCategoryUpdateSuccess });
                                        }
                                    });
                                });
                            } else {
                                AllProjectCategory.updateOne({ _id: req.params.id.toString() }, newAllProjectCategory, function (err, result) {
                                    if (err) {
                                        return res.status(422).json({ success: false, error: msg.AllProjectCategoryUpdateFailed });
                                    } else {
                                        return res.json({ success: true, message: msg.AllProjectCategoryUpdateSuccess });
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

// Select All Project Category
router.get('/list', function (req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    AllProjectCategory.getAllProjectCategory(page, limit, (error, allProjectCategory) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!allProjectCategory.total) {
                return res.status(422).json({ success: false, error: msg.AllProjectCategoryNotFound });
            } else {
                return res.json({ success: true, allProjectCategory });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false });
            } else if (!allProjectCategory) {
                return res.status(422).json({ success: false, error: msg.AllProjectCategoryNotFound });
            } else {
                return res.json({ success: true, allProjectCategory });
            }
        }
    })
});

// Delete All Project Category
router.delete('/delete/:id', Auth.isSuperAdmin, function (req, res) {
    AllProjectCategory.findById(req.params.id, (error, allProjectCategory) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!allProjectCategory) {
            return res.status(404).json({ success: false, error: msg.AllProjectCategoryNotFound });
        } else {
            let media_thumbnail = allProjectCategory.category_image;
            AllProjectCategory.remove({ '_id': req.params.id }, (err, result) => {
                if (err && !result) {
                    return res.json({ success: false, error: msg.AllProjectCategoryDeleteFailed });
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
                        return res.json({ success: true, message: msg.AllProjectCategoryDeleteSuccess });
                    } else {
                        return res.json({ success: true, message: msg.NoFileToDelete });
                    }
                }
            });
        }
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const Validation = require('node-input-validator');

const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Log = require('../manage-log');
const ProjectCategory = require('../model/project_category');
const Project = require('../model/project');
const { filterString } = require('../utility/index');
const base64ToImage = require('base64-to-image');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

// Add Project Category
router.post('/add', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        //project_category_image: {},
        organization_id: req.isUserMasterAdmin ? 'required' : 'string'
    });
    // Checking Validations
    validator.check().then(function (matched) {
        if (matched) {
            var slug = filterString(req.body.name);
            // Checking Unique For Category Name within an Organization
            ProjectCategory.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: req.body.organization_id } }, (err, isExitsProjectCategory) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (isExitsProjectCategory) {
                    return res.status(422).json({ success: false, error: msg.ProjectCategoryShouldBeUnique });
                } else {
                    let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id;
                    let newProjectCategory = new ProjectCategory({
                        name: req.body.name.trim(),
                        organization_id: ObjectId(organization_id),
                        slug
                    });
                    if (req.body.project_category_image && req.body.project_category_image.length) {
                        Auth.getImageURL(req, req.body.project_category_image, 'CategoryImage').then(function (image_link) {
                            newProjectCategory['project_category_image'] = image_link;
                            ProjectCategory.addProjectCategory(newProjectCategory, (err, projectCategory) => {
                                if (err || !projectCategory) {
                                    return res.status(422).json({ success: false, error: msg.ProjectCategoryNotFound });
                                } else {
                                    return res.json({ success: true, message: msg.ProjectCategoryAddSuccess });
                                }
                            });
                        });
                    } else {
                        ProjectCategory.addProjectCategory(newProjectCategory, (err, projectCategory) => {
                            if (err || !projectCategory) {
                                return res.status(422).json({ success: false, error: msg.ProjectCategoryNotFound });
                            } else {
                                return res.json({ success: true, message: msg.ProjectCategoryAddSuccess });
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

// Update Project Category
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        organization_id: req.isUserMasterAdmin ? "required" : "string"
    });
    // Checking Validations
    validator.check().then(function (matched) {
        if (matched) {
            // Checking Project Category is exits or not
            ProjectCategory.getProjectCategoryById(req.params.id, (err, projectCategory) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else if (!projectCategory) {
                    return res.status(422).json({ success: false, error: msg.ProjectCategoryNotFound });
                } else {
                    var slug = filterString(req.body.name)
                    let id = req.params.id;
                    let organization_id = req.isUserMasterAdmin ? ObjectId(req.body.organization_id) : ObjectId(req.authData.organization_id)
                    let newProjectCategory = {
                        name: req.body.name.trim(),
                        slug,
                        organization_id,
                        updated_at: new Date()
                    };
                    // Checking Unique For Category Name within an Organization
                    if (slug === projectCategory.slug) {
                        // If user uploads the image
                        if (req.body.project_category_image && req.body.project_category_image.length) {
                            Auth.getImageURL(req, req.body.project_category_image, 'CategoryImage').then(function (image_link) {
                                newProjectCategory['project_category_image'] = image_link;
                                ProjectCategory.updateOne({ _id: ObjectId(id) }, newProjectCategory, function (err, result) {
                                    if (err || !result) {
                                        return res.status(422).json({ success: false });
                                    } else {
                                        return res.json({ success: true, message: msg.ProjectCategoryUpdateSuccess });
                                    }
                                });
                            });
                        } else {
                            ProjectCategory.updateOne({ _id: ObjectId(id) }, newProjectCategory, function (err, result) {
                                if (err || !result) {
                                    return res.status(422).json({ success: false });
                                } else {
                                    return res.json({ success: true, message: msg.ProjectCategoryUpdateSuccess });
                                }
                            });
                        }
                    } else {
                        // Checking Unique For Category Name within an Organization
                        ProjectCategory.findOne({ 'slug': { $eq: slug }, 'organization_id': { $eq: req.body.organization_id }, '_id': { $ne: id } }, (err, isExitsProjectCategory) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: err });
                            } else if (isExitsProjectCategory) {
                                return res.status(422).json({ success: false, error: msg.ProjectCategoryShouldBeUnique });
                            } else {
                                if (req.body.project_category_image) {
                                    Auth.getImageURL(req, req.body.project_category_image, 'CategoryImage').then(function (image_link) {
                                        newProjectCategory['project_category_image'] = image_link;
                                        ProjectCategory.updateOne({ _id: ObjectId(id) }, newProjectCategory, function (err, result) {
                                            if (err || !result) {
                                                return res.status(422).json({ success: false });
                                            } else {
                                                return res.json({ success: true, message: msg.ProjectCategoryUpdateSuccess });
                                            }
                                        });
                                    });
                                } else {
                                    ProjectCategory.updateOne({ _id: ObjectId(id) }, newProjectCategory, function (err, result) {
                                        if (err || !result) {
                                            return res.status(422).json({ success: false });
                                        } else {
                                            return res.json({ success: true, message: msg.ProjectCategoryUpdateSuccess });
                                        }
                                    });
                                }
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

// Fetch Project Categories
router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
    ProjectCategory.getProjectCategoryById(req.params.id, (error, projectCategory) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectCategory) {
            return res.status(404).json({ success: false, error: msg.ProjectCategoryNotFound });
        } else {
            return res.json({ success: true, projectCategory });
        }
    });
});

// Get All Project Category
router.get('/list', function (req, res) {
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.organization_id._id;
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    ProjectCategory.getAllProjectCategory(organization_id, page, limit, (error, projectCategories) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (!projectCategories.total) {
                return res.json({ success: false, error: msg.ProjectCategoryNotFound });
            } else {
                return res.json({ success: true, projectCategories: projectCategories });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (!projectCategories.length) {
                return res.json({ success: false, error: msg.ProjectCategoryNotFound });
            } else {
                return res.json({ success: true, projectCategories: projectCategories });
            }
        }
    });
});

// Get Project Category by Organization
router.get('/category/:organization_id', function (req, res) {
    let validator = new Validation({}, req.params, {
        organization_id: "required"
    });
    validator.check().then(function (matched) {
        if (matched) {
            Organization.findById(req.params.organization_id, (error, organization) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!organization) {
                    return res.status(404).json({ success: false, error: msg.OrganizationNotFound });
                } else {
                    ProjectCategory.getAllProjectCategory(req.params.organization_id, (err, projectCategorys) => {
                        if (err) {
                            return res.status(422).json({ success: false });
                        } else if (!projectCategorys) {
                            return res.status(422).json({ success: false });
                        } else {
                            return res.json({ success: true, projectCategorys });
                        }
                    });
                }
            });
        }
    });
});

// Delete Project Category
router.delete('/delete/:id', Auth.isAdmin, function (req, res) {
    ProjectCategory.findById(req.params.id, (error, projectCategory) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!projectCategory) {
            return res.status(404).json({ success: false, error: msg.ProjectCategoryNotFound });
        } else {
            Project.findOne({ 'project_category_id': ObjectId(req.params.id.toString()) }, (error, project) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (project) {
                    return res.status(404).json({ success: false, error: msg.ProjectCategoryAssociatedWithProject });
                } else {
                    let media_thumbnail = projectCategory.project_category_image;
                    ProjectCategory.remove({ '_id': req.params.id }, (err, result) => {
                        if (err && !result) {
                            return res.json({ success: false, error: msg.ProjectCategoryDeleteFailed });
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
        }
    });
});

module.exports = router;
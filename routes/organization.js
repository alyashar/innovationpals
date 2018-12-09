const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');
const Validation = require('node-input-validator');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Organization = require('../model/organization');

const AllProjectCategory = require('../model/all_project_category');
const ProjectCategory = require('../model/project_category');

const StudentCategory = require('../model/student_category');
const AllStudentCategory = require('../model/all_student_category');

const ProjectRiskPriority = require('../model/project_risk_priority');
const ProjectRiskPriorityData = require('../model/project_risk_priority_data');

const ProjectRiskType = require('../model/project_risk_type');
const RiskTypeData = require('../model/risk_type_data');
const ProjectRiskTypeData = require('../model/project_risk_type_data');

const ProjectRoles = require('../model/project_roles');
const ProjectRolesData = require('../model/project_roles_data');

const User = require('../model/user');
const { filterString } = require('../utility/index');

router.use(function(req, res, next) {
    next();
});

// Add Organization
router.post('/add', Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
    });
    validator.check().then(function(matched) {
        if (matched) {
            var slug = filterString(req.body.name);
            Organization.findOne({ slug, 'status': true }, (error, isExitsOrganization) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (isExitsOrganization) {
                    return res.status(422).json({ success: false, error: msg.OrganizationShouldBeUnique });
                } else {
                    let newOrganization = new Organization({
                        name: req.body.name.trim(),
                        slug,
                        unique_id: mongoose.Types.ObjectId()
                    });
                    Organization.addOrganization(newOrganization, (error, organization) => {
                        if (error) {
                            return res.status(422).json({ success: false, error });
                        } else {
                            if (organization) {
                                let organization_id = organization._id;

                                // Fetch All Project Category and Add Into Project Category With Organization
                                AllProjectCategory.getAllProjectCategory(0, 0, (error, allProjectCategories) => {
                                    if (allProjectCategories) {
                                        allProjectCategories.map(all_project_category => {
                                            let project_category_name = all_project_category.title;
                                            let category_image = all_project_category.category_image ? all_project_category.category_image : '';
                                            var slug = filterString(project_category_name);
                                            let newProjectCategory = new ProjectCategory({
                                                name: project_category_name.trim(),
                                                organization_id: ObjectId(organization_id),
                                                slug,
                                                category_image
                                            });
                                            ProjectCategory.addProjectCategory(newProjectCategory, (err, projectCategories) => {
                                                if (err || !projectCategories) {
                                                    console.log('All Project Category Not Added To The Organization');
                                                } else {
                                                    console.log('All Project Category Added To The Organization');
                                                }
                                            });
                                        });
                                    }
                                });

                                // Fetch All Student Category and Add Into Student Category With Organization
                                AllStudentCategory.getAllStudentCategory(0, 0, (error, allStudentCategories) => {
                                    if (allStudentCategories) {
                                        allStudentCategories.map(all_student_category => {
                                            let student_category_name = all_student_category.title;
                                            let category_image = all_student_category.category_image ? all_student_category.category_image : '';
                                            var slug = filterString(student_category_name);
                                            let newStudentCategory = new StudentCategory({
                                                name: student_category_name.trim(),
                                                organization_id: ObjectId(organization_id),
                                                slug,
                                                category_image
                                            });
                                            StudentCategory.addStudentCategory(newStudentCategory, (err, studentCategories) => {
                                                if (err || !studentCategories) {
                                                    console.log('All Student Category Not Added To The Organization');
                                                } else {
                                                    console.log('All Student Category Added To The Organization');
                                                }
                                            });
                                        });
                                    }
                                });

                                // Fetch All Project Risk Type and Add Into Project Risk Type Data With Organization
                                ProjectRiskType.getAllProjectRiskType((error, projectRiskTypes) => {
                                    if (projectRiskTypes) {
                                        projectRiskTypes.map(projectRiskType => {
                                            let risk_title = projectRiskType.risk_title;
                                            var slug = filterString(risk_title);
                                            let newRiskTypeData = new RiskTypeData({
                                                risk_title: risk_title.trim(),
                                                organization_id: ObjectId(organization_id),
                                                slug
                                            });
                                            RiskTypeData.addRiskTypeData(newRiskTypeData, (err, riskTypes) => {
                                                if (err || !riskTypes) {
                                                    console.log('All Risk Types Not Added To The Organization');
                                                } else {
                                                    console.log('All Risk Types Added To The Organization');
                                                }
                                            });
                                        });
                                    }
                                });

                                // Fetch All Project Roles and Add Into Project Roles Data With Organization
                                ProjectRoles.getProjectRoles(0, 0, (error, projectRoles) => {
                                    if (projectRoles) {
                                        projectRoles.map(projectRole => {
                                            let title = projectRole.title;
                                            let newProjectRolesData = new ProjectRolesData({
                                                title: title.trim(),
                                                organization_id: ObjectId(organization_id)
                                            });
                                            ProjectRolesData.addProjectRolesData(newProjectRolesData, (err, projectRolesData) => {
                                                if (err || !projectRolesData) {
                                                    console.log('All Project Roles Not Added To The Organization');
                                                } else {
                                                    console.log('All Project Roles Added To The Organization');
                                                }
                                            });
                                        });
                                    }
                                });

                                return res.json({ success: true, message: msg.OrganizationAdded });
                            } else {
                                return res.json({ success: false, error: error });
                            }
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

// Update Organization
router.put('/update/:id', Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
    });
    validator.check().then(function(matched) {
        if (matched) {
            Organization.getOrganizationById(req.params.id, (error, organization) => {
                if (error) {
                    return res.status(422).json({ success: false, error });

                } else if (!organization) {
                    return res.status(404).json({ success: false, error: msg.OrganizationNotFound });

                } else if (!organization.status) {
                    return res.status(422).json({ success: false, error: msg.OrganizationNotActive });

                } else {
                    var slug = filterString(req.body.name)
                    let id = req.params.id
                    let newOrganization = {
                        name: req.body.name.trim(),
                        slug,
                        updated_at: new Date()
                    };
                    if (slug === organization.slug) {
                        Organization.updateOne({ _id: req.params.id }, newOrganization, function(err, result) {
                            if (err) {
                                return res.status(422).json({ success: false, error: msg.OrganizationUpdateFailed });

                            } else {
                                return res.json({ success: true, message: msg.OrganizationUpdateSuccess });

                            }
                        })
                    } else {
                        Organization.findOne({ slug }, (error, isExitsOrganization) => {
                            if (error) {
                                return res.status(422).json({ success: false, error });
                            } else if (isExitsOrganization) {
                                return res.status(422).json({ success: false, error: msg.OrganizationShouldBeUnique });
                            } else {
                                Organization.updateOne({ _id: req.params.id }, newOrganization, function(err, result) {
                                    if (err) {
                                        return res.status(422).json({ success: false, error: msg.OrganizationUpdateFailed });
                                    } else {
                                        return res.json({ success: true, message: msg.OrganizationUpdateSuccess });
                                    }
                                })
                            }
                        })
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

// Select Organization By ID
router.get('/select/:id', function(req, res) {
    Organization.getOrganizationById(req.params.id, (error, organization) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!organization) {
            return res.status(404).json({ success: false, error: msg.OrganizationNotFound });
        } else if (!organization.status) {
            return res.status(422).json({ success: false, error: msg.OrganizationNotActive });
        } else {
            return res.json({ success: true, organization });
        }
    })
});

// Delete Organization
router.delete('/delete/:id', Auth.isSuperAdmin, function(req, res) {
    Organization.findById(req.params.id, (error, organization) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!organization) {
            return res.status(404).json({ success: false, error: msg.OrganizationNotFound });
        } else {
            User.findOne({ 'organization_id': ObjectId(req.params.id.toString()), 'is_deleted': false, 'status': true }, (error, users) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (users) {
                    return res.status(404).json({ success: false, error: msg.OrganizationAssociatedWithUser });
                } else {
                    organization.status = !organization.status
                    organization.save((err) => {
                        let message = organization.status ? msg.OrganizationActivated : msg.OrganizationDeActivated
                        return res.json({ success: true, message });
                    });
                }
            });
        }
    });
});

// Select All Organization
router.get('/list', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    let query = req.isUserMasterAdmin ? { status: true } : { _id: req.authData.organization_id.toString(), status: true };
    Organization.getAllOrganization(query, page, limit, (error, organizations) => {
        if (page && limit) {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (organizations.total === 0 || organizations.length === 0) {
                return res.status(422).json({ success: false, error: msg.OrganizationNotFound });
            } else {
                return res.json({ success: true, organizations });
            }
        } else {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (organizations.length == 0) {
                return res.status(422).json({ success: false, error: msg.OrganizationNotFound });
            } else {
                return res.status(200).json({ success: true, organizations });
            }
        }
    })
});

// Sleect Organization Which Are Blocked
router.get('/blocked-list', Auth.isSuperAdmin, function(req, res) {
    let query = { status: false }
    Organization.getAllOrganization(query, (error, organizations) => {
        if (error) {
            return res.status(422).json({ success: false });
        } else if (!organizations) {
            return res.status(422).json({ success: false, error: msg.OrganizationNotFound });
        } else {
            return res.json({ success: true, organizations });
        }
    })
});

module.exports = router;
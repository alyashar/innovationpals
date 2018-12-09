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
const ProjectPhotosAndVideos = require('../model/project_photos_and_videos.js');
const TeamMember = require('../model/team_members');
const ValidationUtility = require('../utility/validations');
const videoUpload = require('../utility/videoUploadOptions');

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

// Add Project
router.post('/add', Auth.isAdmin, ValidationUtility.validateProjectForm, function (req, res) {
    let {
        project_manager_id,
        project_description,
        project_name,
        project_number,
        project_category_id,
        hours_per_day
    } = req.body
    Project.findOne({ 'project_number': project_number }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (project) {
            return res.status(404).json({ success: false, error: msg.ProjectNumberShouldBeUnique });
        } else {
            let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id
            let newProject = new Project({
                project_description,
                project_name,
                project_number,
                project_category_id: ObjectId(project_category_id),
                organization_id: ObjectId(organization_id),
                hours_per_day
            });

            project_manager_id.forEach(manager_id => {
                newProject.project_manager_id.push(ObjectId(manager_id))
            });

            if (req.body.project_image && req.body.project_image.length && req.body.project_image != '') {
                Auth.getImageURL(req, req.body.project_image, 'CategoryImage').then(function (image_link) {
                    newProject['project_image'] = image_link;
                    Project.addProject(newProject, (err, project) => {
                        if (err || !project) {
                            return res.status(422).json({ success: false, error: err || project });
                        } else {
                            let project_id = project._id;
                            // Project Added to the Organization
                            Organization.updateOne({ _id: ObjectId(organization_id) }, { $push: { 'project_id': project_id } }, (err, result) => {
                                console.log('Project Added to the Organization');
                            });
                            return res.json({ success: true, message: msg.ProjectAdded });
                        }
                    });
                });
            } else {
                Project.addProject(newProject, (err, project) => {
                    if (err || !project) {
                        return res.status(422).json({ success: false, error: err || project });
                    } else {
                        return res.json({ success: true, message: msg.ProjectAdded });
                    }
                });
            }
        }
    });
});

// Update Project Basic Details
router.put('/update/:id', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        project_description: 'required',
        project_name: 'required',
        project_number: 'required',
        project_category_id: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            Project.getProjectById(req.params.id, (err, project) => {
                if (err) {
                    return res.status(422).json({ success: false, error: err });
                } else if (!project) {
                    return res.status(404).json({ success: false, error: msg.ProjectNotFound });
                } else {
                    let {
                        project_description,
                        project_name,
                        project_number,
                        project_category_id
                    } = req.body
                    let organization_id = req.isUserMasterAdmin ? req.body.organization_id : req.authData.organization_id;
                    let newProject = {
                        project_description,
                        organization_id,
                        project_name,
                        project_category_id: ObjectId(project_category_id),
                        updated_at: new Date()
                    };
                    let message = 'Project';

                    if (req.body.project_image && req.body.project_image.length && req.body.project_image != '') {
                        Auth.getImageURL(req, req.body.project_image, 'CategoryImage').then(function (image_link) {
                            newProject['project_image'] = image_link;
                            Project.updateOne({ _id: req.params.id.toString() }, newProject, function (err, result) {
                                if (err) {
                                    return res.status(422).json({ success: false, error: message + msg.UpdationFailed });
                                } else {
                                    Organization.findOne({ '_id': organization_id.toString() }, (err, organization) => {
                                        if (organization && !req.isUserMasterAdmin) {
                                            var organization_name = organization.name;
                                            return res.json({ success: true, message: message + msg.UpdatedSuccess, organization_name, image: image_link });
                                        } else {
                                            return res.json({ success: true, message: message + msg.UpdatedSuccess, image: project_image_name });
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        Project.updateOne({ _id: req.params.id.toString() }, newProject, function (err, result) {
                            if (err) {
                                return res.status(422).json({ success: false, error: message + msg.UpdationFailed });
                            } else {
                                Organization.findOne({ '_id': organization_id.toString() }, (err, organization) => {
                                    if (organization && !req.isUserMasterAdmin) {
                                        var organization_name = organization.name;
                                        return res.json({ success: true, message: message + msg.UpdatedSuccess, organization_name });
                                    } else {
                                        return res.json({ success: true, message: message + msg.UpdatedSuccess });
                                    }
                                });
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

// Add Student To The Project
router.post('/add-student-to-project', Auth.isAdmin, ValidationUtility.validateUserProjectForm, function (req, res) {
    Project.getProjectById(req.body.project_id, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!project) {
            return res.status(422).json({ success: false, error: msg.ProjectNotFound });
        } else if (!req.isUserMasterAdmin && req.authData.organization_id.toString() !== project.organization_id.toString()) {
            return res.status(422).json({ success: false, error: msg.ProjectOrganizationShoulBeSame });
        } else {
            User.getUserById(req.body.user_id, (error, user) => {
                if (error) {
                    return res.status(422).json({ success: false });

                } else if (!user) {
                    return res.status(422).json({ success: false, error: msg.UserNotFound });

                } else if (!req.isUserMasterAdmin && user.organization_id._id.toString() !== req.authData.organization_id.toString()) {
                    return res.status(422).json({ success: false, error: msg.UserOrganizationShoulBeSame });

                } else if (user.role_id._id.toString() !== STUDENT_ID) {
                    return res.status(422).json({ success: false, error: msg.UserIsNotStudent });

                } else {
                    let projectManagerIds = project.project_manager_id
                    let isUserIdExistInManager = projectManagerIds.find(projectManagerId => projectManagerId.toString() === req.body.user_id.toString())
                    if (isUserIdExistInManager) {
                        return res.status(422).json({ success: false, error: msg.UserIsAManager });
                    } else {
                        TeamMember.findOne({ user_id: req.body.user_id, project_id: req.body.project_id }, (err, isExistTeamMember) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: err });

                            } else if (isExistTeamMember) {
                                return res.status(422).json({ success: false, error: msg.TeamMemberAlreadyExist });

                            } else {
                                let {
                                    user_ids,
                                    project_id,
                                    reporting_to_user_id
                                } = req.body
                                user_ids = Array.from(new Set(user_ids))

                                addTeamMember(user_ids, project_id, reporting_to_user_id).then(function (ressult) {
                                    project.save((error, ressult) => {
                                        return res.json({ success: true, message: msg.TeamMemberAdded });
                                    })
                                });
                            }
                        })
                    }
                }
            })
        }
    })
});

// remove Student From The Project
router.post('/remove-student-from-project', Auth.isAdmin, ValidationUtility.validateUserProjectForm, function (req, res) {
    Project.getProjectById(req.body.project_id, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false });

        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });

        } else if (!req.isUserMasterAdmin && req.authData.organization_id.toString() !== project.organization_id.toString()) {
            return res.status(422).json({ success: false, error: msg.ProjectOrganizationShoulBeSame });

        } else {
            User.getUserById(req.body.user_id, (error, user) => {
                if (error) {
                    return res.status(422).json({ success: false, error });

                } else if (!user) {
                    return res.status(404).json({ success: false, error: msg.UserNotFound });

                } else if (!req.isUserMasterAdmin && user.organization_id._id.toString() !== req.authData.organization_id.toString()) {
                    return res.status(422).json({ success: false, error: msg.UserOrganizationShoulBeSame });

                } else {
                    TeamMember.findOne({ user_id: req.body.user_id, project_id: req.body.project_id }, (err, isExistTeamMember) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: err });

                        } else if (!isExistTeamMember) {
                            return res.status(422).json({ success: false, error: msg.TeamMemberNotFound });

                        } else {
                            project.team_member_id.pop(isExistTeamMember._id)
                            project.save(function (error) {
                                if (error) {
                                    return res.status(422).json({ success: false, error: msg.StudentNotRemoved });
                                } else {
                                    isExistTeamMember.status = false
                                    isExistTeamMember.save((err) => {
                                        if (error) {
                                            return res.status(422).json({ success: false, error: msg.StudentNotRemoved });
                                        } else {
                                            return res.json({ success: false, error: msg.StudentRemoved });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
});

// Select Project By ID
router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
    Project.getProjectDetailsById(ObjectId(req.params.id), (error, project) => {
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
                    return res.json({ success: true, project, photos, videos });
                }
            });
        }
    })
});

// Select Projects
router.get('/list', function (req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;

    let organization_id = false;
    if (req.isUserMasterAdmin) {
        organization_id = (req.query.organization_id != 'undefined' && req.query.organization_id != undefined && req.query.organization_id != '') ? req.query.organization_id : false;
    } else {
        organization_id = req.authData.organization_id;
    }

    Project.getAllProject(organization_id, page, limit, (err, projects) => {
        if (page && limit) {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!projects.total) {
                return res.status(422).json({ success: false, error: msg.ProjectNotFound });
            } else {
                return res.json({ success: true, projects });
            }
        } else {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!projects) {
                return res.status(422).json({ success: false, error: msg.ProjectNotFound });
            } else {
                return res.json({ success: true, projects });
            }
        }
    });
});

// Update Project objectives, Scopes and Deliveriables 
router.put('/update-detail/:id', Auth.isAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        type: 'required',
        value: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            Project.getProjectById(req.params.id, (error, project) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!project) {
                    return res.status(404).json({ success: false, error: msg.ProjectNotFound });
                } else {
                    let id = req.params.id;
                    let newProject = {};
                    let type = req.body.type.toString();
                    let message = '';
                    if (type === 'project_objective') {
                        message = 'Project Objective(s)';
                        newProject = {
                            project_objective: req.body.value
                        };
                    } else if (type === 'project_scope') {
                        message = 'Project Scope(s)';
                        newProject = {
                            project_scope: req.body.value
                        };
                    } else if (type === 'project_deliverables') {
                        message = 'Project Deliverable(s)';
                        newProject = {
                            project_deliverables: req.body.value
                        };
                    } else if (type === 'project_manager_id') {
                        let project_manager_id = req.body.value;
                        message = 'Project Manager(s)';
                        newProject = {
                            project_manager_id: req.body.value
                        };
                        /*
                        project_manager_id = Array.from(new Set(project_manager_id))
                        if (project_manager_id.length < 2) {
                            return res.status(422).json({ success: false, error: msg.Min2Manager });
                        } else {
                            
                        }
                        */
                    }
                    newProject['updated_at'] = new Date();
                    Project.updateOne({ _id: req.params.id.toString() }, newProject, function (err, result) {
                        if (err) {
                            return res.status(422).json({ success: false, error: message + msg.UpdationFailed });
                        } else {
                            return res.json({ success: true, message: message + msg.UpdatedSuccess });
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
    })
});

// Upload Project Media (Photos)
router.put('/upload-media/photos/:id', Auth.isAdmin, function (req, res, next) {
    let validator = new Validation({}, req.body, {
        title: 'required',
        media_thumbnail: 'required'
    });
    validator.check().then(function (matched) {
        if (matched) {
            Project.getProjectById(req.params.id, (error, project) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!project) {
                    return res.status(404).json({ success: false, error: msg.ProjectNotFound });
                } else {
                    let message = 'Project Photo';
                    let title = req.body.title;
                    var media_thumbnail = req.body.media_thumbnail;
                    Auth.getImageURL(req, media_thumbnail, 'CategoryImage').then(function (image_link) {
                        let thumbnail_url = image_link;
                        let newProjectPhoto = new ProjectPhotosAndVideos({
                            project_id: req.params.id.toString(),
                            media_url: image_link,
                            thumbnail_url,
                            title,
                            type: 'photos'
                        });
                        ProjectPhotosAndVideos.addMedia(newProjectPhoto, (err, result) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: message + msg.UpdationFailed });
                            } else {
                                return res.json({ success: true, message: message + msg.UpdatedSuccess, title, media_url: image_link, thumbnail_url });
                            }
                        });
                    });
                }
            })
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

// Upload Project Media (Videos)
router.put('/upload-media/videos/:id', Auth.isAdmin, function (req, res, next) {
    let validator = new Validation({}, req.body, {
        title: 'required',
        media_url: 'required|url'
    });
    validator.check().then(function (matched) {
        if (matched) {
            Project.getProjectById(req.params.id, (error, project) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!project) {
                    return res.status(404).json({ success: false, error: msg.ProjectNotFound });
                } else {
                    let media_url = req.body.media_url;
                    let title = req.body.title;
                    var videoid = media_url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
                    if (videoid != null) {
                        let thumbnail_url = 'https://img.youtube.com/vi/' + videoid[1] + '/mqdefault.jpg';
                        let newProjectVideo = new ProjectPhotosAndVideos({
                            project_id: req.params.id.toString(),
                            type: 'videos',
                            media_url,
                            thumbnail_url,
                            title
                        });
                        ProjectPhotosAndVideos.addMedia(newProjectVideo, (err, result) => {
                            if (err) {
                                return res.status(422).json({ success: false, error: message + msg.UpdationFailed });
                            } else {
                                return res.json({ success: true, message: "Project video" + msg.UpdatedSuccess, title, media_url, thumbnail_url });
                            }
                        });
                    } else {
                        console.log("The youtube url is not valid.");
                        return res.status(404).json({ success: false, error: msg.YouTubeURLInvalid });
                    }
                }
            })
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

// Delete Project Media (Photos and Videos)
router.put('/delete-media/:id', Auth.isAdmin, function (req, res, next) {
    let validator = new Validation({}, req.body, {
        type: 'required',
        media_url: 'required',
    });
    validator.check().then(function (matched) {
        if (matched) {
            Project.getProjectById(req.params.id, (error, project) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!project) {
                    return res.status(404).json({ success: false, error: msg.ProjectNotFound });
                } else {
                    ProjectPhotosAndVideos.remove({ project_id: req.params.id.toString(), media_url: req.body.media_url, type: req.body.type }).exec((err, result) => {
                        if (err) {
                            return res.status(422).json({ success: false, error: message + msg.DeleteFailed });
                        } else {
                            let message = 'Project ' + req.body.type;
                            return res.json({ success: true, message: message + msg.DeleteSuccess });
                        }
                    });
                }
            })
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

// Fetch Project Details Like Activities, Tasks, etc.
router.get('/dashboard/:id', objectIdErrorHandlerMiddleware, function (req, res) {
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
        }
    });
});

// Fetch Student and Project Managers
router.get('/students/:project_id', objectIdErrorHandlerMiddleware, function (req, res) {
    Project.findOne({ '_id': req.params.project_id.toString() }).select('project_manager_id').
        populate({ path: 'project_manager_id', select: 'name _id' }).exec((error, project) => {
            if (error) {
                return res.status(422).json({ success: false, error });
            } else if (!project) {
                return res.status(404).json({ success: false, error: msg.ProjectNotFound });
            } else {
                if (project.project_manager_id && project.project_manager_id.length) {
                    let project_id = project._id;
                    let managers = project.project_manager_id;
                    let new_project_managers = [];
                    managers.forEach((userId, index) => {
                        new_project_managers[index] = userId._id;
                    });
                    // Fetch Project's Team Members
                    TeamMember.find({ 'project_id': project_id }, { 'user_id': 1, '_id': 0 }, (error, team_members) => {
                        if (error) {
                            return res.status(422).json({ success: false, error });
                        } else if (!team_members) {
                            console.log('Team members not found');
                        } else {
                            let role_id = STUDENT_ID;
                            let findUserQuery = { role_id, is_deleted: false, status: true, organization_id: ObjectId(req.authUser.organization_id._id) };
                            if (team_members && team_members.length) {
                                let new_team_members = [];
                                team_members.forEach((userId, index) => {
                                    new_team_members[index] = userId.user_id;
                                });
                                //let exclude_user_ids = new_project_managers.concat(new_team_members);
                                //findUserQuery['_id'] = { $nin: exclude_user_ids };
                            } else {
                                findUserQuery['_id'] = { $nin: new_project_managers };
                            }
                            User.find(findUserQuery, { '_id': 1, 'name': 1 }, (error, students) => {
                                if (error) {
                                    return res.status(422).json({ success: false, error });
                                } else if (!students) {
                                    return res.status(404).json({ success: false, error: msg.StudentNotFound });
                                } else {
                                    let users = { students, managers, team_members };
                                    return res.json({ success: true, users });
                                }
                            });
                        }
                    });
                } else {
                    return res.status(404).json({ success: false, error: msg.ProjectMustHaveManager });
                }
            }
        });
});

// Add Team Member Method
function addTeamMember({ studentList, project_id, reporting_to_user_id }) {
    let userList = []
    return new Promise(resolve => {
        studentList.forEach(user_id => {
            let newTeamMember = new TeamMember({
                user_id: ObjectId(user_id),
                project_id: ObjectId(project_id),
                reporting_to_user_id: ObjectId(reporting_to_user_id)
            })

            newTeamMember.save((error, result) => {
                project.team_member_id.push(newTeamMember._id)
            })
        })
        resolve(true)
    })
}

// Image Extensions Validations
function extensionValidation(extension) {
    if (extension == ".jpg" || extension == ".jpeg" || extension == ".png")
        return true;
}

module.exports = router;
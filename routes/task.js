const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');
const ValidationUtility = require('../utility/validations')

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Task = require('../model/tasks');
const Project = require('../model/project');
const Activity = require('../model/activity');
const User = require('../model/user');
const TeamMember = require('../model/team_members');

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

// Add Task
router.post('/add', Auth.isAdmin, ValidationUtility.validateTaskAddForm, function(req, res) {
    let {
        description,
        planned_from,
        planned_to,
        planned_duration,
        planned_hours,
        actual_from,
        actual_to,
        actual_duration,
        actual_hours,
        project_id,
        activity_id,
        student_id
    } = req.body
    let findProjectQuery = {}
    if (req.isUserMasterAdmin) {
        findProjectQuery = { _id: ObjectId(project_id) }
    } else {
        findProjectQuery = { _id: ObjectId(project_id), organization_id: ObjectId(req.authData.organization_id) }
    }
    Project.findOne(findProjectQuery, (error, project) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!project) {
            return res.status(422).json({ success: false, error: msg.ProjectNotFound });
        } else {
            Activity.findById(ObjectId(activity_id), (error, activity) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!activity) {
                    return res.status(422).json({ success: false, error: msg.ActivityNotFound });
                } else {
                    let organization_id = req.authData.organization_id;
                    let newTask = new Task({
                        description,
                        planned_from,
                        planned_to,
                        planned_duration,
                        planned_hours,
                        actual_from,
                        actual_to,
                        actual_duration,
                        actual_hours,
                        project_id: ObjectId(project_id),
                        activity_id: ObjectId(activity_id),
                        student_id: ObjectId(student_id),
                        organization_id
                    });
                    Task.addTask(newTask, (err, task) => {
                        if (err || !task) {
                            return res.json({ success: false, error: msg.TaskAddFailed });
                        } else {
                            let task_id = task._id;
                            User.find({ "_id": ObjectId(student_id) }, (err, result) => {
                                if (err || !result) {
                                    return res.json({ success: false, error: msg.StudentNotFound });
                                } else {
                                    var data = result[0];

                                    // Task added to the Project
                                    Project.updateOne({ _id: ObjectId(project_id) }, { $push: { 'task_id': task_id } }, (err, result) => {
                                        console.log('Task Assigned To Project');
                                    });

                                    // Task added to the Activity
                                    let updateActivity = {};
                                    if (activity) {
                                        updateActivity = {
                                            $push: { 'task_id': task_id }
                                        };
                                        let activity_planned_from = activity.planned_from ? activity.planned_from : '';
                                        let activity_planned_to = activity.planned_to ? activity.planned_to : '';
                                        let activity_actual_from = activity.actual_from ? activity.actual_from : '';
                                        let activity_actual_to = activity.actual_to ? activity.actual_to : '';

                                        let new_planned_from = planned_from ? planned_from : '';
                                        let new_planned_to = planned_to ? planned_to : '';
                                        let new_actual_from = actual_from ? actual_from : '';
                                        let new_actual_to = actual_to ? actual_to : '';

                                        // Check Planned From Date
                                        if (activity_planned_from && new_planned_from) {
                                            if (new Date(activity_planned_from) > new Date(new_planned_from)) {
                                                updateActivity['planned_from'] = new_planned_from;
                                                activity_planned_from = new_planned_from;
                                            } else {
                                                updateActivity['planned_from'] = activity_planned_from;
                                            }
                                        } else {
                                            updateActivity['planned_from'] = new_planned_from;
                                            activity_planned_from = new_planned_from;
                                        }
                                        // Check Planned TO Date
                                        if (activity_planned_to && new_planned_to) {
                                            if (new Date(activity_planned_to) < new Date(new_planned_to)) {
                                                updateActivity['planned_to'] = new_planned_to;
                                                activity_planned_to = new_planned_to;
                                            } else {
                                                updateActivity['planned_to'] = activity_planned_to;
                                            }
                                        } else {
                                            updateActivity['planned_to'] = new_planned_to;
                                            activity_planned_to = new_planned_to;
                                        }
                                        // Check Actual From Date
                                        if (activity_actual_from && new_actual_from) {
                                            if (new Date(activity_actual_from) > new Date(new_actual_from)) {
                                                updateActivity['actual_from'] = new_actual_from;
                                                activity_actual_from = new_actual_from;
                                            } else {
                                                updateActivity['actual_from'] = activity_actual_from;
                                            }
                                        } else {
                                            updateActivity['actual_from'] = new_actual_from;
                                            activity_actual_from = new_actual_from;
                                        }
                                        // Check Actual To Date
                                        if (activity_actual_to && new_actual_to) {
                                            if (new Date(activity_actual_to) < new Date(new_actual_to)) {
                                                updateActivity['actual_to'] = new_actual_to;
                                                activity_actual_to = new_actual_to;
                                            } else {
                                                updateActivity['actual_to'] = activity_actual_to;
                                            }
                                        } else {
                                            updateActivity['actual_to'] = new_actual_to;
                                            activity_actual_to = new_actual_to;
                                        }

                                        let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                        var activity_planned_duration = Math.round(new Date(activity_planned_to).getTime() - new Date(activity_planned_from).getTime()) / (oneDay);
                                        var activity_actual_duration = Math.round(new Date(activity_actual_to).getTime() - new Date(activity_actual_from).getTime()) / (oneDay);
                                        updateActivity['planned_duration'] = activity_planned_duration + 1;
                                        updateActivity['actual_duration'] = activity_actual_duration + 1;

                                        console.log('Update Activity', updateActivity);

                                        Activity.updateOne({ _id: ObjectId(activity_id) }, updateActivity, (err, result) => {
                                            console.log('Task Assigned To Activity');
                                        });
                                    }

                                    // Task added to the User
                                    let find_project_id = 1 + Number(data.project_id.indexOf(project_id));
                                    if (find_project_id) {
                                        let find_task_id = 1 + Number(data.task_id.indexOf(task_id));
                                        if (find_task_id) {
                                            User.updateOne({ _id: ObjectId(student_id) }, { $push: { 'task_id': task_id } }, (err, result) => {
                                                console.log('Task Assigned To User');
                                            });
                                        } else {
                                            console.log('Task Not Assigned To User');
                                        }
                                    } else {
                                        User.updateOne({ _id: ObjectId(student_id) }, { $push: { 'task_id': task_id, 'project_id': project_id } }, (err, result) => {
                                            console.log('Project and Task Assigned To User');
                                        });
                                    }
                                    return res.json({ success: true, message: msg.TaskAddSuccess });
                                }
                            });
                        }
                    })
                }
            })
        }
    })
});

// Update Task
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, ValidationUtility.validateTaskAddForm, function(req, res) {
    Task.getTaskById(req.params.id, (err, task) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!task) {
            return res.status(422).json({ success: false, error: msg.TaskNotFound });
        } else {
            let {
                description,
                planned_from,
                planned_to,
                planned_duration,
                planned_hours,
                actual_from,
                actual_to,
                actual_duration,
                actual_hours,
                project_id,
                activity_id,
                student_id
            } = req.body
            let newTask = {
                description,
                planned_from,
                planned_to,
                planned_duration,
                planned_hours,
                actual_from,
                actual_to,
                actual_duration,
                actual_hours,
                student_id
            }
            let assigned_student_id = task.student_id;
            let id = req.params.id;
            Task.updateOne({ _id: ObjectId(id) }, newTask, function(err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.TaskUpdateFailed });
                } else {
                    User.find({ "_id": ObjectId(req.body.student_id) }, (err, result) => {
                        if (err || !result) {
                            return res.json({ success: false, error: msg.StudentNotFound });
                        } else {
                            // Task added to the Activity
                            Activity.findById(ObjectId(activity_id), (error, activity) => {
                                if (error) {
                                    return res.status(422).json({ success: false, error });
                                } else if (!activity) {
                                    return res.status(422).json({ success: false, error: msg.ActivityNotFound });
                                } else {
                                    let updateActivity = {};
                                    if (activity) {
                                        let activity_planned_from = activity.planned_from ? activity.planned_from : '';
                                        let activity_planned_to = activity.planned_to ? activity.planned_to : '';
                                        let activity_actual_from = activity.actual_from ? activity.actual_from : '';
                                        let activity_actual_to = activity.actual_to ? activity.actual_to : '';

                                        let new_planned_from = planned_from ? planned_from : '';
                                        let new_planned_to = planned_to ? planned_to : '';
                                        let new_actual_from = actual_from ? actual_from : '';
                                        let new_actual_to = actual_to ? actual_to : '';

                                        // Check Planned From Date
                                        if (activity_planned_from && new_planned_from) {
                                            if (new Date(activity_planned_from) > new Date(new_planned_from)) {
                                                updateActivity['planned_from'] = new_planned_from;
                                                activity_planned_from = new_planned_from;
                                            } else {
                                                updateActivity['planned_from'] = activity_planned_from;
                                            }
                                        } else {
                                            updateActivity['planned_from'] = new_planned_from;
                                            activity_planned_from = new_planned_from;
                                        }
                                        // Check Planned TO Date
                                        if (activity_planned_to && new_planned_to) {
                                            if (new Date(activity_planned_to) < new Date(new_planned_to)) {
                                                updateActivity['planned_to'] = new_planned_to;
                                                activity_planned_to = new_planned_to;
                                            } else {
                                                updateActivity['planned_to'] = activity_planned_to;
                                            }
                                        } else {
                                            updateActivity['planned_to'] = new_planned_to;
                                            activity_planned_to = new_planned_to;
                                        }
                                        // Check Actual From Date
                                        if (activity_actual_from && new_actual_from) {
                                            if (new Date(activity_actual_from) > new Date(new_actual_from)) {
                                                updateActivity['actual_from'] = new_actual_from;
                                                activity_actual_from = new_actual_from;
                                            } else {
                                                updateActivity['actual_from'] = activity_actual_from;
                                            }
                                        } else {
                                            updateActivity['actual_from'] = new_actual_from;
                                            activity_actual_from = new_actual_from;
                                        }
                                        // Check Actual To Date
                                        if (activity_actual_to && new_actual_to) {
                                            if (new Date(activity_actual_to) < new Date(new_actual_to)) {
                                                updateActivity['actual_to'] = new_actual_to;
                                                activity_actual_to = new_actual_to;
                                            } else {
                                                updateActivity['actual_to'] = activity_actual_to;
                                            }
                                        } else {
                                            updateActivity['actual_to'] = new_actual_to;
                                            activity_actual_to = new_actual_to;
                                        }

                                        let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                        var activity_planned_duration = Math.round(new Date(activity_planned_to).getTime() - new Date(activity_planned_from).getTime()) / (oneDay);
                                        var activity_actual_duration = Math.round(new Date(activity_actual_to).getTime() - new Date(activity_actual_from).getTime()) / (oneDay);
                                        updateActivity['planned_duration'] = activity_planned_duration + 1;
                                        updateActivity['actual_duration'] = activity_actual_duration + 1;

                                        console.log('Update Activity', updateActivity);

                                        Activity.updateOne({ _id: ObjectId(activity_id) }, updateActivity, (err, result) => {
                                            console.log('Task and Activity Dates Assigned To Activity');
                                        });

                                        if (assigned_student_id != student_id) {
                                            // Get All task By Project ID
                                            Task.getAllTaskByProjectAndStudentId(project_id, assigned_student_id, (err, project_tasks) => {
                                                if (err) {
                                                    console.log('Error While Fetching Task by Project and Student ID');
                                                } else if (project_tasks.length) {
                                                    console.log('Tasks Found');
                                                } else {
                                                    // Project Removed From User
                                                    User.update({ _id: ObjectId(assigned_student_id) }, { $pull: { 'project_id': { $gte: ObjectId(project_id), $lte: ObjectId(project_id) } } }, (err, result) => {
                                                        console.log('Project Removed From User');
                                                    });
                                                }
                                            });
                                            // Task Removed From User
                                            User.update({ _id: ObjectId(assigned_student_id) }, { $pull: { 'task_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                                console.log('Task Removed From User');
                                            });
                                        }
                                        var data = result[0];
                                        let find_project_id = 1 + Number(data.project_id.indexOf(project_id));
                                        if (find_project_id) {
                                            let find_task_id = data.task_id.indexOf(id);
                                            if (find_task_id) {
                                                User.updateOne({ _id: ObjectId(student_id) }, { $push: { 'task_id': id } }, (err, result) => {
                                                    console.log('Task Assigned');
                                                });
                                            } else {
                                                console.log('Task Not Assigned');
                                            }
                                        } else {
                                            User.updateOne({ _id: ObjectId(student_id) }, { $push: { 'task_id': id, 'project_id': project_id } }, (err, result) => {
                                                console.log('Project and Task Assigned');
                                            });
                                        }
                                        return res.json({ success: true, message: msg.TaskUpdateSuccess });
                                    }
                                }
                            });
                        }
                    });
                }
            })
        }
    })
});

// Fetch Task By ID
router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
    if (req.params.id) {
        Task.getTaskById(req.params.id, (err, task) => {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!task) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, task });
            }
        })
    } else {
        return res.status(422).json({ success: false });
    }
});

// Fetch All Tasks
router.get('/list', function(req, res) {
    Task.getAllTask((err, task) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!task) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, task });
        }
    })
});

// Fetch Task By ID
router.get('/list/:activity_id', function(req, res) {
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Task.getAllTaskByActivityId(req.params.activity_id, page, limit, (err, task) => {
        if (page && limit) {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!task.total) {
                return res.status(422).json({ success: false, error: msg.TaskNotFound });
            } else {
                return res.json({ success: true, message: msg.TaskList, task });
            }
        } else {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!task) {
                return res.status(422).json({ success: false, error: msg.TaskNotFound });
            } else {
                return res.json({ success: true, message: msg.TaskList, task });
            }
        }
    })
});

// Remove Student From The Task
router.put('/remove-student/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    Task.getTaskById(req.params.id, (err, task) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!task) {
            return res.status(422).json({ success: false, error: msg.TaskNotFound });
        } else {
            let assigned_student_id = task.student_id;
            let id = req.params.id;
            let student_id = null;
            let updateTask = {
                student_id
            };
            Task.updateOne({ _id: ObjectId(id) }, updateTask, (err, result) => {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.StudentRemovedFromTaskFailed });
                } else {
                    User.find({ "_id": ObjectId(assigned_student_id) }, (err, result) => {
                        if (err || !result) {
                            //return res.json({ success: false, error: msg.StudentNotFound });
                            console.log("Student Not Found");
                        } else {
                            // Task Removed From User
                            User.update({ _id: ObjectId(assigned_student_id) }, { $pull: { 'task_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                console.log('Task Removed From User');
                            });
                            return res.json({ success: true, message: msg.StudentRemovedFromTask });
                        }
                    });
                }
            })
        }
    })
});

// Remove Task
router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function(req, res) {
    Task.getTaskById(req.params.id, (err, task) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!task) {
            return res.status(422).json({ success: false, error: msg.TaskNotFound });
        } else {
            let project_id = task.project_id;
            let student_id = task.student_id;
            let activity_id = task.activity_id;
            let id = req.params.id;
            // Check Student Association With the Task
            if (student_id && student_id.length) {
                return res.json({ success: false, error: msg.TaskAssociatedWithStudent });
            } else {
                Task.remove({ _id: ObjectId(id) }, (err, result) => {
                    if (err || !result) {
                        return res.status(422).json({ success: false, error: msg.TaskDeleteFailed });
                    } else {
                        // Task Removed From Project
                        Project.find({ "_id": ObjectId(project_id) }, (err, result) => {
                            if (err || !result) {
                                //return res.json({ success: false, error: msg.ProjectNotFound });
                                console.log("Project Not Found");
                            } else {
                                Project.update({ _id: ObjectId(project_id) }, { $pull: { 'task_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                    console.log("Task Removed From Project");
                                });
                            }
                        });

                        // Task Removed From Activity
                        Activity.find({ "_id": ObjectId(activity_id) }, (err, result) => {
                            if (err || !result) {
                                //return res.json({ success: false, error: msg.ActivityNotFound });
                                console.log("Activity Not Found");
                            } else {
                                Activity.update({ _id: ObjectId(activity_id) }, { $pull: { 'task_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                    console.log("Task Removed From Activity");
                                });
                            }
                        });

                        // Task Removed From Student
                        User.find({ "_id": ObjectId(student_id) }, (err, result) => {
                            if (err || !result) {
                                //return res.json({ success: false, error: msg.StudentNotFound });
                                console.log("Student Not Found");
                            } else {
                                User.update({ _id: ObjectId(student_id) }, { $pull: { 'task_id': { $gte: ObjectId(id), $lte: ObjectId(id) } } }, (err, result) => {
                                    console.log("Task Removed From Student");
                                });
                            }
                        });

                        return res.json({ success: true, message: msg.TaskDeleteSuccess });
                    }
                });
            }
        }
    })
});

// List All Team Member including Project Managers 
router.get('/list-students/:project_id', function(req, res, next) {
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
                // Fetch Project's Team Members
                TeamMember.find({ 'project_id': project_id }, { 'user_id': 1, '_id': 0 }, { populate: { path: 'user_id', select: 'name' } }, (error, team_members) => {
                    if (error) {
                        return res.status(422).json({ success: false, error });
                    } else if (!team_members) {
                        console.log('Team members not found');
                    } else {
                        let users = { managers, team_members };
                        return res.json({ success: true, users });
                    }
                });
            } else {
                return res.status(404).json({ success: false, error: msg.ProjectMustHaveManager });
            }
        }
    });
});

// Fetch Data For Resource Utilization
router.get('/resources/:project_id', function(req, res, next) {
    Project.findOne({ '_id': req.params.project_id.toString() }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, err });
        } else if (!project) {
            return res.status(404).json({ success: false, error: msg.ProjectNotFound });
        } else {
            Task.getAllProjectStudents(ObjectId(req.params.project_id.toString()), (error, tasks) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!tasks) {
                    return res.status(404).json({ success: false, error: msg.TaskNotFound });
                } else {
                    return res.status(404).json({ success: true, tasks });
                }
            });
        }
    });
});

module.exports = router;
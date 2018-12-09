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
const Calendar = require('../model/calendar');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateCalendarAddForm, function (req, res) {
    let organization_id = req.isUserMasterAdmin ? null : req.authData.organization_id
    let newCalendar = new Calendar({
        title: req.body.title,
        message: req.body.message,
        event_date: req.body.event_date,
        created_by_user_id: ObjectId(req.authData._id),
        organization_id: ObjectId(organization_id)
    });
    newCalendar.save((err, result) => {
        if (err || !result) {
            return res.status(422).json({ success: false, error: msg.EventNotAdded });
        } else {
            return res.json({ success: true, message: msg.EventAdded, event: result });
        }
    })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateCalendarAddForm, function (req, res) {
    let newCalendar = {
        title: req.body.title,
        message: req.body.message,
        event_date: req.body.event_date,
        updated_at: new Date()
    };
    Calendar.findById(ObjectId(req.params.id), (err, calendar) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!calendar) {
            return res.status(404).json({ success: false, error: msg.EventNotFound });
        } else {
            let id = req.params.id;
            Calendar.updateOne({ _id: ObjectId(id) }, newCalendar, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.EventNotUpdated });
                } else {
                    return res.json({ success: true, message: msg.EventUpdated });
                }
            })
        }
    })
});

router.put('/update-status/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res) {
    Calendar.findOne(ObjectId(req.params.id), (err, calendar) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.EventNotFound });
        } else if (!calendar) {
            return res.status(422).json({ success: false, error: msg.EventNotFound });
        } else {
            Calendar.updateOne({ _id: ObjectId(req.params.id) }, { status: !calendar.status }, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.EventNotUpdated });
                } else {
                    return res.json({ success: true, message: msg.EventStatusUpdated });
                }
            });
        }
    });
});

router.delete('/remove/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res) {
    Calendar.findOne(ObjectId(req.params.id), (err, calendar) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.EventNotFound });
        } else if (!calendar) {
            return res.status(422).json({ success: false, error: msg.EventNotFound });
        } else {
            Calendar.remove({ _id: ObjectId(req.params.id) }, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.EventNotRemoved });
                } else {
                    return res.json({ success: true, message: msg.EventRemoved });
                }
            });
        }
    });
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
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

router.get('/list', function (req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    //let organization_id = req.isUserMasterAdmin ? false : ObjectId(req.authData.organization_id);
    //let organization_id = (req.authData.role_id._id == ADMIN_ID) ? ObjectId(req.authData.organization_id) : false;
    let organization_id = false;
    let isStudent = (req.authData) ? req.authData.role_id._id == STUDENT_ID ? true : false : false;
    let isVisitor = (req.authData) ? req.authData.role_id._id == VISITOR_ID ? true : false : false;
    let isSuperAdmin = (req.authData) ? req.authData.role_id._id == SUPER_ADMIN_ID ? true : false : false;
    let isAdmin = (req.authData) ? req.authData.role_id._id == ADMIN_ID ? true : false : false;
    let role_array = {
        isStudent, isVisitor, isSuperAdmin, isAdmin
    }
    Calendar.getAllEvents(page, limit, organization_id, role_array, (err, calendars) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!calendars) {
            return res.json({ success: false, error: msg.EventNotFound });
        } else {
            return res.json({ success: true, calendars });
        }
    })
});

module.exports = router;
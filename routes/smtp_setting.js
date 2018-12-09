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
const SMTPSetting = require('../model/smtp_setting');
const Log = require('../manage-log');
const Validation = require('node-input-validator');

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

// Add SMTP Setting
router.post('/add', objectIdErrorHandlerMiddleware, Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        smtp_server: 'required',
        smtp_email: "required",
        smtp_password: "required",
        smtp_security_method: "required",
        smtp_port: "required"
    });
    validator.check().then(function(matched) {
        if (matched) {
            let smtp_tls_port, smtp_ssl_port = 0;
            if (req.body.smtp_security_method && req.body.smtp_security_method == 'TLS') {
                smtp_tls_port = req.body.smtp_port;
            } else if (req.body.smtp_security_method && req.body.smtp_security_method == 'SSL') {
                smtp_ssl_port = req.body.smtp_port;
            }
            let newSMTPSetting = new SMTPSetting({
                smtp_server: req.body.smtp_server,
                smtp_email: req.body.smtp_email,
                smtp_password: req.body.smtp_password,
                smtp_security_method: req.body.smtp_security_method,
                smtp_tls_port,
                smtp_ssl_port
            });
            SMTPSetting.addSMTPSetting(newSMTPSetting, (err, sMTPSetting) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (!sMTPSetting) {
                    return res.status(422).json({ success: false, error: msg.SMTPSettingAddFailed });
                } else {
                    return res.json({ success: true, message: msg.SMTPSettingAddSuccess });
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

// Update SMTP Setting
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdmin, function(req, res) {
    let validator = new Validation({}, req.body, {
        smtp_server: 'required',
        smtp_email: "required",
        smtp_password: "required",
        smtp_security_method: "required",
        smtp_port: "required"
    });
    validator.check().then(function(matched) {
        if (matched) {
            SMTPSetting.getSMTPSettingById(req.params.id, (err, sMTPSetting) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else if (!sMTPSetting) {
                    return res.status(422).json({ success: false, error: msg.SMTPSettingNotFound });
                } else {
                    let smtp_tls_port, smtp_ssl_port = 0;
                    if (req.body.smtp_security_method && req.body.smtp_security_method == 'TLS') {
                        smtp_tls_port = req.body.smtp_port;
                    } else if (req.body.smtp_security_method && req.body.smtp_security_method == 'SSL') {
                        smtp_ssl_port = req.body.smtp_port;
                    }
                    let updateSMTPSetting = {
                        smtp_server: req.body.smtp_server,
                        smtp_email: req.body.smtp_email,
                        smtp_password: req.body.smtp_password,
                        smtp_security_method: req.body.smtp_security_method,
                        smtp_tls_port,
                        smtp_ssl_port,
                        updated_at: new Date()
                    };
                    SMTPSetting.updateOne({}, updateSMTPSetting, function(err, result) {
                        if (err || !result) {
                            return res.status(422).json({ success: false, error: msg.SMTPSettingUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.SMTPSettingUpdateSuccess });
                        }
                    })
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

// Fetch SMTP Setting
router.get('/list', function(req, res) {
    SMTPSetting.findOne({}, (err, sMTPSetting) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!sMTPSetting) {
            return res.status(422).json({ success: false, error: msg.SMTPSettingNotFound });
        } else {
            return res.json({ success: true, sMTPSetting });
        }
    });
});

module.exports = router;
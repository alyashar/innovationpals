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
const PaypalSetting = require('../model/paypal_setting');
const Utility = require('../utility/index');
const Log = require('../manage-log');
const fieldEncryption = require('mongoose-field-encryption');
const Validation = require('node-input-validator');
const ValidationUtility = require('../utility/validations')

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

// Add Paypal Setting
router.post('/add', objectIdErrorHandlerMiddleware, Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        paypal_mode: 'required',
        paypal_key: "required"
    });
    validator.check().then(function (matched) {
        if (matched) {
            let newPaypalSetting = new PaypalSetting({
                paypal_mode: req.body.paypal_mode,
                paypal_key: req.body.paypal_key
            });
            PaypalSetting.addPaypalSetting(newPaypalSetting, (err, paypalSetting) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (!paypalSetting) {
                    return res.status(422).json({ success: false, error: msg.PaypalSettingAddFailed });
                } else {
                    return res.json({ success: true, message: msg.PaypalSettingAddSuccess });
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

// Update Paypal Setting
router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdmin, function (req, res) {
    let validator = new Validation({}, req.body, {
        paypal_mode: 'required',
        paypal_key: "required"
    });
    validator.check().then(function (matched) {
        if (matched) {
            PaypalSetting.getPaypalSettingById(req.params.id, (err, paypalSetting) => {
                if (err) {
                    return res.status(422).json({ success: false });
                } else if (!paypalSetting) {
                    return res.status(422).json({ success: false, error: msg.PaypalSettingNotFound });
                } else {
                    let updatePaypalSetting = {
                        paypal_mode: req.body.paypal_mode,
                        paypal_key: req.body.paypal_key,
                        updated_at: new Date()
                    };
                    PaypalSetting.updateOne({}, updatePaypalSetting, function (err, result) {
                        if (err || !result) {
                            return res.status(422).json({ success: false, error: msg.PaypalSettingUpdateFailed });
                        } else {
                            return res.json({ success: true, message: msg.PaypalSettingUpdateSuccess });
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

// Fetch Paypal Setting
router.get('/list', function (req, res) {
    PaypalSetting.findOne({}, (err, paypalSetting) => {
        if (err) {
            return res.status(422).json({ success: false, error: err });
        } else if (!paypalSetting) {
            return res.status(422).json({ success: false, error: msg.PaypalSettingNotFound });
        } else {
            return res.json({ success: true, paypalSetting });
        }
    });
});

module.exports = router;

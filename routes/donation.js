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
const Donation = require('../model/donation_details');
const Utility = require('../utility/index');
const Log = require('../manage-log');
const Project = require('../model/project');
const Task = require('../model/tasks');

const fieldEncryption = require('mongoose-field-encryption');
const Validation = require('node-input-validator');
const ValidationUtility = require('../utility/validations')

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

let resurved = {}; // first argument for constructor will always be blank object
// This empty object (i.e. r in this case) will be used in future
let blocked = '';
let setting = {};

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

// Add Donation
router.post('/add-donation', ValidationUtility.validateTransactionForm, function(req, res) {
    let newDonation = new Donation({
        project_id: ObjectId(req.body.project_id),
        user_id: ObjectId(req.authData._id),
        status: req.body.status,
        transaction_id: req.body.transaction_id,
        // organization_id : ObjectId(req.body.organization_id),
        donation_amount: req.body.donation_amount,
        transaction_detail: req.body.transaction_detail
    });
    Project.findOne({ "_id": ObjectId(req.body.project_id) }, (error, project) => {
        if (error) {
            return res.status(422).json({ success: false, error });
        } else if (!project) {
            return res.status(422).json({ success: false, error: msg.ProjectNotFound });
        } else {
            let organization_id = project.organization_id;
            if (organization_id) {
                newDonation['organization_id'] = organization_id;
            }
            // Save transaction 
            Donation.addDonation(newDonation, (err, donation) => {
                if (err) {
                    Log.ManageLog(err);
                    return res.status(422).json({ success: false, error: err });
                } else if (donation) {
                    var total_donation = Number(project.project_total_donation_amount) + Number(req.body.donation_amount);
                    Project.updateOne({ "_id": ObjectId(req.body.project_id) }, { project_total_donation_amount: total_donation }, (errs, result) => {
                        console.log("Donation added to the Project");
                    });
                    return res.json({ success: true, message: msg.AddDonation });
                } else {
                    return res.status(422).json({ success: false, error: msg.registrationFail });
                }
            });
        }
    });
});

// Fetch All Donations
router.get('/list', function(req, res, next) {
    let organization_id = req.isUserMasterAdmin ? false : req.authData.organization_id
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    Donation.getDonations(organization_id, page, limit, function(err, donation) {
        if (err) {
            Log.ManageLog(err);
            return res.status(422).json({ success: false, error: err });
        } else if (!donation) {
            return res.status(404).json({ success: false, donation });
        } else {
            return res.json({ success: true, donation });
        }
    });
});

module.exports = router;
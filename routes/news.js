const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');
const ValidationUtility = require('../utility/validations');
const Utility = require('../utility/index');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const News = require('../model/news');
const Organization = require('../model/organization');
const NotificationSubscription = require('../model/notification_subscriptions');

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

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateNewsAddForm, function (req, res) {
    let organization_id = req.isUserMasterAdmin ? (req.body.organization_id) ? req.body.organization_id : null : ObjectId(req.authData.organization_id);
    let newNews = new News({
        title: req.body.title,
        message: req.body.message,
        img_url: req.body.img_url,
        created_by_user_id: ObjectId(req.authData._id),
        organization_id
    });
    newNews.save((err, result) => {
        if (err || !result) {
            return res.status(422).json({ success: false, error: msg.NewsNotAdded });
        } else {
            NotificationSubscription.find({}, { 'email': 1 }, (error, notificationSubscription) => {
                if (error && !notificationSubscription) {
                    console.log('error', error);
                } else {
                    var maillist = [];
                    notificationSubscription.forEach(function (email, index) {
                        maillist.push(email.email);
                    });
                    let htmlMsg = '<h3>' + req.body.title + '</h3><br/>';
                    htmlMsg += '<p>' + req.body.message + '</p><br/>';
                    htmlMsg += '<img src="' + req.body.img_url + '" width="150" /><br/>';

                    console.log("htmlMsg", htmlMsg);

                    var templateContent = fs.readFileSync('email_templates/email-subscription.html', encoding = "utf8");
                    templateContent = templateContent.replace('####EmailBody####', htmlMsg);
                    Utility.sendEmail(templateContent, maillist, req.body.title);
                    console.log('Mail Sent');

                }
            });
            return res.json({ success: true, message: msg.NewsAdded, news: result });
        }
    });
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateNewsAddForm, function (req, res) {
    let newNews = {
        title: req.body.title,
        message: req.body.message,
        img_url: req.body.img_url,
        updated_at: new Date()
    };
    let id = req.params.id;
    News.findOne({ _id: ObjectId(id) }, (err, news) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else if (!news) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else {
            News.updateOne({ _id: ObjectId(id) }, newNews, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.NewsNotUpdated });
                } else {
                    return res.json({ success: true, message: msg.NewsUpdated });
                }
            });
        }
    });
});

router.put('/update-status/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res) {
    let id = req.params.id
    News.findOne({ _id: ObjectId(id) }, (err, news) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else if (!news) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else {
            News.updateOne({ _id: ObjectId(id) }, { status: !news.status }, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.NewsStatusNotUpdated });
                } else {
                    return res.json({ success: true, message: msg.NewsStatusUpdated });
                }
            });
        }
    });
});

router.delete('/remove/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res) {
    let id = req.params.id;
    News.findOne({ _id: ObjectId(id) }, (err, news) => {
        if (err) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else if (!news) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else {
            News.remove({ _id: ObjectId(id) }, function (err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false, error: msg.NewsNotRemoved });
                } else {
                    return res.json({ success: true, message: msg.NewsRemoved });
                }
            });
        }
    });
});

router.get('/list', function (req, res) {
    let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    News.getAllNews(page, limit, (err, news) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!news) {
            return res.json({ success: false, error: msg.NewsNotFound });
        } else {
            return res.json({ success: true, news });
        }
    })
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
    News.getNewsDetailsById(ObjectId(req.params.id), (err, news) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!news) {
            return res.status(422).json({ success: false, error: msg.NewsNotFound });
        } else {
            return res.json({ success: true, news });
        }
    });
});

module.exports = router;
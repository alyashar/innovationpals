const Log = require('../manage-log');
var nodemailer = require('nodemailer');
const mailConfig = require('../config/emailconfig');
const AppConfig = require("../constants/appConfig");

const path = require('path');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const SMTPSetting = require('../model/smtp_setting');

module.exports = {
    systemGenrateRandomPassword: function (length = 8) {
        var text = "";
        var possible = AppConfig.RANDOM_STRING;
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    sendEmail: function (templateContent, userEmailAddress, emailSubject) {
        let APP_EMAIL_ADDRESS = '';
        SMTPSetting.findOne({}, (err, sMTPSetting) => {
            if (sMTPSetting) {
                APP_EMAIL_ADDRESS = sMTPSetting.smtp_email;
                var mailOptions = {
                    from: APP_EMAIL_ADDRESS ? APP_EMAIL_ADDRESS : AppConfig.APP_EMAIL_ADDRESS,
                    to: userEmailAddress,
                    subject: emailSubject,
                    html: '' + templateContent + ''
                };
                mailConfig.emailSetting.then(function (result) {
                    let transporter = nodemailer.createTransport(result);
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log('transporter error', error);
                            Log.ManageLog("EMAIL ERROR: " + error);
                        } else {
                            console.log('transporter info', info);
                            Log.ManageLog('Email sent: ' + info.response);
                        }
                    });
                });
            }
        });
    },
    filterString: function (replacedString) {
        var name = replacedString.trim().toUpperCase()
        var slug = name.replace(/ [^a-zA-Z0-9 ]\s/g, "");
        slug = slug.replace(/\s/g, '')
        return slug
    }
}
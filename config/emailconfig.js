var nodemailer = require('nodemailer');
const AppConfig = require("../constants/appConfig");
const fs = require('fs');
const SMTPSetting = require('../model/smtp_setting');

function initialize() {
	// Return new promise 
	let promiseVal = new Promise(function (resolve, reject) {
		SMTPSetting.findOne({}, (err, sMTPSetting) => {
			if (err) {
				reject(err);
			} else if (sMTPSetting) {
				// Do async job
				let APP_EMAIL_PORT = 0;
				let APP_EMAIL_SECURE = false;
				let APP_EMAIL_HOST = sMTPSetting.smtp_server;
				let APP_EMAIL_ADDRESS = sMTPSetting.smtp_email;
				let APP_EMAIL_PASSWORD = sMTPSetting.smtp_password;
				if (sMTPSetting.smtp_security_method && sMTPSetting.smtp_security_method == 'TLS') {
					APP_EMAIL_PORT = sMTPSetting.smtp_tls_port;
					APP_EMAIL_SECURE = false;
				} else if (sMTPSetting.smtp_security_method && sMTPSetting.smtp_security_method == 'SSL') {
					APP_EMAIL_PORT = sMTPSetting.smtp_ssl_port;
					APP_EMAIL_SECURE = true;
				}
				let emailConfiguration = {
					host: APP_EMAIL_HOST ? APP_EMAIL_HOST : AppConfig.APP_EMAIL_HOST,
					port: APP_EMAIL_PORT ? APP_EMAIL_PORT : AppConfig.APP_EMAIL_PORT,
					auth: {
						user: APP_EMAIL_ADDRESS ? APP_EMAIL_ADDRESS : AppConfig.APP_EMAIL_ADDRESS,
						pass: APP_EMAIL_PASSWORD ? APP_EMAIL_PASSWORD : AppConfig.APP_EMAIL_PASSWORD
					},
					secure: APP_EMAIL_SECURE ? APP_EMAIL_SECURE : false,
					tls: { rejectUnauthorized: false }
				};
				console.log(emailConfiguration.auth.user, emailConfiguration.auth.pass);
				resolve(emailConfiguration);
			} else {
				// Do async job
				let emailConfiguration = {
					host: AppConfig.APP_EMAIL_HOST,
					port: AppConfig.APP_EMAIL_PORT,
					auth: {
						user: AppConfig.APP_EMAIL_ADDRESS,
						pass: AppConfig.APP_EMAIL_PASSWORD
					},
					secure: false,
					tls: { rejectUnauthorized: false }
				};
				resolve(emailConfiguration);
			}
		});
	});

	return promiseVal;
}

module.exports.emailSetting = initialize();
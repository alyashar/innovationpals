const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// All SMTP Setting Schema
const SMTPSettingSchema = mongoose.Schema({

    smtp_server: {
        type: String,
        required: true,
        trim: true
    },

    smtp_email: {
        type: String,
        required: true,
        trim: true
    },

    smtp_password: {
        type: String,
        required: true,
        trim: true
    },

    smtp_security_method: {
        type: String,
        required: true,
        trim: true,
        default: 'TLS'
    },

    smtp_tls_port: {
        type: Number,
        required: true,
        trim: true,
        default: 587
    },

    smtp_ssl_port: {
        type: Number,
        required: true,
        trim: true,
        default: 465
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    updated_at: {
        type: Date,
        default: Date.now
    }
});

const SMTPSetting = module.exports = mongoose.model('SMTPSetting', SMTPSettingSchema);

// Add SMTP Setting
module.exports.addSMTPSetting = function (newSMTPSetting, callback) {
    newSMTPSetting.save(callback);
}

// Fetch SMTP Setting By ID
module.exports.getSMTPSettingById = function (id, callback) {
    SMTPSetting.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback);
}
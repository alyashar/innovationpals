const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Paypal Setting Schema
const PaypalSettingSchema = mongoose.Schema({

    paypal_mode: {
        type: String,
        required: true,
        trim: true
    },

    paypal_key: {
        type: String,
        required: true,
        trim: true
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

const PaypalSetting = module.exports = mongoose.model('PaypalSetting', PaypalSettingSchema);

// Add Paypal Setting
module.exports.addPaypalSetting = function(newPaypalSetting, callback) {
    newPaypalSetting.save(callback);
}

// Fetch Paypal Setting
module.exports.getPaypalSettingById = function(id, callback) {
    PaypalSetting.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}
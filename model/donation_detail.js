const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

//Organization Schema
const DonationDetailSchema = mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    user_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    transaction_id:{
      type:String,
      required: true,
      trim: true
    },
    donation_amount: {
        type: Number,
        required: true,
        default: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    transaction_detail: {
        type: Array,
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

const DonationDetail = module.exports = mongoose.model('DonationDetail', DonationDetailSchema);

module.exports.addDonationDetail = function(newDonationDetail, callback) {
    newDonationDetail.save(callback);
}

module.exports.getDonationDetailById = function(id, callback) {
    DonationDetail.findOne({ "_id": mongoose.Types.ObjectId(id) },callback)
}

module.exports.getAllDonationDetail = function(callback) {
    DonationDetail.find({},callback)
}

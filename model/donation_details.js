const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// All Project Category  Schema
const DonationSchema = mongoose.Schema({

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  status: {
    type: String,
    required: true,
    trim: true
  },

  transaction_id: {
    type: String,
    required: true,
    trim: true
  },

  transaction_detail: {
    type: Array,
    trim: true
  },

  donation_amount: {
    type: Number,
    required: true,
    trim: true
  },

  date: {
    type: Date,
    default: Date.now
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

DonationSchema.plugin(mongoosePaginate);

const Donation = module.exports = mongoose.model('Donation', DonationSchema);

module.exports.getDonationById = function (id, callback) {
  Donation.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.addDonation = function (newDonation, callback) {
  newDonation.save(callback);
}

module.exports.getDonations = function (organization_id, page, limit, callback) {
  let query = {};
  if (organization_id) {
    query = { "organization_id": organization_id.toString() }
  }
  if (page && limit) {
    var options = {
      page: page,
      limit: parseInt(limit),
      sort: { created_at: -1 },
      populate: [{
        path: 'user_id project_id organization_id', select: 'name project_name project_total_donation_amount'
      }]
    }
    Donation.paginate(query, options, callback);
  } else {
    Donation.find(query).populate({
      path: 'user_id project_id organization_id', select: 'name project_name project_total_donation_amount'
    }).exec(callback);
  }
}

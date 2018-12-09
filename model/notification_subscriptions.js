const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// All Project Category  Schema
const NotificationSubscriptionSchema = mongoose.Schema({


  email: {
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

NotificationSubscriptionSchema.plugin(mongoosePaginate);

const NotificationSubscription = module.exports = mongoose.model('NotificationSubscription', NotificationSubscriptionSchema);

module.exports.getUserByEmailId = function (email, callback) {
  NotificationSubscription.findOne({ "email": email }, callback)
}

module.exports.addSubscription = function (newNotificationSubscription, callback) {
  newNotificationSubscription.save(callback);
}

module.exports.getSubscribedEmailAddresses = function (page, limit, callback) {
  let query = {};
  if (page && limit) {
    var options = {
      page: page,
      limit: parseInt(limit),
      sort: { created_at: 1 },
      lean: false,
    }
    NotificationSubscription.paginate(query, options, callback);
  } else {
    NotificationSubscription.find(query)
      .exec(callback);
  }
}
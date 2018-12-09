const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

//Organization Schema
const NewsSchema = mongoose.Schema({
  created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  img_url: {
    type: String,
    trim: true
  },
  status: {
    type: Boolean,
    trim: true,
    default: true
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

NewsSchema.plugin(mongoosePaginate);

const News = module.exports = mongoose.model('News', NewsSchema);

module.exports.getAllNews = function (page, limit, callback) {
  page = page ? page : 1;
  limit = limit ? limit : 10;
  let query = {};

  /*
  if (limit > 4) {
    if (organization_id) {
      //query = { organization_id: organization_id };
    }
    // if (isStudent) {
    //   query['organization_id'] = organization_id
    //   query['status'] = true;
    // }
    // if (isVisitor) {
    //   query['organization_id'] = organization_id
    //   query['status'] = true;
    // }
  }
  */

  var options = {
    page: page,
    limit: parseInt(limit),
    sort: { created_at: -1 },
    lean: false,
    populate: [{
      path: 'organization_id', select: 'name'
    }]
  }
  News.paginate(query, options, callback);
}

module.exports.getNewsDetailsById = function (id, callback) {
  News.findById(id).
    populate({
      path: 'organization_id',
      select: 'name'
    }).
    exec(callback);
}
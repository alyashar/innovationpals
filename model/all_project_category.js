const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// All Project Category  Schema
const AllProjectCategorySchema = mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    trim: true
  },

  category_image: {
    type: String,
    required: false,
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

AllProjectCategorySchema.plugin(mongoosePaginate);

const AllProjectCategory = module.exports = mongoose.model('AllProjectCategory', AllProjectCategorySchema);

module.exports.getAllProjectCategoryById = function (id, callback) {
  AllProjectCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.addAllProjectCategory = function (newAllProjectCategory, callback) {
  newAllProjectCategory.save(callback);
}

module.exports.getAllProjectCategory = function (page, limit, callback) {
  let query = {};
  if (page && limit) {
    var options = {
      page: page,
      limit: parseInt(limit),
      sort: { created_at: 1 },
      lean: false,
    }
    AllProjectCategory.paginate(query, options, callback);
  } else {
    AllProjectCategory.find(query)
      .exec(callback);
  }
}
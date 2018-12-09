const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// All Student Category  Schema
const AllStudentCategorySchema = mongoose.Schema({

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

AllStudentCategorySchema.plugin(mongoosePaginate);

const AllStudentCategory = module.exports = mongoose.model('AllStudentCategory', AllStudentCategorySchema);

module.exports.getAllStudentCategoryById = function (id, callback) {
    AllStudentCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.addAllStudentCategory = function (newAllStudentCategory, callback) {
    newAllStudentCategory.save(callback);
}

module.exports.getAllStudentCategory = function (page, limit, callback) {
    let query = {};
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false,
        }
        AllStudentCategory.paginate(query, options, callback);
    } else {
        AllStudentCategory.find(query)
            .exec(callback);
    }
}
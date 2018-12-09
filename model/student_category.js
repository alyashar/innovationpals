const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Student Category Schema
const StudentCategorySchema = mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: {
        type: String,
        required: true,
        trim: true
    },
    student_category_image: {
        type: String,
        required: false,
        trim: true
    },
    slug: {
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

StudentCategorySchema.plugin(mongoosePaginate);

const StudentCategory = module.exports = mongoose.model('StudentCategory', StudentCategorySchema);

module.exports.addStudentCategory = function(newStudentCategory, callback) {
    newStudentCategory.save(callback);
}

module.exports.getStudentCategoryId = function(id, callback) {
    StudentCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllStudentCategoryById = function(id, callback) {
    StudentCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }).
    populate({ path: 'organization_id' }).
    exec(callback);
}

module.exports.getAllStudentCategory = function(organization_id, page, limit, callback) {
    let query = {};
    if (organization_id) {
        query = { organization_id };
    }
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { 'name': 1 },
            lean: false,
            populate: [{
                path: 'organization_id'
            }]
        }
        StudentCategory.paginate(query, options, callback);
    } else {
        StudentCategory.find(query, callback);
    }
}
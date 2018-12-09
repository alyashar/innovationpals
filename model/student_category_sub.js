const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// Student Sub-Category Schema
const StudentSubCategorySchema = mongoose.Schema({

    name: {
      type: String,
      required: true,
      trim: true
    },
    student_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCategory' },
    created_at: {
      type: Date,
      default: Date.now
    },

    updated_at: {
      type: Date,
      default: Date.now
    }
});

const StudentSubCategory = module.exports = mongoose.model('StudentSubCategory', StudentSubCategorySchema);

module.exports.addStudentSubCategory = function(newStudentSubCategory, callback) {
    newStudentSubCategory.save(callback);
}

module.exports.getStudentSubCategoryById = function(id, callback) {
    StudentSubCategory.findOne({ "_id": mongoose.Types.ObjectId(id) },callback)
}

module.exports.getAllStudentSubCategoryById = function(id, callback) {
    StudentSubCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }).
    populate({ path: 'student_category_id'}).
    exec(callback);
}

module.exports.getAllStudentSubCategory = function(callback) {
    StudentSubCategory.find({}).
    populate({ path: 'student_category_id'}).
    exec(callback);
}

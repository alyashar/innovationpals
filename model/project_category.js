const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Project Category Schema
const ProjectCategorySchema = mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    project_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        trim: true
    },

    project_category_image: {
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

ProjectCategorySchema.plugin(mongoosePaginate);

const ProjectCategory = module.exports = mongoose.model('ProjectCategory', ProjectCategorySchema);

module.exports.addProjectCategory = function(newProjectCategory, callback) {
    newProjectCategory.save(callback);
}

module.exports.getProjectCategoryById = function(id, callback) {
    ProjectCategory.findOne({ "_id": mongoose.Types.ObjectId(id) }).
    populate({ path: 'organization_id' }).
    exec(callback)
}

module.exports.getAllProjectCategory = function(organization_id, page, limit, callback) {
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
        ProjectCategory.paginate(query, options, callback);
    } else {
        ProjectCategory.find(query, callback);
    }
}
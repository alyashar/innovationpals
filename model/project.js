const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Project Schema
const ProjectSchema = mongoose.Schema({
    activity_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
    project_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectCategory' },
    project_manager_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    team_member_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }],
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    project_risk_type_data_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectRiskTypeData' }],
    task_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    deliverables_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deliverables' }],
    rating_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectRating' },

    project_number: {
        type: String,
        required: true,
        trim: true
    },
    project_description: {
        type: String,
        required: true,
        trim: true
    },
    project_name: {
        type: String,
        required: true,
        trim: true
    },
    project_image: {
        type: String,
        required: false,
        trim: true
    },
    project_objective: {
        type: Array
    },
    project_scope: {
        type: Array
    },
    project_deliverables: {
        type: Array
    },
    project_time_line: {
        type: Date,
        required: true,
        default: Date.now
    },
    project_total_donation_amount: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        trim: true
    },
    hours_per_day: {
        type: Number,
        default: 8
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

ProjectSchema.plugin(mongoosePaginate);

const Project = module.exports = mongoose.model('Project', ProjectSchema);

module.exports.addProject = function(newProject, callback) {
    newProject.save(callback);
}

module.exports.getProjectDetailsById = function(id, callback) {
    Project.findById(id).
    populate({
        path: 'project_category_id project_manager_id activity_id organization_id project_risk_id team_member_id project_risk_type_data_id deliverables_id',
        populate: {
            path: 'project_risk_type_id'
        }
    }).
    exec(callback);
}

module.exports.getProjectById = function(id, callback) {
    Project.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllProject = function(organization_id, page, limit, callback) {
    let query = {};
    if (organization_id) {
        query = { organization_id };
    }
    if (page && limit) {
        var options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false,
            populate: [{
                path: 'project_category_id project_manager_id activity_id organization_id student_id'
            }]
        }
        Project.paginate(query, options, callback);
    } else {
        Project.find(query)
            .populate({
                path: 'project_category_id project_manager_id activity_id organization_id student_id team_member_id project_risk_id'
            })
            .exec(callback);
    }
}

module.exports.getProjectDashboardById = function(id, callback) {
    Project.find({ '_id': mongoose.Types.ObjectId(id) })
        .populate({
            path: 'organization_id project_category_id activity_id project_risk_type_data_id deliverables_id',
            select: 'project_description project_name project_number organization_id project_category_id activity_id task_id name project_category_image resource activity_title description planned_from planned_to planned_duration actual_from actual_to actual_duration deliverables status completion_date',
            populate: {
                path: 'task_id',
                populate: {
                    path: 'student_id',
                    select: 'name'
                }
            }
        })
        .exec((err, result) => {
            callback(err, result)
        });
}
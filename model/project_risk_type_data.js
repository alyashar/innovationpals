const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Project Risk Data Schema
const ProjectRiskTypeDataSchema = mongoose.Schema({
    project_risk_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskTypeData' },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

    risk_title: {
        type: String,
        require: true,
        default: null,
        trim: true
    },
    description: {
        type: String,
        default: null,
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    identified_date: {
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

ProjectRiskTypeDataSchema.plugin(mongoosePaginate);

const ProjectRiskTypeData = module.exports = mongoose.model('ProjectRiskTypeData', ProjectRiskTypeDataSchema);

// Add Project Risk Type Data
module.exports.addProjectRiskTypeData = function(newProjectRiskTypeData, callback) {
    newProjectRiskTypeData.save(callback);
}

// Return all Project Risk Type Data
module.exports.getAllProjectRiskTypeData = function(project_id, page, limit, callback) {
    let query = {};
    if (project_id) {
        query = { project_id };
    }
    if (page && limit) {
        var options = {
            page: page,
            limit: parseInt(limit),
            sort: { created_at: 1 },
            lean: false,
            populate: [{
                path: 'project_risk_type_id',
                select: 'risk_title'
            }]
        }
        ProjectRiskTypeData.paginate(query, options, callback);
    } else {
        ProjectRiskTypeData.find(query)
            .populate({
                path: 'project_risk_type_id',
                select: 'risk_title'
            })
            .exec(callback);
    }
}

// Fetch Data For Project's Risk Types Using Match, Group, Lookup and Projection
module.exports.getAllProjectRiskTypes = function(project_id, callback) {
    ProjectRiskTypeData.aggregate(
        [{
                $match: { 'project_id': project_id }
            },
            {
                $group: {
                    _id: '$project_risk_type_id',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'risktypedatas',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'risktypedata'
                }
            },
            {
                "$sort": { "count": -1 }
            }
        ]
    ).exec(callback);
}

// Return all Project's Risk Type Data
module.exports.getAllProjectRiskTypesDatas = function(project_risk_type_id, project_id, callback) {
    let query = {};
    if (project_risk_type_id) {
        query = { project_risk_type_id };
    }
    if (project_id) {
        query['project_id'] = project_id;
    }
    console.log(query);
    ProjectRiskTypeData.find(query)
        .exec(callback);
}
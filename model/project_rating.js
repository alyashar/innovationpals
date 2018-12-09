const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// User Ratings Schema
const ProjectRatingSchema = mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

    average_rating: {
        type: Number,
        required: true,
        trim: true
    },

    rating: [{
        key: { type: String, default: 'User' },
        rating: { type: Number, required: true },
        rating_date: { type: Date, required: true },
        rating_given_by_user_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'rating.key' }
    }],

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const ProjectRating = module.exports = mongoose.model('ProjectRating', ProjectRatingSchema);

// save rating organization
module.exports.addnewRating = function(newRating, callback) {
    newRating.save(callback);
}

// get organization data
module.exports.getRatingById = function(id, authUser, callback) {
    if (!authUser) {
        ProjectRating.findOne({ "project_id": mongoose.Types.ObjectId(id) }, { 'average_rating': 1, 'project_id': 1 }, (err, result) => {
            if (result) {
                result['my_ratings'] = 0;
            }
            callback(err, result)
        });
    } else {
        ProjectRating.findOne({ "project_id": mongoose.Types.ObjectId(id) }, { 'average_rating': 1, 'project_id': 1 }, (err, result) => {
            ProjectRating.findOne({ project_id: id.toString(), "rating.rating_given_by_user_id": mongoose.Types.ObjectId(authUser) }, { _id: 0, rating: { $elemMatch: { rating_given_by_user_id: authUser } } },
                (err, my_rating) => {
                    if (my_rating) {
                        result['my_ratings'] = my_rating.rating[0].rating;
                    }
                    callback(err, result)
                }
            );
        });
    }
}

// Add rating data
module.exports.addRatting = function(Ratings, callback) {
    ProjectRating.updateOne({
        "project_id": mongoose.Types.ObjectId(Ratings.project_id)
    }, {
        'average_rating': Ratings.average_rating,
        $push: {
            'rating': Ratings.rating
        },
        'updated_at': new Date()
    }).exec(callback);
}

module.exports.getRatings = function(top_ratings, callback) {
    query = {};
    ProjectRating.find(query)
        .select('project_id average_rating')
        .populate({ path: 'project_id organization_id', select: 'name photos videos project_name project_number project_category_id project_image ', populate: { path: 'project_category_id task_id', select: 'name actual_hours' } })
        .sort({ average_rating: -1, updated_at: 1 }).limit(top_ratings)
        .exec(callback);
}

module.exports.getRatingsByProjectid = function(project_id, page, limit, callback) {
    query = {};
    if (project_id) {
        query = { project_id };
    }
    if (page && limit) {
        let skips = limit * (page - 1);
        ProjectRating.findOne(query, { rating: { $slice: [parseInt(skips), parseInt(limit)] } }).populate({
            sort: { 'rating.rating_date': -1 },
            path: "rating.rating_given_by_user_id organization_id project_id role_id",
            select: "name project_name",
            populate: {
                path: "organization_id role_id",
                select: "name"
            }
        }).exec(callback);
    } else {
        ProjectRating.findOne(query).populate({
            sort: { 'rating.rating_date': -1 },
            path: "rating.rating_given_by_user_id organization_id project_id role_id",
            select: "name project_name",
            populate: {
                path: "organization_id role_id",
                select: "name"
            }
        }).exec(callback);
    }
}

module.exports.countRatingsByProjectid = function(project_id, callback) {
    query = {};
    if (project_id) {
        query = { project_id };
    }
    ProjectRating.findOne(query).exec(callback);
}

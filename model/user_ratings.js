const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

// User Ratings Schema
const UserRatingSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' }, 
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

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

UserRatingSchema.plugin(mongoosePaginate);

const UserRating = module.exports = mongoose.model('UserRating', UserRatingSchema);

// save registar organization
module.exports.addnewRating = function(newRating, callback) {
    newRating.save(callback);
}

// get organization data
module.exports.getRatingById = function(id, authUser, callback) {
    if (!authUser) {
        UserRating.findOne({ "user_id": mongoose.Types.ObjectId(id) }, { 'average_rating': 1, 'user_id': 1 }, (err, result) => {
            if (result) {
                result['my_ratings'] = 0;
            }
            callback(err, result);
        });
    } else {
        UserRating.findOne({ "user_id": mongoose.Types.ObjectId(id) }, { 'average_rating': 1, 'user_id': 1 }, (err, result) => {
            UserRating.findOne({ user_id: id.toString(), "rating.rating_given_by_user_id": mongoose.Types.ObjectId(authUser) }, { _id: 0, rating: { $elemMatch: { rating_given_by_user_id: authUser } } },
                (err, my_rating) => {
                    if (result) {
                        if (my_rating) {
                            result['my_ratings'] = my_rating.rating[0].rating;
                        } else {
                            result['my_ratings'] = 0;
                        }
                    }
                    callback(err, result)
                }
            );
        });
    }
}


// get organization data
module.exports.addRatting = function(Ratings, callback) {
    UserRating.updateOne({
        "user_id": mongoose.Types.ObjectId(Ratings.user_id)
    }, {
        'average_rating': Ratings.average_rating,
        $push: {
            'rating': Ratings.rating
        },
        'updated_at': new Date()
    }).exec(callback);
}


module.exports.getRatings = function(top_ratings, callback) {
    query = { role_id : STUDENT_ID.toString()};
    UserRating.find(query)
        .select('user_id average_rating')
        .populate({ path: 'user_id organization_id', 
            select: 'name role_id dob email organization_id project_id task_id profile_pic', 
            populate: { path: 'task_id organization_id', 
            select: 'actual_hours name' } })
        .sort({ average_rating: -1, updated_at: 1 }).limit(top_ratings)
        .exec(callback);
}

module.exports.countRatingsByUserid = function(user_id, callback) {
    query = {};
    if (user_id) {
        query = { user_id };
    }
    UserRating.findOne(query).exec(callback);
}

module.exports.getRatingsByUserid = function(user_id, page, limit, callback) {
    query = {};
    if (user_id) {
        query = { user_id };
    }
    if (page && limit) {
        let skips = limit * (page - 1);
        UserRating.findOne(query, { rating: { $slice: [parseInt(skips), parseInt(limit)] } }).populate({
            sort: { 'rating.rating_date': -1 },
            path: "user_id rating.rating_given_by_user_id organization_id user_id role_id",
            select: "name",
            populate: {
                path: "organization_id role_id",
                select: "name"
            }
        }).exec(callback);
    } else {
        UserRating.findOne(query).populate({
            sort: { 'rating.rating_date': -1 },
            path: "user_id rating.rating_given_by_user_id organization_id user_id, role_id",
            select: "name",
            populate: {
                path: "organization_id role_id",
                select: "name"
            }
        }).exec(callback);
    }
}
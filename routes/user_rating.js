const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');
const ValidationUtility = require('../utility/validations')

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const UserRating = require('../model/user_ratings');
const ProjectRating = require('../model/project_rating');
const User = require('../model/user');
 
const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
    next();
});

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")

router.post('/add', Auth.isAdminOrStudentorVisitor, isSelf, ValidationUtility.validateRatingAddForm, function (req, res) {
    let {
        user_id,
        rating
    } = req.body
    let findUser = {};
    let role_id = '';
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.role_id._id == VISITOR_ID ? false : req.authUser.organization_id._id;
    findUser = { user_id: ObjectId(user_id) }
    User.findOne({ "_id": ObjectId(user_id), "role_id": ObjectId(STUDENT_ID) }, (errs, user_role) => {
        if (errs) {
            return res.status(422).json({ success: false, error: msg.SomethingWentWrong });
        } else if (!user_role) {
            return res.status(422).json({ success: false, error: msg.YouCantRate });
        } else {
            UserRating.findOne(findUser, (error, user) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!user) {
                    let newRating = {};
                    newRating = new UserRating({
                        user_id,
                        rating: {
                            rating,
                            rating_date: new Date(),
                            rating_given_by_user_id: ObjectId(req.authData._id)
                        },
                        average_rating: rating,
                        role_id: user_role.role_id.toString()
                    });
                    if (organization_id) {
                        newRating['organization_id'] = organization_id
                    }
                    UserRating.addnewRating(newRating, (err, rating) => {
                        if (err || !rating) {
                            return res.status(422).json({ success: false, error: msg.RatingAddFailed });
                        } else {
                            let id = rating._id;
                            // Rating added to the User
                            User.updateOne({ _id: ObjectId(user_id) }, { 'rating_id': id }, (err, result) => {
                                console.log('Rating Assigned To user');
                            });
                            return res.json({ success: true, message: msg.RatingAddSuccess });
                        }
                    });
                } else {
                    let check = user.rating.findIndex(o => o.rating_given_by_user_id == req.authData._id) + 1;
                    let new_average_rating = (Number(user.average_rating) * (user.rating.length) + Number(rating)) / (user.rating.length + 1);
                    if (check) {
                        return res.status(422).json({ success: false, error: "You have already rated to this student" });
                    } else {
                        let newRating = {};
                        newRating = {
                            user_id,
                            rating: {
                                rating,
                                rating_date: new Date(),
                                rating_given_by_user_id: ObjectId(req.authData._id.toString())
                            },
                            average_rating: new_average_rating
                        };
                        if (organization_id) {
                            newRating['organization_id'] = organization_id
                        }
                        UserRating.addRatting(newRating, (err, Rating) => {
                            if (err || !Rating) {
                                return res.status(422).json({ success: false, error: msg.RatingAddFailed });
                            } else {
                                return res.json({ success: true, message: msg.RatingAddSuccess });
                            }
                        })
                    }
                }
            });
        }
    })
});

// Avrage ratting of given user id and also get rating if login user rated 
router.get('/select/:user_id', objectIdErrorHandlerMiddleware, function (req, res) {
    UserRating.getRatingById(req.params.user_id, req.authData._id, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            let rating = my_rating = 0;
            return res.status(200).json({ success: false, rating, my_rating });
        } else {
            let my_rating = 0;
            if (rating.my_ratings) {
                my_rating = rating.my_ratings;
            }
            return res.json({ success: true, rating, my_rating });
        }
    });
});

router.get('/select', function (req, res) {
    let top_ratings = 10;
    UserRating.getRatings(top_ratings, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            return res.status(422).json({ success: false });
        } else {
            let total = 0
            rating.forEach((ratings, index) => {
                if (ratings.user_id.task_id.length) {
                    ratings.user_id.task_id.forEach(data => {
                        total = Number(total) + Number(data.actual_hours);
                    });
                }
                ratings = JSON.parse(JSON.stringify(ratings))
                ratings.user_id['total_actual_hours'] = Number(total);
                ratings.user_id['total_project'] = ratings.user_id.project_id.length;
                rating[index] = ratings;
                delete rating[index].user_id.task_id;
                delete rating[index].user_id.project_id;
                total = 0;
            });
            if (rating.length == 0) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, rating });
            }
        }
    })
});

// Get All User 
router.get('/ratings/:user_id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function (req, res) {
    let total_ratings = 0;
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    UserRating.countRatingsByUserid(req.params.user_id, (err, ratings) => {
        if (ratings)
            total_ratings = ratings.rating.length;
    });
    UserRating.getRatingsByUserid(req.params.user_id, page, limit, (err, ratings) => {
        if (page && limit) {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!ratings) {
                return res.status(422).json({ success: false, error: msg.RatingNotFound });
            } else {
                return res.json({ success: true, ratings, total_ratings });
            }
        } else {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!ratings) {
                return res.status(422).json({ success: false, error: msg.RatingNotFound });
            } else {
                return res.json({ success: true, ratings });
            }
        }
    });
});

function isSelf(req, res, next) {
    if (req.body.user_id.toString() === req.authData._id.toString()) {
        let error = "Not Allowed";
        return res.status(422).json({ success: false, error });
    } else {
        next();
    }
}

module.exports = router;
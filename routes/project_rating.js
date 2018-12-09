const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path');
const fs = require('fs');
const ValidationUtility = require('../utility/validations');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const ProjectRating = require('../model/project_rating');
const Project = require('../model/project');
const ProjectPhotosAndVideos = require('../model/project_photos_and_videos.js');
const TeamMember = require('../model/team_members');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler');
router.use(function (req, res, next) {
    next();
});

const {
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst");

router.post('/add', ValidationUtility.validateProjectRatingForm, function (req, res) {
    let {
        project_id,
        rating
    } = req.body
    let findProject = {}
    let organization_id = req.isUserMasterAdmin ? false : req.authUser.role_id._id == VISITOR_ID ? false : req.authUser.organization_id._id;
    findProject = { project_id: ObjectId(project_id) }
    Project.findOne({ "_id": project_id.toString() }, (err, project) => {
        if (err) {
            return res.status(422).json({ success: false, err });
        } else if (!project) {
            return res.status(422).json({ success: false, error: msg.SomethingWentWrong });
        } else {
            ProjectRating.findOne(findProject, (error, user) => {
                if (error) {
                    return res.status(422).json({ success: false, error });
                } else if (!user) {
                    let newRating = {};
                    newRating = new ProjectRating({
                        project_id,
                        rating: {
                            rating,
                            rating_date: new Date(),
                            rating_given_by_user_id: ObjectId(req.authData._id.toString())
                        },
                        average_rating: rating
                    });
                    if (organization_id) {
                        newRating['organization_id'] = organization_id
                    }

                    ProjectRating.addnewRating(newRating, (err, rating) => {
                        if (err || !rating) {
                            return res.status(422).json({ success: false, error: msg.RatingAddFailed });
                        } else {
                            let id = rating._id;
                            // Rating added to the User
                            Project.updateOne({ _id: ObjectId(project_id) }, { 'rating_id': id }, (err, result) => {
                                console.log('Rating Assigned To Pproject');
                            });
                            return res.json({ success: true, message: msg.RatingAddSuccess });
                        }
                    });
                } else {
                    let check = user.rating.findIndex(o => o.rating_given_by_user_id == req.authData._id) + 1;
                    let new_average_rating = (Number(user.average_rating) * (user.rating.length) + Number(rating)) / (user.rating.length + 1);
                    if (check) {
                        return res.status(422).json({ success: false, error: "You have already rated to this project" });
                    } else {

                        let newRating = {
                            project_id,
                            rating: {
                                rating,
                                rating_date: new Date(),
                                rating_given_by_user_id: ObjectId(req.authData._id)
                            },
                            average_rating: new_average_rating,
                            organization_id
                        };
                        if (organization_id) {
                            newRating['organization_id'] = organization_id
                        }

                        ProjectRating.addRatting(newRating, (err, Rating) => {
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
router.get('/select/:project_id', objectIdErrorHandlerMiddleware, function (req, res) {
    let student_id = req.authData._id;
    TeamMember.findOne({ "user_id": student_id.toString(), "project_id": req.params.project_id.toString() }, (err, team_member) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (team_member == null) {
            ProjectRating.getRatingById(req.params.project_id, req.authData._id, (error, rating) => {
                if (error) {
                    return res.status(422).json({ success: false });
                } else {
                    let my_rating = 0;
                    if (rating && rating.my_ratings) {
                        my_rating = rating.my_ratings;
                    }
                    return res.json({ success: true, rating, my_rating, belong_to_project: false });
                }
            });
        } else {
            ProjectRating.getRatingById(req.params.project_id, req.authData._id, (error, rating) => {
                if (error) {
                    return res.status(422).json({ success: false });
                } else {
                    let my_rating = 1;
                    return res.json({ success: true, rating, my_rating, belong_to_project: true });
                }
            });
            
        }
    });
});

router.get('/select', function (req, res) {
    let top_ratings = 10;
    ProjectRating.getRatings(top_ratings, (err, rating) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!rating) {
            return res.status(422).json({ success: false });
        } else {
            let total = 0
            rating.forEach((ratings, index) => {
                if (ratings.project_id.task_id && ratings.project_id.task_id.length) {
                    ratings.project_id.task_id.forEach(data => {
                        total = Number(total) + Number(data.actual_hours);
                    });
                }
                ratings = JSON.parse(JSON.stringify(ratings))
                ratings.project_id['total_actual_hours'] = Number(total);
                rating[index] = ratings;
                delete rating[index].project_id.task_id;
                total = 0;
            });
            var limit = 20;
            ProjectPhotosAndVideos.getPhotosAndVideos(limit,(err, result)=>{
                if(err){
                    return res.status(422).json({ success: false });
                }else{
                    if (rating.length == 0) {
                        return res.status(422).json({ success: false });
                    } else {
                        let photos = result.photos;
                        let videos = result.videos;
                        return res.json({ success: true, rating, photos, videos });
                    }
                } 
            });
        }
    });
});

// Avrage ratting of given user id and also get rating if login user rated 
router.get('/ratings/:project_id', objectIdErrorHandlerMiddleware, Auth.isAdmin, function (req, res) {
    let total_ratings = 0;
    let page = (req.query.page != 'undefined' && req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
    let limit = (req.query.limit != 'undefined' && req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
    ProjectRating.countRatingsByProjectid(req.params.project_id, (err, ratings) => {
        if (ratings)
            total_ratings = ratings.rating.length;
    });
    ProjectRating.getRatingsByProjectid(req.params.project_id, page, limit, (err, ratings) => {
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


module.exports = router;
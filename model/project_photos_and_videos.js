const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Activity Schema
const ProjectPhotosAndVideosSchema = mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

    type: {
        type: String,
        required: true,
        default: null,
        trim: true
    },
    media_url: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    thumbnail_url: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    title: {
        type: String,
        required: false,
        trim: true,
        default: null
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

ProjectPhotosAndVideosSchema.plugin(mongoosePaginate);

const ProjectPhotosAndVideos = module.exports = mongoose.model('ProjectPhotosAndVideos', ProjectPhotosAndVideosSchema);

module.exports.addMedia = function(newMedia, callback) {
    newMedia.save(callback);
}


module.exports.getPhotosAndVideos = function(limit, callback) {
    var data = [];
    let video_limit = 10;
    ProjectPhotosAndVideos.find({ 'type': 'videos' })
        .populate({ path: 'project_id', select: 'organization_id', populate: { path: 'organization_id', select: 'name' } })
        .sort({ "created_at": -1 })
        .limit(video_limit).exec((err, videos) => {
            if (!err, videos.length) {
                data['videos'] = videos;
            } else {
                data['videos'] = null;
            }

            ProjectPhotosAndVideos.find({ 'type': 'photos' })
                .populate({ path: 'project_id', select: 'organization_id', populate: { path: 'organization_id', select: 'name' } })
                .sort({ "created_at": -1 })
                .limit(limit).exec((err, photos) => {
                    if (!err, photos.length) {
                        data['photos'] = photos;
                        callback(null, data);
                    } else {
                        data['photos'] = null;
                        callback(null, data);
                    }
                });
        });
}


module.exports.getPhotosAndVideosOfProject = function(project_id, callback) {
    var data = [];
    ProjectPhotosAndVideos.find({ project_id, 'type': 'videos' })
        .populate({ path: 'project_id', select: 'organization_id', populate: { path: 'organization_id', select: 'name' } })
        .sort({ "created_at": -1 })
        .exec((err, videos) => {
            if (!err, videos.length) {
                data['videos'] = videos;
            } else {
                data['videos'] = null;
            }

            ProjectPhotosAndVideos.find({ project_id, 'type': 'photos' })
                .populate({ path: 'project_id', select: 'organization_id', populate: { path: 'organization_id', select: 'name' } })
                .sort({ "created_at": -1 })
                .exec((err, photos) => {
                    if (!err, photos.length) {
                        data['photos'] = photos;
                        callback(null, data);
                    } else {
                        data['photos'] = null;
                        callback(null, data);
                    }
                });
        });
}
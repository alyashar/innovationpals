const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

// Task Schema
const TaskSchema = mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  description: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  planned_from: {
    type: String,
    required: true,
    trim: true
  },
  planned_to: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  planned_duration: {
    type: String,
    required: false,
    trim: true,
    default: 0
  },
  planned_hours: {
    type: Number,
    trim: true,
    default: 0
  },
  actual_from: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  actual_to: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  actual_duration: {
    type: String,
    required: false,
    trim: true,
    default: 0
  },
  actual_hours: {
    type: Number,
    trim: true,
    required: false,
    default: 0
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

TaskSchema.plugin(mongoosePaginate);

const Task = module.exports = mongoose.model('Task', TaskSchema);

module.exports.addTask = function (newTask, callback) {
  newTask.save(callback);
}

module.exports.getTaskById = function (id, callback) {
  Task.findOne({ "_id": mongoose.Types.ObjectId(id) }, callback)
}

module.exports.getAllTask = function (callback) {
  Task.find({}, callback)
}

module.exports.getAllTaskByActivityId = function (activity_id, page, limit, callback) {
  let query = {};
  if (activity_id) {
    query = { activity_id };
  }
  if (page && limit) {
    var options = {
      page: page,
      limit: parseInt(limit),
      sort: { created_at: 1 },
      lean: false,
      populate: [{
        path: 'student_id',
        select: 'name email'
      }]
    }
    Task.paginate(query, options, callback);
  } else {
    Task.find(query)
      .populate({
        path: 'student_id',
        select: 'name email'
      })
      .exec(callback);
  }
}

module.exports.getAllTaskByProjectId = function (project_id, callback) {
  Task.find({ 'project_id': project_id }).exec(callback);
}

module.exports.getAllTaskByProjectAndStudentId = function (project_id, student_id, callback) {
  Task.find({ 'project_id': project_id, 'student_id': student_id }).exec(callback);
}

// Fetch Data From Resource Utilization Using Match, Group, Lookup and Projection
module.exports.getAllProjectStudents = function (project_id, callback) {
  Task.aggregate(
    [
      {
        $match: { 'project_id': project_id }
      },
      {
        $group: {
          _id: '$student_id',
          total_actual_hours: { $sum: '$actual_hours' },
          total_planned_hours: { $sum: '$planned_hours' }
        }
      },
      {
        $lookup:
          {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
      },
      {
        $project:
          {
            id: 1,
            total_actual_hours: 1,
            total_planned_hours: 1,
            'user.name': 1
          }
      }
    ]
  ).exec(callback);
}

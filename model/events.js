const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

//Organization Schema
const EventsSchema = mongoose.Schema({
    name:{
      type:String,
      required: true,
      trim: true
    },
    description:{
      type:String,
      required: true
    },
    start_date:{
      type: Date,
    },
    end_date:{
      type: Date,
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

const Events = module.exports = mongoose.model('Events', EventsSchema);

module.exports.addEvent = function(newEvents, callback) {
  newEvents.save(callback);
}

module.exports.getEventById = function(id, callback) {
  Events.findOne({ "_id": mongoose.Types.ObjectId(id) } , callback)
}

module.exports.getAllEvent = function(callback) {
  Events.find({},callback)
}

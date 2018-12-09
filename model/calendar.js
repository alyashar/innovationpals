const mongoose = require('mongoose');
var moment = require('moment');
var today = moment().startOf('day');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');

const CalendarSchema = mongoose.Schema({
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    event_date: {
        type: Date,
    },
    status: {
        type: Boolean,
        trim: true,
        default: true
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

CalendarSchema.plugin(mongoosePaginate);

const Calendar = module.exports = mongoose.model('Calendar', CalendarSchema);

// With Auth
module.exports.getAllEvents = function (page, limit, organization_id, role_array, callback) {
    page = page ? page : 1;
    limit = limit ? limit : 10;
    let query = {};
    let sort = {};
    var yesterday = new Date(); // Today!
    yesterday.setDate(yesterday.getDate() - 1); // Yesterday!
    console.log('yesterday', yesterday);
    if (role_array.isStudent || role_array.isVisitor) {
        query = {
            event_date: {
                $gte: yesterday
            }
        };
        sort['event_date'] = 1;
    } else if (role_array.isSuperAdmin || role_array.isAdmin) {
        if (limit > 4) {
            query = {};
            sort['event_date'] = -1;
        } else {
            query = {
                event_date: {
                    $gte: yesterday
                }
            };
            sort['event_date'] = 1;
        }
    } else {
        query = {
            event_date: {
                $gte: yesterday
            }
        };
        sort['event_date'] = 1;
    }
    
    /*
    if (limit > 4) {
        if (organization_id) {
            //query['organization_id'] = organization_id;
        }
        // if (isStudent || isVisitor) {
        //     query['organization_id'] = organization_id;
        //     query['status'] = true;
        // }
    }
    */

    console.log('query, sort', query, sort);

    var options = {
        page: page,
        limit: parseInt(limit),
        sort: sort,
        lean: false,
        populate: [{
            path: 'organization_id',
            select: 'name'
        }]
    }
    Calendar.paginate(query, options, callback);
}

// Without Auth
module.exports.getAllActiveEvents = function (page, limit, callback) {
    page = page ? page : 1;
    limit = limit ? limit : 10;
    let query = {};
    var yesterday = new Date(); // Today!
    yesterday.setDate(yesterday.getDate() - 1); // Yesterday!
    console.log('yesterday', yesterday);
    query = {
        event_date: {
            $gte: yesterday
        }
    };

    let sort = {};
    if (limit > 4) {
        sort['event_date'] = 1;
    } else {
        sort['event_date'] = 1;
    }

    /*
    if (limit > 4) {
        if (organization_id) {
            //query['organization_id'] = organization_id;
        }
        // if (isStudent || isVisitor) {
        //     query['organization_id'] = organization_id;
        //     query['status'] = true;
        // }
    }
    */

    var options = {
        page: page,
        limit: parseInt(limit),
        sort: sort,
        lean: false,
        populate: [{
            path: 'organization_id',
            select: 'name'
        }]
    }
    Calendar.paginate(query, options, callback);
}

module.exports.getEventDetailsById = function (id, callback) {
    Calendar.findById(id).
        populate({
            path: 'organization_id',
            select: 'name'
        }).
        exec(callback);
}
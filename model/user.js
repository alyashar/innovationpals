const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

const bcrypt = require('bcryptjs');
const fieldEncryption = require('mongoose-field-encryption');
const mongoosePaginate = require('mongoose-paginate');

const Project = require('./project');
const {
    MASTER_ADMIN_ID,
    SUPER_ADMIN_ID,
    ADMIN_ID,
    STUDENT_ID,
    VISITOR_ID
} = require("../constants/roleConst")


// User Schema
const UserSchema = mongoose.Schema({
    project_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' },
    rating_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRating' },
    student_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCategory' },
    task_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],

    name: {
        type: String,
        required: true,
        trim: true
    },

    profile_pic: {
        type: String,
        required: false,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    email_subscription: {
        type: Boolean,
        default: false
    },

    password: {
        type: String,
        required: true,
        trim: true
    },

    certificate: {
        type: Array
    },

    description: {
        type: String,
        trim: true
    },

    age: {
        type: Number,
        trim: true
    },

    dob: {
        type: Date,
        trim: true
    },

    number: {
        type: Number,
        trim: true
    },

    status: {
        type: Boolean,
        default: false
    },

    isUserLoggedInFirstTime: {
        type: Boolean,
        default: true
    },

    address_x: {
        type: String,
        default: "0"
    },

    address_y: {
        type: String,
        default: "0"
    },

    address: {
        type: String,
        default: null
    },

    is_deleted: {
        type: Boolean,
        default: false
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
UserSchema.plugin(mongoosePaginate);

const User = module.exports = mongoose.model('User', UserSchema);
// chack that Email/User_name available or not at the time of registration

module.exports.checkForReg = function(key, value, callback) {
        var query = {
            [key]: value
        };
        User.findOne(query, callback);
    }
    // chack that phon number available or not at the time of registration
module.exports.checkByPhone = function(phone, callback) {
    if (phone == null || !phone.length)
        phone = 0000000000000000000000000000000000000000000000000001;

    const query = { 'phone': phone }
    User.findOne(query, callback);
}

// save registar user
module.exports.addUser = function(newUser, callback) {
    newUser.save(callback);
}

// chack email , password and role for login
module.exports.getForLogin = function(user_name, password, callback) {
    let query = { "email": user_name.toLowerCase() }
    User.findOne(query).
    populate({ path: 'role_id' }).
    exec(callback);
}


// chack old password for change password
module.exports.getUserByIdPassword = function(id, password, callback) {
    const query = { '_id': mongoose.Types.ObjectId(id), 'password': password };
    User.findOne(query).
    populate({ path: 'role_id project_id organization_id rating_id student_category_id' }).
    exec(callback);
}

// chack email for update data
module.exports.checkForUpdateByEmail = function(email, id, callback) {
    const query = { 'email': email, '_id': { $ne: id } };
    User.findOne(query, { password: 0 }, callback);
}

// chack email for update data
module.exports.checkForUpdateByPhone = function(phone, id, callback) {
    if (phone == null || !phone.length)
        phone = 0000000000000000000000000000000000000000000000000001;

    const query = { 'phone': phone, '_id': { $ne: id } };
    User.findOne(query, callback);
}


// get all user data in paginate form
module.exports.getAllUsers = function(page, num_records, search, time, callback) {
    var query = { 'role': 'User' }

    if (time.length && time != 0) {
        var start = new Date();
        if (time == 1) {
            start.setDate(start.getDate() - 1);
            start.setHours(18, 29, 59, 999);
        } else if (time == 2) {

            start.setDate(start.getDate() - 7);
            start.setHours(18, 29, 59, 999);
        }
        var query = {
            'role': 'User',
            'created_at': { '$gte': start }
        }
    }

    if (search != 0 && search.length) {
        if (time.length && time != 0) {
            var start = new Date();
            if (time == 1) {
                start.setDate(start.getDate() - 1);
                start.setHours(18, 29, 59, 999);
            } else if (time == 2) {

                start.setDate(start.getDate() - 7);
                start.setHours(18, 29, 59, 999);
            }
            var query = {
                'role': 'User',
                'name': { $regex: new RegExp(search, 'i') },
                'created_at': { '$gte': start }
            }
        } else {
            query = { 'role': 'User', 'name': { $regex: new RegExp(search, 'i') } }
        }

    }
    User.paginate(query, {
        page: page,
        limit: parseInt(num_records),
        sort: { name: 1 },
        populate: [{ path: 'language_id country_id', select: 'language country' }]
    }, callback);
}

// get loged user data
module.exports.getUserProjectsById = function(id, callback) {
    User.find({ '_id': mongoose.Types.ObjectId(id) })
        .populate({
            path: 'project_id organization_id',
            select: 'project_description project_image project_name organization_id task_id project_number rating_id name',
            populate: {
                path: 'task_id rating_id',
                select: 'planned_hours actual_hours description planned_from planned_to planned_duration actual_from actual_to actual_duration student_id average_rating',
                match: { "student_id": id }
            }
        })
        .populate({
            path: 'project_id',
            select: 'project_description project_image project_name organization_id project_number project_category_id rating_id',
            populate: {
                path: 'project_category_id rating_id',
                select: 'project_category_image name average_rating'
            }
        })

    .exec((err, result) => {
        callback(err, result)
    });
}

module.exports.getUserById = function(id, callback) {
    User.findById({ "_id": id.toString() }, { password: 0 })
        .populate({
            path: 'role_id organization_id'
        })
        .exec(callback);
}

// get loged user data
module.exports.getLoggedUser = function(id, callback) {
    User.findOne({ "_id": mongoose.Types.ObjectId(id) }, { password: 0 }).
    populate({ path: 'role_id' }).
    exec(callback);
}

// get loged user data
module.exports.getnewToken = function(id, callback) {
    User.findOne({ "_id": mongoose.Types.ObjectId(id) }).
    populate({ path: 'role_id' }).
    exec(callback);
}

// Change user status
module.exports.changeUserStatus = function(id, status, callback) {
    var query = { "_id": id }
    User.update(query, status, callback);
}

// chack that user name or email or phpne available or not at the time of registration
module.exports.checkByAnyThing = function(number, value, callback) {
    let query = '';
    if (number == 1) {
        query = { 'user_name': value }
    } else if (number == 2) {
        query = { 'email': value }
    } else {
        if (value == null || !value.length)

            value == 100
        query = { 'phone': value }
    }

    User.findOne(query, callback);
}

// Users (Master Admin, Super Admin, Admin and Student) Dashboard Counts
module.exports.getDashboardCounts = function(role_id, organization_id, callback) {
    if (role_id == MASTER_ADMIN_ID) {
        var counts = Promise.all([
            User.count({ 'is_deleted': false, 'role_id': SUPER_ADMIN_ID }).exec(), // Total Super Admins
            User.count({ 'is_deleted': false, 'role_id': ADMIN_ID }).exec(), // Total Admins
            User.count({ 'is_deleted': false, 'role_id': STUDENT_ID }).exec(), // Total Students
            Project.count().exec() // Total Projects
        ]).then(callback).catch(callback);
    } else if (role_id == SUPER_ADMIN_ID) {
        var counts = Promise.all([
            User.count({ 'is_deleted': false, 'role_id': SUPER_ADMIN_ID }).exec(), // Total Super Admins
            User.count({ 'is_deleted': false, 'role_id': ADMIN_ID }).exec(), // Total Admins
            User.count({ 'is_deleted': false, 'role_id': STUDENT_ID }).exec(), // Total Students
            Project.count({}).exec() // Total Projects
        ]).then(callback).catch(callback);
    } else if (role_id == ADMIN_ID) {
        var counts = Promise.all([
            User.count({ 'is_deleted': false, 'role_id': STUDENT_ID, organization_id }).exec(), // Total Students
            Project.count({ organization_id }).exec() // Total Projects
        ]).then(callback).catch(callback);
    }
}

// All user list for admin
module.exports.getAllUserList = function(page, num_records, role_id, organization_id,
    notInUserArray, isRoleStudent, callback) {
    var query = { role_id }
    if (organization_id) {
        query["organization_id"] = organization_id
    }
    if (notInUserArray && notInUserArray.length) {
        query["_id"] = { "$nin": notInUserArray }
    }
    var options = {
        page: page,
        limit: parseInt(num_records),
        sort: { name: 1 },
        lean: false,
        populate: [{
            path: 'role_id project_id organization_id'
        }]
    }
    if (isRoleStudent) {
        options["populate"] = [{
            path: 'role_id rating_id project_id student_category_id organization_id rating_id'
        }]
    }
    User.paginate(query, options, callback);
}

// All user list for admin
module.exports.getPaginateStudentList = function(page, num_records, role_id, organization_id,
    notInUserArray, isRoleStudent, callback) {
    var query = { role_id }
    if (organization_id) {
        query["organization_id"] = organization_id
    }
    if (notInUserArray && notInUserArray.length) {
        query["_id"] = { "$nin": notInUserArray }
    }
    User
        .aggregate([{
            "$match": {
                role_id
            }
        }])
        .skip((num_records * page) - num_records)
        .limit(num_records)
        .exec(function(err, users) {
            User.populate(users, {
                path: "rating_id project_id"
            }, (err, populatedUsers) => {
                User.count(query).exec(function(err, count) {
                    callback(null, {
                        studentList: populatedUsers,
                        current: page,
                        total: count,
                        pages: Math.ceil(count / num_records)
                    })
                })
            })
        })

}

module.exports.getStudentDetails = function(student_id, role_id, organization_id, callback) {
    User.findOne({ "_id": mongoose.Types.ObjectId(student_id), role_id, organization_id }).
    populate({ path: 'role_id project_id organization_id rating_id.ratings student_category_id' }).
    exec(callback);
};


// All user list for login admin without pagination
module.exports.getAllUserListForLoginAdmin = function(role_id, organization_id, notInUserArray, callback) {
    var query = { role_id, _id: { "$nin": notInUserArray } };
    if (organization_id) {
        query["organization_id"] = organization_id;
    }
    User.find(query, { name: 1, address_x: 1, address_y: 1 })
        .sort({ 'name': 1 }).exec(callback);
}

module.exports.getTeamMembersForOrgChart = function(query, callback) {
    if (query) {
        User.find(query, { 'id': 1, 'name': 1 })
            .exec((err, result) => {
                callback(err, result)
            });
    }
}

// Student list For Admin and Super Admin For MAP Locator
module.exports.getAllRegisteredStudents = function(role_id, organization_id, callback) {
    var query = { role_id };
    if (organization_id) {
        query["organization_id"] = organization_id;
    }
    User.find(query, { name: 1, address_x: 1, address_y: 1 })
        .sort({ 'name': 1 }).exec(callback);
}
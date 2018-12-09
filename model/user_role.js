const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);

// User Role Schema
const UserRoleSchema = mongoose.Schema({

    name: {
      type: String,
      required: true,
      trim: true
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
// OrganizationSchema.plugin(mongooseAutopopulate);

const UserRole = module.exports = mongoose.model('UserRole', UserRoleSchema);

// save registar roles
module.exports.addUserRole = function(newOrganization, callback) {
    newOrganization.save(callback);
}

// get roles data
module.exports.getUserRoleById = function(id, callback) {
    UserRole.findOne({ "_id": mongoose.Types.ObjectId(id) } , callback)
}

// get all roles data
module.exports.getAllUserRoles = function(callback) {
    UserRole.where('name').in(['Admin', 'Super-Admin', 'Student' , 'Visitors']).exec( callback );
}

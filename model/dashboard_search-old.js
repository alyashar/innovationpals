const mongoose = require('mongoose');
const { DATABASE_URL } = require('../constants/appConfig');
mongoose.connect(DATABASE_URL);
const mongoosePaginate = require('mongoose-paginate');
const Project = require('./project');
const User = require('./user');

const {
    SUPER_ADMIN_ID, ADMIN_ID, STUDENT_ID, VISITOR_ID
} = require("../constants/roleConst")


module.exports.getSearchByName = function (name, callback) {

  user_query ={ "name": { $regex: new RegExp(name, 'i') } };  
  project_query ={ "project_name": { $regex: new RegExp(name, 'i') } };  
  User.find(user_query).select('rating_id project_id name dob email organization_id project_id task_id profile_pic')
      .populate({ path:'rating_id', select:'average_rating'})
      .populate({ path: 'task_id organization_id', select: 'actual_hours name' })
      .exec((err1,user)=>{
       
        Project.find(project_query)
        .select('project_name project_number project_category_id project_image rating_id task_id')
        .populate({ path:'rating_id task_id project_category_id', select:'average_rating actual_hours name'}).exec((err,project)=>{
          if(user && user.length){
            user['project'] = project;
             callback(err, user);
          }else if(project && project.length){
            let user = [];
            user['project'] = project;
            callback(err, user);
          }else{
            callback(err, null);
          } 
        })  

  });

}



module.exports.getDashBoardCount = function (organization_id, callback) { 
  user_query = {};
  if(organization_id){
    user_query = { "organization_id" : organization_id.toString() };
  } 
  User.count(user_query).exec((er, users)=>{
    Project.count(user_query).exec((err, projects,)=>{
      User.count({ 'role_id' : VISITOR_ID.toString()}).exec((err, visitors,)=>{
          let result = []; 
          result['users'] = users;
          result['visitors'] = visitors;
          result['projects'] = projects;  
          callback(null, result)
      });
    });
  });
}


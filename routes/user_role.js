const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

const path = require('path')
const fs = require('fs');
const Validation = require('node-input-validator');

const config = JSON.parse(fs.readFileSync("./config/config.json"));
const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const UserRole = require('../model/user_role');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
  next();
});

router.post('/add', Auth.isSuperAdmin, function(req, res) {
  let validator = new Validation({}, req.body, {
    name: 'required|minLength:5',
  });
  validator.check().then(function(matched) {
    if(matched){
      let newUserRole = new UserRole({
          name: req.body.name,
      });
      UserRole.addUserRole(newUserRole, (err, userRole) => {
        if(err || !userRole){
          return res.status(422).json({ success: false });
        }else{
          return res.json({ success: true });
        }
      })
    }else{
      var newErrormsg = Object.keys(validator.errors).map((key, index) => {
        if (index == 0) {
          return validator.errors[key].message
        }
      });
      return res.status(422).json({ success: false, error: newErrormsg[0] || null });
    }
  })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdmin, function(req, res) {
  let validator = new Validation({}, req.body, {
    name: 'required|minLength:5'
  });
  validator.check().then(function(matched) {
    if(matched){
      let newUserRole = {
          name: req.body.name,
      };
      UserRole.getUserRoleById(req.params.id, (err, userRole) => {
        if(err || !userRole){
          return res.status(422).json({ success: false });
        }else{
          let id = req.params.id
          UserRole.updateOne({ _id: ObjectId(id) }, newUserRole, function(err, result) {
            if(err || !result){
              return res.status(422).json({ success: false });
            }else{
              return res.json({ success: true });
            }
          })
        }
      })
    }else{
      var newErrormsg = Object.keys(validator.errors).map((key, index) => {
        if (index == 0) {
          return validator.errors[key].message
        }
      });
      return res.status(422).json({ success: false, error: newErrormsg[0] || null });
    }
  })
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
  if(req.params.id){
    UserRole.getUserRoleById(req.params.id, (err, userRole) => {
      if(err || !userRole){
        return res.status(422).json({ success: false });
      }else{
        return res.json({ success: true,userRole });
      }
    })
  }else{
    return res.status(422).json({ success: false });
  }
});

router.get('/list', function(req, res) {
  UserRole.getAllUserRoles((err, userRoles) => {
    if(err || !userRoles){
      return res.status(422).json({ success: false });
    }else{
      return res.json({ success: true,userRoles });
    }
  })
});

module.exports = router;

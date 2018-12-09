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
const Event = require('../model/events');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
  next();
});

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateEventAddForm, function(req, res) {
  let newEvent = new Event({
    description: req.body.description,
    name: req.body.name,
    start_date: new Date(req.body.start_date),
    end_date: new Date(req.body.end_date)
  });
  Event.addEvent(newEvent, (err, event) => {
    if(err || !event){
      return res.status(422).json({ success: false });
    }else{
      return res.json({ success: true });
    }
  })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateEventAddForm, function(req, res) {
  let newEvent = {
    description: req.body.description,
    name: req.body.name,
    start_date: new Date(req.body.start_date),
    end_date: new Date(req.body.end_date)
  };
  Event.getEventById(req.params.id, (err, event) => {
    if(err){
      return res.status(422).json({ success: false });
    }else if(!event){
      return res.status(422).json({ success: false });
    }else{
      let id = req.params.id
      Event.updateOne({ _id: ObjectId(id) }, newEvent, function(err, result) {
        if(err || !result){
          return res.status(422).json({ success: false });
        }else{
          return res.json({ success: true });
        }
      })
    }
  })
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
  if(req.params.id){
    Event.getEventById(req.params.id, (err, event) => {
      if(err){
        return res.status(422).json({ success: false });
      }else if(!event){
        return res.status(422).json({ success: false });
      }else{
        return res.json({ success: true,event });
      }
    })
  }else{
    return res.status(422).json({ success: false });
  }
});

router.get('/list', function(req, res) {
  Event.getAllEvent((err, event) => {
    if(err){
      return res.status(422).json({ success: false });
    }else if(!event){
      return res.status(422).json({ success: false });
    }else{
      return res.json({ success: true,event });
    }
  })
});

module.exports = router;

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
const DiscussionBoard = require('../model/discussion_board');
const Project = require('../model/project');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function (req, res, next) {
  next();
});

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateDiscussionBoardAddForm, function (req, res) {
  Project.findById(ObjectId(req.body.project_id), (error, project) => {
    if (error) {
      return res.status(422).json({ success: false, error });
    } else if (!project) {
      return res.status(422).json({ success: false, error: msg.ProjectNotFound });
    } else {
      let organization_id = req.body.organization_id;
      let newDiscussionBoard = new DiscussionBoard({
        organization_id: ObjectId(organization_id),
        project_id: ObjectId(req.body.project_id),
        created_by_id: ObjectId(req.authData._id),
        title: req.body.title,
        description : req.body.description
      });
      DiscussionBoard.addDiscussionBoard(newDiscussionBoard, (err, discussionBoard) => {
        if (err || !discussionBoard) {
          return res.status(422).json({ success: false, error: err });
        } else {
          return res.json({ success: true, discussionBoard, message:msg.DiscussionSaved });
        }
      })
    }
  })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateDiscussionBoardUpdateForm, function (req, res) {
  let id = req.params.id
  DiscussionBoard.getDiscussionBoardById(id, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false, error: err });
    } else if (!discussionBoard) {
      return res.status(404).json({ success: false, error: msg.DiscussionBoardNotFound });
    } else {
      let newDiscussionBoard = {
        title: req.body.title,
        description: req.body.description
      };
      DiscussionBoard.updateOne({ _id: ObjectId(id) }, newDiscussionBoard, function (err, result) {
        if (err || !result) {
          return res.status(422).json({ success: false, error:err });
        } else {
          return res.json({ success: true, message: msg.DiscussionUpdated  });
        }
      })
    }
  })
});

router.put('/update-status/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateThreadStatus, function (req, res) {
  let id = req.params.id
  DiscussionBoard.getDiscussionBoardById(id, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false, error: err });
    } else if (!discussionBoard) {
      return res.status(404).json({ success: false, error: msg.DiscussionBoardNotFound });
    } else {
      let newDiscussionBoard = {
        status: 0,
        closed_date: req.body.closed_date,
        reason : req.body.reason
      };
      DiscussionBoard.updateOne({ _id: ObjectId(id) }, newDiscussionBoard, function (err, result) {
        if (err || !result) {
          return res.status(422).json({ success: false, error:err });
        } else {
          return res.json({ success: true, message:msg.DiscussionCancelled });
        }
      })
    }
  })
});

/*router.delete('/delete/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, function (req, res) {
  DiscussionBoard.getDiscussionBoardById(req.params.id, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false, error: err });
    } else if (!discussionBoard) {
      return res.status(404).json({ success: false, error: msg.DiscussionBoardNotFound });
    } else {
      DiscussionBoard.remove({ _id: ObjectId(id) }, function (err, result) {
        if (err || !result) {
          return res.status(422).json({ success: false });
        } else {
          return res.json({ success: true });
        }
      })
    }
  })
});*/

router.get('/select/:id', objectIdErrorHandlerMiddleware, function (req, res) {
  DiscussionBoard.getDiscussionBoardById(req.params.id, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false });
    } else if (!discussionBoard) {
      return res.status(422).json({ success: false });
    } else {
      return res.json({ success: true, discussionBoard });
    }
  })
});

router.get('/list', function (req, res) {
  let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
  let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
  let organization_id = req.authData.organization_id;
  DiscussionBoard.getAllDiscussionBoardList(organization_id, page, limit, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false });
    } else if (!discussionBoard) {
      return res.status(422).json({ success: false });
    } else {
      return res.json({ success: true, discussionBoard });
    }
  })
});

router.get('/list/:project_id', function (req, res) {
  let page = (req.query.page != undefined && req.query.page != '' && req.query.page != 0) ? req.query.page : 0;
  let limit = (req.query.limit != undefined && req.query.limit != '' && req.query.limit != 0) ? req.query.limit : 0;
  let organization_id = req.authData.organization_id;
  DiscussionBoard.getProjectDiscussionBoardList(organization_id, page, limit, req.params.project_id, (err, discussionBoard) => {
    if (err) {
      return res.status(422).json({ success: false });
    } else if (!discussionBoard) {
      return res.status(422).json({ success: false });
    } else {
      return res.json({ success: true, discussionBoard });
    }
  })
});

module.exports = router;

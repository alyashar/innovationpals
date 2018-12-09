const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const ValidationUtility = require('../utility/validations')

const msg = JSON.parse(fs.readFileSync("./config/msg_error.json"));
const Auth = require('../auth/index');
const Log = require('../manage-log');
const StudentCategory = require('../model/student_category');
const StudentSubCategory = require('../model/student_category_sub');

const objectIdErrorHandlerMiddleware = require('../utility/objectIdErrorHandler')
router.use(function(req, res, next) {
    next();
});

router.post('/add', Auth.isSuperAdminOrAdmin, ValidationUtility.validateStudentSubCategoryAddForm, function(req, res) {
    let newStudentSubCategory = new StudentSubCategory({
        name: req.body.name,
        student_category_id: ObjectId(req.body.student_category_id)
    });
    StudentSubCategory.addStudentSubCategory(newStudentSubCategory, (err, studentSubCategory) => {
        if (err || !studentSubCategory) {
            return res.status(422).json({ success: false });
        } else {
            StudentCategory.updateOne({ "_id": studentSubCategory.student_category_id }, { $push: { student_category_sub_id: studentSubCategory._id } },
                function(err, up) {

                });
            return res.json({ success: true });
        }
    })
});

router.put('/update/:id', objectIdErrorHandlerMiddleware, Auth.isSuperAdminOrAdmin, ValidationUtility.validateStudentSubCategoryAddForm, function(req, res) {
    let newStudentSubCategory = {
        name: req.body.name,
        student_category_id: ObjectId(req.body.student_category_id)
    };
    StudentSubCategory.getStudentSubCategoryById(req.params.id, (err, studentSubCategory) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!studentSubCategory) {
            return res.status(422).json({ success: false });
        } else {
            let id = req.body.id
            StudentSubCategory.updateOne({ _id: ObjectId(id) }, newStudentSubCategory, function(err, result) {
                if (err || !result) {
                    return res.status(422).json({ success: false });
                } else {
                    return res.json({ success: true });
                }
            })
        }
    })
});

router.get('/select/:id', objectIdErrorHandlerMiddleware, function(req, res) {
    if (req.params.id) {
        StudentSubCategory.getAllStudentSubCategoryById(req.params.id, (err, studentSubCategory) => {
            if (err) {
                return res.status(422).json({ success: false });
            } else if (!studentSubCategory) {
                return res.status(422).json({ success: false });
            } else {
                return res.json({ success: true, studentSubCategory });
            }
        })
    } else {
        return res.status(422).json({ success: false });
    }
});

router.get('/list', function(req, res) {
    StudentSubCategory.getAllStudentSubCategory((err, studentSubCategory) => {
        if (err) {
            return res.status(422).json({ success: false });
        } else if (!studentSubCategory) {
            return res.status(422).json({ success: false });
        } else {
            return res.json({ success: true, studentSubCategory });
        }
    })
});

module.exports = router;
const Validation = require('node-input-validator');

// Validation Rule for ProjectForm
module.exports.validateProjectForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        project_description: 'required',
        project_name: 'required',
        project_number: 'required',
        project_category_id: 'required',
        project_manager_id: 'required|array',
        organization_id: req.isUserMasterAdmin ? 'required' : 'string'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for LoginForm
module.exports.validateLoginForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        email: 'required|email',
        password: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for RegiserSuperAdminForm
module.exports.validateRegisterSuperAdminForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        email: 'required|email',
        name: 'required|minLength:5',
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateRegisterAdminForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        email: 'required|email',
        name: 'required|minLength:5',
        organization_id: req.isUserMasterAdmin ? "required" : "string"
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for UserRegiserationForm
module.exports.validateUserRegisterationForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        email: 'required|email',
        name: 'required',
        number: "required"
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for UserRegiserationForm
module.exports.validateUserRegisterationFormForVisitor = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        email: 'required|email',
        name: 'required|minLength:5',
        number: "required",
        dob: "required",
        age: "required",
        profile_pic: "required",
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}


// Validation Rule for UserRegiserationForm
module.exports.validateUserRegisterationUpdateForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        number: "required",
        dob: "required",
        description: "required",
        certificate: "required",
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for ChangePasswordForm
module.exports.validateChangePasswordForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        old_password: 'required',
        new_password: 'required|minLength:5',
        c_password: 'required|same:new_password',
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for ActivityAddForm
module.exports.validateActivityAddForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        description: 'required',
        activity_title: 'required',
        project_id: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for CommentsAddForm
module.exports.validateDiscussionBoardAddForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        project_id: 'required',
        organization_id: req.isUserMasterAdmin ? 'required' : 'string',
        title: 'required|String'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for DiscussionBoardAddForm
module.exports.validateDiscussionBoardUpdateForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        title: 'required',
        description: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for thread comment
module.exports.validateCommentsAddForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        discussionBoard_id: 'required',
        message: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateThreadStatus = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        closed_date: 'required',
        reason: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for StudentSubCategoryAddForm
module.exports.validateStudentSubCategoryAddForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        name: 'required|minLength:5',
        student_category_id: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for TaskAddForm
module.exports.validateTaskAddForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        description: 'required',
        planned_from: 'required',
        planned_duration: 'required',
        project_id: 'required',
        activity_id: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for EventAddForm
module.exports.validateEventAddForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        description: 'String',
        name: 'required|String',
        start_date: 'required',
        end_date: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for UserProjectForm
module.exports.validateUserProjectForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        user_id: 'required|array',
        project_id: 'required',
        reporting_to_user_id: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Validation Rule for RatingAddForm
module.exports.validateRatingAddForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        user_id: 'required',
        rating: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateProjectRatingForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        project_id: 'required',
        rating: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateprojectRiskAddForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        risk_title: 'required',
        description: "required",
        identified_date: "required",
        probability: "required",
        impact: "required",
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateNewsAddForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        message: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

module.exports.validateCalendarAddForm = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        title: 'required',
        message: 'required',
        event_date: 'required'
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}

// Extract First Error Message
function getFirstErrorMessage(validator) {
    return Object.keys(validator.errors).map((key, index) => {
        if (index == 0) {
            return validator.errors[key].message
        }
    });
}



module.exports.validateTransactionForm = function(req, res, next) {

    let validator = new Validation({}, req.body, {
        project_id: 'required',
        status: 'required',
        transaction_id: 'required',
        transaction_detail: 'required',
        donation_amount: 'required',
        // organization_id: 'required' 
    });

    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })
}

// Validation Rule for Subscription
module.exports.validateSubscription = function(req, res, next) {
    let validator = new Validation({}, req.body, {
        email: 'required|email'
    });
    validator.check().then(function(matched) {
        if (matched) {
            next()
        } else {
            var newErrormsg = getFirstErrorMessage(validator)
            return res.status(422).json({ success: false, error: newErrormsg[0] || null });
        }
    })

}
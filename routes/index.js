const express = require('express');
const router = express.Router();
const Auth = require('../auth/index');

const user = require('./user');
const organization = require('./organization');
const user_role = require('./user_role');
const student_category = require('./student_category');
const project_category = require('./project_category');
const project = require('./project');
const student_category_sub = require('./student_category_sub');
const task = require('./task');
const activity = require('./activity');
const comment = require('./comments');
const discussion_board = require('./discussion_board');
const events = require('./events');
const user_rating = require('./user_rating');
const project_rating = require('./project_rating');
const project_risk = require('./project_risk');
const news = require('./news');
const calendar = require('./calendar');
const project_risk_priority = require('./project_risk_priority');
const project_risk_type = require('./project_risk_type');
const all_project_category = require('./all_project_category');
const all_student_category = require('./all_student_category');
const project_risk_type_data = require('./project_risk_type_data');

const project_risk_priority_data = require('./project_risk_priority_data');
const risk_type_data = require('./risk_type_data');

const deliverables = require('./deliverables');

const project_roles = require('./project_roles');
const project_roles_data = require('./project_roles_data');

const team_members = require('./team_members');
const DashboardSearch = require('./dashboard_search');

const Donation = require('./donation');
const PaypalSetting = require('./paypal_setting');

const SMTPSetting = require('./smtp_setting');

flag = false;

let {
    verifyToken,
    isTokenValid,
    isUserValidByRole,
    isActive,
    isDeleted,
    isUserOrganizationValid
} = Auth

router.use(verifyToken, isTokenValid, isUserValidByRole,
    isActive, isDeleted,
    function(req, res, next) {
        req.requestTime = Date.now()
        flag = req.authData.organization_id ? true : false
        next()
    })

if (flag) {
    router.use(isUserOrganizationValid, function(req, res, next) {
        req.requestTime = Date.now()
        next()
    });
}
router.use('/user', user);
router.use('/organization', organization);
router.use('/user-role', user_role);
router.use('/project', project);
router.use('/project-category', project_category);
router.use('/student-category', student_category);
router.use('/student-category-sub', student_category_sub);
router.use('/task', task);
router.use('/activity', activity);
router.use('/comment', comment);
router.use('/discussion-board', discussion_board);
router.use('/events', events);
router.use('/user-rating', user_rating);

// It will associated with a project
router.use('/project-risk', project_risk);
router.use('/news', news);
router.use('/calendar', calendar);
router.use('/project-rating', project_rating);

router.use('/project-risk-priority', project_risk_priority);
router.use('/risk-priority-data', project_risk_priority_data);

// It will be an independent entity
router.use('/project-risk-type', project_risk_type);
router.use('/risk-type-data', risk_type_data);

router.use('/project-risk-type-data', project_risk_type_data);

router.use('/all-project-category', all_project_category);
router.use('/all-student-category', all_student_category);

router.use('/deliverables', deliverables);

router.use('/project-roles', project_roles);
router.use('/project-roles-data', project_roles_data);
router.use('/team-member', team_members);
router.use('/dashboard-search', DashboardSearch);

router.use('/donation', Donation);
router.use('/paypal-setting', PaypalSetting);

router.use('/smtp-setting', SMTPSetting);

module.exports = router;
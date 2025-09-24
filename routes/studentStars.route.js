const express = require('express');
const router = express.Router();
const StudentStarsController = require('../controllers/StudentStars.controller');
const jwtMiddleware = require("../middlewares/Auth.middleware.js");

router.get(
    '/students/:kid_student_id/learning-paths/:learning_path_id/stars',
    [jwtMiddleware],
    StudentStarsController.getStarsByLearningPathCategories
);

module.exports = router;

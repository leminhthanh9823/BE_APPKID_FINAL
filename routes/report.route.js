const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/report.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

router.get("/student-report", jwtMiddleware, adminOrTeacher, ReportController.getStudentReport);

module.exports = router;

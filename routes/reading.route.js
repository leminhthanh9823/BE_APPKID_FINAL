const express = require("express");
const router = express.Router();
const readingController = require("../controllers/reading.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { teacherOrParent } = require("../middlewares/Role.middleware.js");

router.get(
  "/common-infor",
  jwtMiddleware,
  teacherOrParent,
  readingController.getCommonInfor
);
router.get(
  "/list-readings",
  jwtMiddleware,
  teacherOrParent,
  readingController.getReadingList
);
router.get(
  "/get-question/:kid_reading_id",
  jwtMiddleware,
  teacherOrParent,
  readingController.getQuestionList
);

module.exports = router;

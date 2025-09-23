const express = require("express");
const router = express.Router();
const controller = require("../controllers/StudentReading.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");

router.get(
  "/score/:kid_student_id/:kid_reading_id",
  jwtMiddleware,
  controller.getScoreByStudentAndReading
);
router.post("/report", jwtMiddleware, controller.getReportByStudent);
//app
router.post("/create", jwtMiddleware, controller.createStudentReading);
//cms
router.post("/history-reading", jwtMiddleware, controller.getHistoryReading);
router.get("/leaderboard", jwtMiddleware, controller.getLeaderBoard);

router.get(
  "/:student_id/statistics",
  jwtMiddleware,
  controller.getStudentStatistics
);
router.get(
  "/:student_id/history",
  jwtMiddleware,
  controller.getStudentLearningHistory
);

router.post("/game-result", jwtMiddleware, controller.saveGameResult);

module.exports = router;
const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");
const {
  getDashboardSummary,
  getMonthlyUsers,
  getTopUsersByScore,
  getTopUsersByPassCount,
} = require("../controllers/Dashboard.controller");

router.get("/summary", jwtMiddleware, adminOrTeacher, getDashboardSummary);
router.get("/users-monthly", jwtMiddleware, adminOrTeacher, getMonthlyUsers);
router.get(
  "/leaderboard/score",
  jwtMiddleware,
  adminOrTeacher,
  getTopUsersByScore
);
router.get(
  "/leaderboard/pass",
  jwtMiddleware,
  adminOrTeacher,
  getTopUsersByPassCount
);

module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../controllers/StudentAdvice.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { teacherOrParent } = require("../middlewares/Role.middleware.js");

// Lời khuyên theo tuần
router.get(
  "/weekly/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getWeeklyAdvice
);

// Lời khuyên theo tháng
router.get(
  "/monthly/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getMonthlyAdvice
);

// Lời khuyên theo năm
router.get(
  "/yearly/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getYearlyAdvice
);

// Lời khuyên theo khoảng thời gian tùy chỉnh
router.post(
  "/custom/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getCustomAdvice
);

// Lời khuyên ngắn gọn (cho dashboard, notification)
router.get(
  "/short/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getShortAdvice
);

// Lịch sử lời khuyên (tính năng mở rộng)
router.get(
  "/history/:kid_student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getAdviceHistory
);

module.exports = router;

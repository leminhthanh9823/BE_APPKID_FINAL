const express = require("express");
const router = express.Router();
const learningPathController = require("../controllers/LearningPath.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const fileMiddleware = require("../middlewares/File.middleware.js");
const { teacherOnly } = require("../middlewares/Role.middleware.js");

// ============= ADMIN ROUTES =============

/**
 * Nghiệp vụ 1: Quản lý danh sách lộ trình (Teacher)
 */
// POST /cms/learning-paths - Lấy danh sách lộ trình với search/filter/sort/pagination
router.post("/cms/list", 
  // jwtMiddleware, 
  // teacherOnly,
  learningPathController.getAllLearningPaths
);

// PUT /cms/learning-paths/:id/update-status - Cập nhật trạng thái active/inactive
router.put(
  "/cms/:id/update-status",
  learningPathController.toggleStatus
);

module.exports = router;
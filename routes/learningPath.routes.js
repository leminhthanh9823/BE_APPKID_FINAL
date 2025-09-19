const express = require("express");
const router = express.Router();
const learningPathController = require("../controllers/LearningPath.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const fileMiddleware = require("../middlewares/File.middleware.js");
const { teacherOnly } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");
const learningPathUpload = upload.fields([
  { name: "image", maxCount: 1 },
]);

// ============= ADMIN ROUTES =============

/**
 * Nghiệp vụ 1: Quản lý danh sách lộ trình (Teacher)
 */
// POST /cms/learning-paths - Lấy danh sách lộ trình với search/filter/sort/pagination
router.post("/cms/all", 
  // jwtMiddleware, 
  // teacherOnly,
  learningPathController.getAllLearningPaths
);

// POST /create - Tạo mới learning path với image upload
router.post("/create", 
  learningPathUpload,
  learningPathController.createLearningPath
);

// PUT /:id/update-status - Cập nhật trạng thái active/inactive (specific route first)
router.put(
  "/:id/update-status",
  learningPathController.toggleStatus
);

// PUT /:id - Cập nhật learning path với image upload tùy chọn (general route after)
router.put("/edit/:id", 
  learningPathUpload,
  learningPathController.updateLearningPath
);

module.exports = router;
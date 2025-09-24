const express = require("express");
const router = express.Router();
const learningPathController = require("../controllers/LearningPath.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const fileMiddleware = require("../middlewares/File.middleware.js");
const { teacherOnly } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");
const learningPathUpload = upload.fields([{ name: "image", maxCount: 1 }]);

// ============= ADMIN ROUTES =============

/**
 * Nghiệp vụ 1: Quản lý danh sách lộ trình (Teacher)
 */
// POST /cms/learning-paths - Lấy danh sách lộ trình với search/filter/sort/pagination
router.post(
  "/cms/all",
  jwtMiddleware,
  teacherOnly,
  learningPathController.getAllLearningPaths
);

// POST /create - Tạo mới learning path với image upload
router.post(
  "/create",
  jwtMiddleware,
  teacherOnly,
  learningPathUpload,
  learningPathController.createLearningPath
);

// PUT /:id/update-status - Cập nhật trạng thái active/inactive (specific route first)
router.put(
  "/:id/update-status",
  jwtMiddleware,
  teacherOnly,
  learningPathController.toggleStatus
);

// PUT /:id - Cập nhật learning path với image upload tùy chọn (general route after)
router.put(
  "/edit/:id",
  jwtMiddleware,
  teacherOnly,
  learningPathUpload,
  learningPathController.updateLearningPath
);

/**
 * Nghiệp vụ 2: Quản lý items trong learning path (UC_LP04)
 */
// POST /:id/items - Lấy danh sách items trong learning path
router.post(
  "/:id/items",
  jwtMiddleware,
  teacherOnly,
  learningPathController.getItemsInLearningPath
);

// POST /:pathId/add-readings - Thêm readings vào learning path
router.post(
  "/:id/add-readings",
  jwtMiddleware,
  teacherOnly,
  learningPathController.addReadingsToLearningPath
);

// PUT /:id/categories/reorder - Sắp xếp lại thứ tự categories
router.put(
  "/:id/categories/reorder",
  jwtMiddleware,
  teacherOnly,
  learningPathController.reorderCategories
);

// PUT /:pathId/categories/:categoryId/items/reorder - Sắp xếp lại thứ tự items trong category
router.put(
  "/:pathId/categories/:categoryId/items/reorder",
  jwtMiddleware,
  teacherOnly,
  learningPathController.reorderItemsInCategory
);

// DELETE /:pathId/readings/:readingId - Xóa reading khỏi learning path
router.delete(
  "/:pathId/reading/:readingId",
  jwtMiddleware,
  teacherOnly,
  learningPathController.deleteReadingFromPath
);

// DELETE /:pathId/games/:gameId - Xóa game khỏi learning path
router.delete(
  "/:pathId/game/:gameId",
  jwtMiddleware,
  teacherOnly,
  learningPathController.deleteGameFromPath
);

// mobile: GET /mobile/list - Lấy danh sách learning path cho mobile
router.get(
  "/mobile/list-learning-paths",
  jwtMiddleware,
  learningPathController.getLearningPathsForMobile
);

// mobile: GET /:pathId/:student-id/items - Lấy danh sách items trong learning path cho học sinh
router.get(
  "/mobile/:pathId/:studentId/items",
  learningPathController.getItemsInLearningPathForMobile
);

// cms
router.get(
  "/category/:pathCategoryId/items",
  jwtMiddleware,
  teacherOnly,
  learningPathController.getItemsByCategoryIdInLearningPath
);

// cms
router.post(
  '/:pathId/:pathCategoryId/:readingId/add-games',
  jwtMiddleware,
  teacherOnly,
  learningPathController.addGamesToLearningPath
);

module.exports = router;
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

/**
 * Nghiệp vụ 2: Quản lý items trong learning path (UC_LP04)
 */
// POST /:id/items - Lấy danh sách items trong learning path
router.post("/:id/items", 
  learningPathController.getItemsInLearningPath
);

// mobile: GET /:pathId/categories - Lấy danh sách categories có trong learning path
router.get("/mobile/:pathId/categories",
  learningPathController.getCategoriesInLearningPath
);

// mobile: GET /:pathId/categories/:categoryId/items - Lấy danh sách items trong category cụ thể
router.get("/mobile/:pathId/categories/:categoryId/:studentId/items",
  learningPathController.getItemsInCategory
);

// POST /:pathId/add-items - Thêm readings vào learning path
router.post("/:id/add-items",
  learningPathController.addItemsToLearningPath
);

// PUT /:id/categories/reorder - Sắp xếp lại thứ tự categories
router.put("/:id/categories/reorder",
  learningPathController.reorderCategories
);

// PUT /:pathId/categories/:categoryId/items/reorder - Sắp xếp lại thứ tự items trong category
router.put("/:pathId/categories/:categoryId/items/reorder",
  learningPathController.reorderItemsInCategory
);

// DELETE /:pathId/readings/:readingId - Xóa reading khỏi learning path
router.delete("/:pathId/readings/:readingId",
  learningPathController.deleteReadingFromPath
);

// DELETE /:pathId/games/:gameId - Xóa game khỏi learning path  
router.delete("/:pathId/games/:gameId",
  learningPathController.deleteGameFromPath
);

module.exports = router;
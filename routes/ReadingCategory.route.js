const express = require("express");
const router = express.Router();
const controller = require("../controllers/ReadingCategory.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const upload = require("../middlewares/File.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

router.post("/all", jwtMiddleware, controller.getReadingCategories);
router.post("/stats", jwtMiddleware, adminOrTeacher, controller.getReadingCategoriesWithStats);
router.get("/get-list-no-filter",  controller.getReadingCategoriesNoFilter);
router.get("/:id", jwtMiddleware, controller.getReadingCategoryById);
// router.post(
//   "/grade/:grade_id",
//   jwtMiddleware,
//   controller.getReadingCategoryByGrade
// );
router.post(
  "/create",
  jwtMiddleware,
  adminOrTeacher,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.createReadingCategory
);
router.put(
  "/edit/:id",
  jwtMiddleware,
  adminOrTeacher,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.updateReadingCategory
);
router.delete("/delete/:id", jwtMiddleware, adminOrTeacher, controller.deleteReadingCategory);
router.put("/:id/update-status", jwtMiddleware, adminOrTeacher, controller.toggleStatus);

module.exports = router;

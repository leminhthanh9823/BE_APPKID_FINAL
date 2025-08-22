const express = require("express");
const router = express.Router();
const controller = require("../controllers/EBook.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const {
  adminOnly,
  teacherOnly,
  adminOrTeacher,
  teacherOrParent,
} = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");

const ebookFileUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "background", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

router.post("/all", jwtMiddleware, teacherOrParent, controller.getAll);
router.post(
  "/category/:category_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getByCategory
);
router.post(
  "/student-M/:student_id",
  jwtMiddleware,
  controller.getByStudentM
);
router.get(
  "/category-&-student-M/:category_id/:student_id",
  jwtMiddleware,
  teacherOrParent,
  controller.getByCategoryAndStudentM
);
router.get("/:id", jwtMiddleware, teacherOrParent, controller.getById);

router.post(
  "/create",
  ebookFileUpload,
  jwtMiddleware,
  teacherOnly,
  controller.create
);
router.put(
  "/edit/:id",
  ebookFileUpload,
  jwtMiddleware,
  teacherOnly,
  controller.update
);
router.put(
  "/:id/update-status",
  jwtMiddleware,
  adminOrTeacher,
  controller.toggleStatus
);

module.exports = router;

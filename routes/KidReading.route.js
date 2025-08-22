const express = require("express");
const router = express.Router();
const controller = require("../controllers/KidReading.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const upload = require("../middlewares/File.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

const readingFileUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// app get list reading for feedback
router.get(
  "/getListReading",
  jwtMiddleware,
  controller.getListReading
);

router.post("/all", jwtMiddleware, controller.getAll);
router.get("/:id", jwtMiddleware, controller.getById);
router.get("/grade/:grade_id", jwtMiddleware, controller.getByGrade);

router.post("/", jwtMiddleware, readingFileUpload, controller.createKidReading);
router.put(
  "/edit/:id",
  jwtMiddleware,
  readingFileUpload,
  adminOrTeacher,
  controller.updateKidReading
);
router.put("/:id/update-status", jwtMiddleware, adminOrTeacher, controller.toggleStatus);
router.post(
  "/create",
  jwtMiddleware,
  adminOrTeacher,
  readingFileUpload,
  controller.createKidReading
);
router.delete("/delete/:id", jwtMiddleware, adminOrTeacher, controller.deleteKidReading);
router.post(
  "/category/:category_id",
  jwtMiddleware,
  controller.getKidReadingByCategory
);
router.post(
  "/getByCateAndStudent",
  jwtMiddleware,
  controller.getByCategoryAndStudentId
);
module.exports = router;

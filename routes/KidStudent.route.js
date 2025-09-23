const express = require("express");
const router = express.Router();
const controller = require("../controllers/KidStudent.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");

router.post("/all", jwtMiddleware, controller.getAll);
router.get("/:id", jwtMiddleware, controller.getById);
router.get("/user/:user_id", jwtMiddleware, controller.getByUserId);
router.get("/grade/:grade_id", controller.getByGrade);
router.get("/parent/:kid_parent_id", jwtMiddleware, controller.getByParentId);
router.get("/parent-M/:kid_parent_id", controller.getByParentIdM);
router.post(
  "/parent/create-child",
  jwtMiddleware,
  controller.parentCreateChild
);
router.post(
  "/parent/update-child/:id",
  upload.single("image"),
  jwtMiddleware,
  controller.parentUpdateChild
);

//cms
router.post("/students-parents", jwtMiddleware, controller.getStudentsParents);
router.put("/:id/update-status", jwtMiddleware, adminOrTeacher, controller.toggleStatus);

module.exports = router;

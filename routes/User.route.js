const express = require("express");
const router = express.Router();
const controller = require("../controllers/User.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const {
  adminOnly,
  adminOrTeacher,
} = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");

router.post("/all", jwtMiddleware, adminOnly, controller.getAll);
router.get("/:id", jwtMiddleware, adminOrTeacher, controller.getById);
router.post(
  "/create",
  upload.single("image"),
  jwtMiddleware,
  adminOnly,
  controller.create
);
router.get("/edit/:id", jwtMiddleware, controller.show);
router.put(
  "/edit/:id",
  upload.single("image"),
  jwtMiddleware,
  controller.update
);
router.put(
  "/edit-m/:id",
  upload.single("image"),
  jwtMiddleware,
  controller.update
);

router.delete("/delete/:id", jwtMiddleware, adminOnly, controller.remove);
router.put(
  "/:id/update-status",
  jwtMiddleware,
  adminOnly,
  controller.toggleStatus
);

router.post(
  "/teachers",
  jwtMiddleware,
  adminOrTeacher,
  controller.getAllTeacher
);

module.exports = router;

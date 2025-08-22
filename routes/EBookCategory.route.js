const express = require("express");
const router = express.Router();
const controller = require("../controllers/EBookCategory.controller");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const upload = require("../middlewares/File.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");
router.post("/all", jwtMiddleware, controller.getAll);
router.post("/stats", jwtMiddleware, adminOrTeacher, controller.getEBookCategoriesWithStats);
router.get("/all-M", jwtMiddleware, controller.getAllM);
router.get("/:id", jwtMiddleware, controller.getById);
router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  jwtMiddleware,
  adminOrTeacher,
  controller.create
);

router.put(
  "/edit/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  jwtMiddleware,
  adminOrTeacher,
  controller.update
);
router.put("/:id/update-status", jwtMiddleware, adminOrTeacher, controller.toggleStatus);
router.delete("/delete/:id", jwtMiddleware, adminOrTeacher, controller.remove);

module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../controllers/Notify.controller.js");
const jwtMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

router.post("/cms/all", jwtMiddleware, controller.getAll);
router.post("/cms/create", jwtMiddleware, adminOrTeacher, controller.create);
router.post("/cms/get-by-id", jwtMiddleware, controller.getById);
router.put("/cms/update-by-id", jwtMiddleware, adminOrTeacher, controller.updateById);
router.post("/app/get-by-parent", controller.getByParent);
router.put("/:id/update-status", jwtMiddleware,adminOrTeacher, controller.updateStatus);

module.exports = router;

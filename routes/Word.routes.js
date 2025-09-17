import { Router } from "express";
import controller from "../controllers/Word.controller.js";
const jwtMiddleware = require("../middlewares/Auth.middleware.js");

const router = Router();
const {
  adminOrTeacher,
} = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");

const wordFileUpload = upload.fields([
  { name: "image", maxCount: 1 },
]);
router.post("/", wordFileUpload, jwtMiddleware, adminOrTeacher, controller.create);
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.put("/:id", wordFileUpload, jwtMiddleware, adminOrTeacher, controller.update);
router.delete("/:id", controller.delete);

export default router;
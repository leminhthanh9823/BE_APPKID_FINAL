const express = require("express");
const router = express.Router();
const wordController = require("../controllers/Word.controller.js");
const authMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOnly } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware.js");

const wordFileUpload = upload.fields([
  { name: "image", maxCount: 1 },
]);

router.post("/", 
  wordFileUpload,
  authMiddleware, 
  adminOnly, 
  wordController.create
);

router.get("/", 
  authMiddleware, 
  adminOnly, 
  wordController.list
);

router.get("/:id", 
  authMiddleware, 
  adminOnly, 
  wordController.detail
);

router.put("/:id", 
  wordFileUpload,
  authMiddleware, 
  adminOnly, 
  wordController.update
);

router.delete("/:id", 
  authMiddleware, 
  adminOnly, 
  wordController.delete
);

router.patch("/:id/toggle-status", 
  authMiddleware, 
  adminOnly, 
  wordController.toggleStatus
);

router.get("/level/:level", 
  authMiddleware, 
  adminOnly, 
  wordController.getByLevel
);

router.get("/type/:type", 
  authMiddleware, 
  adminOnly, 
  wordController.getByType
);

module.exports = router;
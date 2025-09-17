const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");
const authMiddleware = require("../middlewares/Auth.middleware.js");
const { adminOnly } = require("../middlewares/Role.middleware.js");

router.post("/", 
  authMiddleware, 
  adminOnly, 
  gameController.create
);

router.get("/", 
  authMiddleware, 
  adminOnly, 
  gameController.list
);

router.get("/:id", 
  authMiddleware, 
  adminOnly, 
  gameController.detail
);

router.put("/:id", 
  authMiddleware, 
  adminOnly, 
  gameController.update
);

router.delete("/:id", 
  authMiddleware, 
  adminOnly, 
  gameController.delete
);

router.patch("/:id/toggle-status", 
  authMiddleware, 
  adminOnly, 
  gameController.toggleStatus
);

router.get("/type/:type", 
  authMiddleware, 
  adminOnly, 
  gameController.getByType
);

module.exports = router;

const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");

router.post("/", gameController.create);
router.get("/", gameController.list);
router.get("/:id", gameController.detail);
router.put("/:id", gameController.update);
router.delete("/:id", gameController.delete);

module.exports = router;

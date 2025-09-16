const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");

// CRUD
router.post("/", gameController.createGame);
router.get("/", gameController.getAllGames);
router.get("/:id", gameController.getGameById);
router.put("/:id", gameController.updateGame);
router.delete("/:id", gameController.deleteGame);

module.exports = router;

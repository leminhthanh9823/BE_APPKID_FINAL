const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");
const authMiddleware = require("../middlewares/Auth.middleware.js");
const { teacherOnly, teacherOnlyFast } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware");

router.post('/teacher/readings/:readingId/games',
  authMiddleware,
  teacherOnly,
  upload.single('image'),
  gameController.create
);

router.get('/teacher/readings/:readingId/games',
  authMiddleware,
  teacherOnly,
  gameController.list
);

router.put('/teacher/games/reorder',
  authMiddleware,
  teacherOnlyFast,
  gameController.reorder
);

router.get('/teacher/games/:id',
  authMiddleware,
  teacherOnly,
  gameController.detail
);

router.put('/teacher/games/:id',
  authMiddleware,
  teacherOnly,
  upload.single('image'),
  gameController.update
);

router.delete('/teacher/games/:id',
  authMiddleware,
  teacherOnly,
  gameController.delete
);

router.get('/readings/:readingId/games',
  gameController.list
);

router.get('/games/:id',
  gameController.detail
);

module.exports = router;

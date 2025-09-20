const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");
const authMiddleware = require("../middlewares/Auth.middleware.js");
const { teacherOnly } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware");

router.use(authMiddleware);

router.post('/teacher/readings/:readingId/games',
  teacherOnly,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  gameController.create
);

router.get('/teacher/readings/:readingId/games',
  teacherOnly,
  gameController.list
);

router.get('/teacher/games/:id',
  teacherOnly,
  gameController.detail
);

router.put('/teacher/games/:id',
  teacherOnly,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  gameController.update
);

router.delete('/teacher/games/:id',
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

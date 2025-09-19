const express = require("express");
const router = express.Router();
const gameController = require("../controllers/Game.controller.js");
const authMiddleware = require("../middlewares/Auth.middleware.js");
const { teacherOnly } = require("../middlewares/Role.middleware.js");
const upload = require("../middlewares/File.middleware");

router.use(authMiddleware);

router.post('/admin/readings/:readingId/games',
  teacherOnly,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  gameController.create
);

router.get('/admin/readings/:readingId/games',
  teacherOnly,
  gameController.list
);

router.put('/admin/games/:id',
  teacherOnly,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  gameController.update
);

router.delete('/admin/games/:id',
  teacherOnly,
  gameController.delete
);

router.get('/readings/:readingId/games',
  gameController.list
);

module.exports = router;

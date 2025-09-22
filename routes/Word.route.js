const express = require('express');
const router = express.Router();
const WordController = require('../controllers/Word.controller');
const jwtMiddleware = require('../middlewares/Auth.middleware');
const { teacherOnly, adminOrTeacher } = require('../middlewares/Role.middleware');
const upload = require('../middlewares/File.middleware');

router.post('/', 
  jwtMiddleware,
  adminOrTeacher,
  upload.single('image'),
  WordController.createWord
);

router.put('/:id',
  jwtMiddleware,
  adminOrTeacher,
  upload.single('image'),
  WordController.updateWord
);

router.delete('/:id',
  jwtMiddleware,
  adminOrTeacher,
  WordController.deleteWord
);

router.get('/:id',
  jwtMiddleware,
  WordController.getWordById
);

router.get('/',
  jwtMiddleware,
  WordController.listWords
);

// Excel template and import routes
router.get('/template',
  jwtMiddleware,
  adminOrTeacher,
  WordController.downloadTemplate
);

router.post('/import',
  jwtMiddleware,
  adminOrTeacher,
  upload.single('file'),
  WordController.importFromExcel
);

// Routes for word assignments
router.post('/game/:gameId/words',
  jwtMiddleware,
  adminOrTeacher,
  WordController.assignWordsToGame
);

router.delete('/game/:gameId/words',
  jwtMiddleware,
  adminOrTeacher,
  WordController.removeWordsFromGame
);

router.get('/game/:gameId/words',
  jwtMiddleware,
  WordController.getWordsByGame
);

router.get('/mobile/game/:gameId/words',
  jwtMiddleware,
  WordController.getWordsByGameMobile
);

module.exports = router;
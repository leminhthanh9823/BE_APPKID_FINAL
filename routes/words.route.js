const express = require('express');
const router = express.Router();
const WordController = require('../controllers/Word.controller');
const { body } = require('express-validator');
const auth = require('../middlewares/Auth.middleware');
const uploadFile = require('../middlewares/File.middleware');

// Validation middleware
const validateWord = [
  body('word').trim().notEmpty().withMessage('Word is required'),
  body('definition').trim().notEmpty().withMessage('Definition is required'),
  body('level').isInt({ min: 1, max: 5 }).withMessage('Level must be between 1 and 5'),
  body('type').isIn(['noun', 'verb', 'adjective', 'adverb', 'other']).withMessage('Invalid word type'),
];

const validateWordAssignment = [
  body('assignments').isArray().withMessage('Assignments must be an array'),
  body('assignments.*.wordId').isInt().withMessage('Invalid word ID'),
  body('assignments.*.sequenceOrder').isInt({ min: 1 }).withMessage('Invalid sequence order')
];

// Routes for word management
router.post('/', 
  auth.verifyToken,
  auth.isTeacher,
  uploadFile.fields([
    { name: 'image', maxCount: 1 }
  ]),
  validateWord,
  WordController.createWord
);

router.put('/:id',
  auth.verifyToken,
  auth.isTeacher,
  uploadFile.fields([
    { name: 'image', maxCount: 1 }
  ]),
  validateWord,
  WordController.updateWord
);

router.delete('/:id',
  auth.verifyToken,
  auth.isTeacher,
  WordController.deleteWord
);

router.get('/:id',
  auth.verifyToken,
  WordController.getWordById
);

router.get('/',
  auth.verifyToken,
  WordController.listWords
);

// Excel template and import routes
router.get('/template',
  auth.verifyToken,
  auth.isTeacher,
  WordController.downloadTemplate
);

router.post('/import',
  auth.verifyToken,
  auth.isTeacher,
  uploadFile.single('file'),
  WordController.importFromExcel
);

// Routes for word assignments
router.post('/game/:gameId/words',
  auth.verifyToken,
  auth.isTeacher,
  validateWordAssignment,
  WordController.assignWordsToGame
);

router.delete('/game/:gameId/words',
  auth.verifyToken,
  auth.isTeacher,
  WordController.removeWordsFromGame
);

module.exports = router;
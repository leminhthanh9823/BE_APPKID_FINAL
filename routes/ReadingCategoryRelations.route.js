const express = require('express');
const router = express.Router();
const controller = require('../controllers/ReadingCategoryRelations.controller.js');
const jwtMiddleware = require('../middlewares/Auth.middleware.js');

router.post('/all', jwtMiddleware, controller.getAll);
router.get('/:reading_id/:category_id', jwtMiddleware, controller.getById);

module.exports = router;
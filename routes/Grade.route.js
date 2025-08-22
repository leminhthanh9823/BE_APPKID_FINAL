const express = require('express');
const router = express.Router();
const controller = require('../controllers/Grade.controller.js');
const jwtMiddleware = require('../middlewares/Auth.middleware.js');

router.get('/all', jwtMiddleware, controller.getAll);

module.exports = router;
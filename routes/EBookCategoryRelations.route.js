const express = require('express');
const router = express.Router();
const controller = require('../controllers/EBookCategoryRelations.contronller');
const jwtMiddleware = require('../middlewares/Auth.middleware.js');
const { adminOrTeacher } = require("../middlewares/Role.middleware.js");

router.post('/all', jwtMiddleware, controller.getAll);
router.get('/:id', jwtMiddleware, controller.getById);
router.post('/create/', jwtMiddleware, adminOrTeacher, controller.create);
router.put('/edit/:id', jwtMiddleware, adminOrTeacher, controller.update);
router.delete('/delete/:id', jwtMiddleware, adminOrTeacher, controller.remove);

module.exports = router;
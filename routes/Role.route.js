const express = require('express');
const router = express.Router();
const roleController = require('../controllers/Role.controller');

router.post('/all', roleController.getAllRoles);

module.exports = router;

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', ctrl.login);

module.exports = router;

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET /api/dashboard/resumen
router.get('/resumen', verificarToken, ctrl.getResumen);

module.exports = router;

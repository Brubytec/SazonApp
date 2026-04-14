const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reservaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET    /api/reservas              → listar (query: ?fecha=YYYY-MM-DD)
// GET    /api/reservas/:id          → obtener una
// POST   /api/reservas              → crear
// PATCH  /api/reservas/:id/estado   → cambiar estado
// DELETE /api/reservas/:id          → cancelar

router.get('/',                    verificarToken, ctrl.listar);
router.get('/:id',                 verificarToken, ctrl.obtener);
router.post('/',                   verificarToken, ctrl.crear);
router.patch('/:id/estado',        verificarToken, ctrl.cambiarEstado);
router.delete('/:id',              verificarToken, ctrl.cancelar);

module.exports = router;

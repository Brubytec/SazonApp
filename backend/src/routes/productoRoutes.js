const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productoController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET  /api/productos            → listar todos (query: ?categoria=1 | ?disponibles=true)
// GET  /api/productos/categorias → listar categorías
// GET  /api/productos/:id        → obtener uno
// POST /api/productos            → crear
// PUT  /api/productos/:id        → actualizar
// DELETE /api/productos/:id      → eliminar

router.get('/categorias',    verificarToken, ctrl.listarCategorias);
router.get('/',              verificarToken, ctrl.listar);
router.get('/:id',           verificarToken, ctrl.obtener);
router.post('/',             verificarToken, ctrl.crear);
router.put('/:id',           verificarToken, ctrl.actualizar);
router.delete('/:id',        verificarToken, ctrl.eliminar);

module.exports = router;

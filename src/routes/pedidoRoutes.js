const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pedidoController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET    /api/pedidos/activos              → pedidos abiertos
// GET    /api/pedidos/:id                  → detalle de un pedido
// POST   /api/pedidos                      → crear pedido (abre mesa)
// POST   /api/pedidos/:id/productos        → agregar producto al pedido
// DELETE /api/pedidos/:id/productos/:idDetalle → eliminar línea del pedido

router.get('/activos',                           verificarToken, ctrl.listarActivos);
router.get('/:id',                               verificarToken, ctrl.obtener);
router.post('/',                                 verificarToken, ctrl.crear);
router.post('/:id/productos',                    verificarToken, ctrl.agregarProducto);
router.delete('/:id/productos/:idDetalle',       verificarToken, ctrl.eliminarProducto);

module.exports = router;

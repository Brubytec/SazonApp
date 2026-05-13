const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/facturaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET  /api/facturas                  → historial (query: ?fechaInicio=&fechaFin=)
// GET  /api/facturas/ingresos/dia     → ingresos por día
// GET  /api/facturas/ingresos/categorias → ingresos por categoría
// GET  /api/facturas/:id              → detalle de una factura
// POST /api/facturas                  → generar factura

router.get('/ingresos/dia',        verificarToken, ctrl.ingresosDia);
router.get('/ingresos/categorias', verificarToken, ctrl.ingresosCategorias);
router.get('/',                    verificarToken, ctrl.listar);
router.get('/:id',                 verificarToken, ctrl.obtener);
router.post('/',                   verificarToken, ctrl.generar);

module.exports = router;

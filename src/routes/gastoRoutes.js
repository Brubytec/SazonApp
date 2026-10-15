const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/gastoController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

// Todo el módulo es exclusivo del administrador.
router.use(verificarToken, soloAdmin);

// GET    /api/gastos/categorias          → listar (query: ?activas=true)
// POST   /api/gastos/categorias          → crear categoría
// PUT    /api/gastos/categorias/:id      → editar / activar / desactivar
// DELETE /api/gastos/categorias/:id      → eliminar (solo si no tiene gastos)
router.get('/categorias',        ctrl.listarCategorias);
router.post('/categorias',       ctrl.crearCategoria);
router.put('/categorias/:id',    ctrl.actualizarCategoria);
router.delete('/categorias/:id', ctrl.eliminarCategoria);

// GET    /api/gastos/resumen             → totales por categoría, ventas y utilidad (?desde=&hasta=)
// GET    /api/gastos                     → listar (?desde=&hasta=&categoria=)
// POST   /api/gastos                     → registrar gasto
// PUT    /api/gastos/:id                 → editar gasto
// DELETE /api/gastos/:id                 → eliminar gasto
router.get('/resumen',  ctrl.resumen);
router.get('/',         ctrl.listar);
router.post('/',        ctrl.crear);
router.put('/:id',      ctrl.actualizar);
router.delete('/:id',   ctrl.eliminar);

module.exports = router;

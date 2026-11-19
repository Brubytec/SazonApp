const gastoService = require('../services/gastoService');

const gastoController = {
  listarCategorias: async (req, res, next) => {
    try { res.json(await gastoService.obtenerCategorias(req.query.activas === 'true')); }
    catch (err) { next(err); }
  },
  crearCategoria: async (req, res, next) => {
    try { res.status(201).json(await gastoService.crearCategoria(req.body)); }
    catch (err) { next(err); }
  },
  actualizarCategoria: async (req, res, next) => {
    try { res.json(await gastoService.actualizarCategoria(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  eliminarCategoria: async (req, res, next) => {
    try {
      await gastoService.eliminarCategoria(req.params.id);
      res.json({ mensaje: 'Categoría eliminada' });
    } catch (err) { next(err); }
  },

  listar: async (req, res, next) => {
    try { res.json(await gastoService.obtenerGastos(req.query)); }
    catch (err) { next(err); }
  },
  resumen: async (req, res, next) => {
    try { res.json(await gastoService.obtenerResumen(req.query)); }
    catch (err) { next(err); }
  },
  crear: async (req, res, next) => {
    try { res.status(201).json(await gastoService.crearGasto(req.body, req.usuario.id_usuario)); }
    catch (err) { next(err); }
  },
  actualizar: async (req, res, next) => {
    try { res.json(await gastoService.actualizarGasto(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  eliminar: async (req, res, next) => {
    try {
      await gastoService.eliminarGasto(req.params.id);
      res.json({ mensaje: 'Gasto eliminado' });
    } catch (err) { next(err); }
  }
};

module.exports = gastoController;

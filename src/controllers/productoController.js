const productoService = require('../services/productoService');

const productoController = {
  listar: async (req, res, next) => {
    try {
      const { categoria, disponibles } = req.query;
      let productos;
      if (disponibles === 'true') productos = await productoService.obtenerDisponibles();
      else if (categoria)         productos = await productoService.obtenerPorCategoria(categoria);
      else                        productos = await productoService.obtenerTodos();
      res.json(productos);
    } catch (err) { next(err); }
  },

  obtener: async (req, res, next) => {
    try {
      const producto = await productoService.obtenerPorId(req.params.id);
      res.json(producto);
    } catch (err) { next(err); }
  },

  crear: async (req, res, next) => {
    try {
      const producto = await productoService.crear(req.body);
      res.status(201).json(producto);
    } catch (err) { next(err); }
  },

  actualizar: async (req, res, next) => {
    try {
      const producto = await productoService.actualizar(req.params.id, req.body);
      res.json(producto);
    } catch (err) { next(err); }
  },

  eliminar: async (req, res, next) => {
    try {
      await productoService.eliminar(req.params.id);
      res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (err) { next(err); }
  },

  listarCategorias: async (req, res, next) => {
    try {
      const categorias = await productoService.obtenerCategorias();
      res.json(categorias);
    } catch (err) { next(err); }
  }
};

module.exports = productoController;

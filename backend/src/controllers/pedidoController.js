const pedidoService = require('../services/pedidoService');

const pedidoController = {
  listarActivos: async (req, res, next) => {
    try {
      res.json(await pedidoService.obtenerActivos());
    } catch (err) { next(err); }
  },

  obtener: async (req, res, next) => {
    try {
      res.json(await pedidoService.obtenerDetalle(req.params.id));
    } catch (err) { next(err); }
  },

  crear: async (req, res, next) => {
    try {
      const { id_mesa } = req.body;
      const pedido = await pedidoService.crear(id_mesa, req.usuario.id_usuario);
      res.status(201).json(pedido);
    } catch (err) { next(err); }
  },

  agregarProducto: async (req, res, next) => {
    try {
      const { id_producto, cantidad } = req.body;
      const detalle = await pedidoService.agregarProducto(req.params.id, id_producto, cantidad);
      res.json(detalle);
    } catch (err) { next(err); }
  },

  eliminarProducto: async (req, res, next) => {
    try {
      res.json(await pedidoService.eliminarProducto(req.params.idDetalle));
    } catch (err) { next(err); }
  }
};

module.exports = pedidoController;

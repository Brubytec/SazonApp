const facturaService = require('../services/facturaService');

const facturaController = {
  listar: async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      res.json(await facturaService.obtenerTodas({ fechaInicio, fechaFin }));
    } catch (err) { next(err); }
  },

  obtener: async (req, res, next) => {
    try {
      res.json(await facturaService.obtenerDetalle(req.params.id));
    } catch (err) { next(err); }
  },

  generar: async (req, res, next) => {
    try {
      const { id_pedido, medio_pago } = req.body;
      if (!id_pedido || !medio_pago)
        return res.status(400).json({ error: 'id_pedido y medio_pago son requeridos' });
      const resultado = await facturaService.generar(id_pedido, req.usuario.id_usuario, medio_pago);
      res.status(201).json(resultado);
    } catch (err) { next(err); }
  },

  ingresosDia: async (req, res, next) => {
    try {
      res.json(await facturaService.getIngresosDelDia());
    } catch (err) { next(err); }
  },

  ingresosCategorias: async (req, res, next) => {
    try {
      res.json(await facturaService.getIngresosPorCategoria());
    } catch (err) { next(err); }
  }
};

module.exports = facturaController;

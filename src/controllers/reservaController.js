const reservaService = require('../services/reservaService');

const reservaController = {
  listar: async (req, res, next) => {
    try {
      const { fecha } = req.query;
      const reservas = fecha
        ? await reservaService.obtenerPorFecha(fecha)
        : await reservaService.obtenerHoy();
      res.json(reservas);
    } catch (err) { next(err); }
  },

  obtener: async (req, res, next) => {
    try {
      res.json(await reservaService.obtenerPorId(req.params.id));
    } catch (err) { next(err); }
  },

  crear: async (req, res, next) => {
    try {
      const reserva = await reservaService.crear(req.body, req.usuario.id_usuario);
      res.status(201).json(reserva);
    } catch (err) { next(err); }
  },

  cambiarEstado: async (req, res, next) => {
    try {
      const reserva = await reservaService.cambiarEstado(req.params.id, req.body.estado);
      res.json(reserva);
    } catch (err) { next(err); }
  },

  cancelar: async (req, res, next) => {
    try {
      res.json(await reservaService.cancelar(req.params.id));
    } catch (err) { next(err); }
  }
};

module.exports = reservaController;

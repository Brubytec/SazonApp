const usuarioService = require('../services/usuarioService');

const usuarioController = {
  listar: async (req, res, next) => {
    try { res.json(await usuarioService.obtenerTodos()); }
    catch (err) { next(err); }
  },
  crear: async (req, res, next) => {
    try { res.status(201).json(await usuarioService.crear(req.body)); }
    catch (err) { next(err); }
  },
  actualizar: async (req, res, next) => {
    try { res.json(await usuarioService.actualizar(req.params.id, req.body, req.usuario.id_usuario)); }
    catch (err) { next(err); }
  },
  cambiarEstado: async (req, res, next) => {
    try { res.json(await usuarioService.cambiarEstado(req.params.id, req.body.activo, req.usuario.id_usuario)); }
    catch (err) { next(err); }
  },
  cambiarPassword: async (req, res, next) => {
    try {
      await usuarioService.cambiarPassword(req.params.id, req.body.password);
      res.json({ mensaje: 'Contraseña actualizada' });
    } catch (err) { next(err); }
  }
};

module.exports = usuarioController;

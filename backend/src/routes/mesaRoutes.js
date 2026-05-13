const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const mesaRepo = require('../repositories/mesaRepository');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET /api/mesas
router.get('/', verificarToken, async (req, res, next) => {
  try {
    res.json(await mesaRepo.findAll());
  } catch (err) { next(err); }
});

// GET /api/mesas/disponibles
router.get('/disponibles', verificarToken, async (req, res, next) => {
  try {
    const { fecha, hora } = req.query;
    const mesas = (fecha && hora)
      ? await mesaRepo.findDisponiblesParaReserva(fecha, hora)
      : await mesaRepo.findDisponibles();
    res.json(mesas);
  } catch (err) { next(err); }
});

// GET /api/mesas/:id
router.get('/:id', verificarToken, async (req, res, next) => {
  try {
    const mesa = await mesaRepo.findById(req.params.id);
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(mesa);
  } catch (err) { next(err); }
});

// PATCH /api/mesas/:id/estado
router.patch('/:id/estado', verificarToken, async (req, res, next) => {
  try {
    const { estado } = req.body;
    const validos = ['disponible', 'ocupada', 'reservada'];
    if (!validos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const updated = await mesaRepo.updateEstado(req.params.id, estado);
    if (!updated) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json({ mensaje: 'Estado actualizado' });
  } catch (err) { next(err); }
});

module.exports = router;

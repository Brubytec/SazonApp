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

module.exports = router;

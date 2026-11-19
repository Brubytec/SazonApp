const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mesaRoutes      = require('./routes/mesaRoutes');
const productoRoutes  = require('./routes/productoRoutes');
const reservaRoutes   = require('./routes/reservaRoutes');
const pedidoRoutes    = require('./routes/pedidoRoutes');
const facturaRoutes   = require('./routes/facturaRoutes');
const gastoRoutes     = require('./routes/gastoRoutes');
const usuarioRoutes   = require('./routes/usuarioRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mesas',     mesaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/reservas',  reservaRoutes);
app.use('/api/pedidos',   pedidoRoutes);
app.use('/api/facturas',  facturaRoutes);
app.use('/api/gastos',    gastoRoutes);
app.use('/api/usuarios',  usuarioRoutes);

// ── Ruta de salud ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sistema: 'SazonApp', version: '1.0.0' });
});

// ── Manejo de rutas no encontradas ────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Middleware de errores ──────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;

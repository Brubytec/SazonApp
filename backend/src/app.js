const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mesaRoutes      = require('./routes/mesaRoutes');
const productoRoutes  = require('./routes/productoRoutes');
const reservaRoutes   = require('./routes/reservaRoutes');
const pedidoRoutes    = require('./routes/pedidoRoutes');
const facturaRoutes   = require('./routes/facturaRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas API ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mesas',     mesaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/reservas',  reservaRoutes);
app.use('/api/pedidos',   pedidoRoutes);
app.use('/api/facturas',  facturaRoutes);

// ── Ruta de salud ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sistema: 'SazonApp', version: '1.0.0' });
});

// ── Middleware de errores API ──────────────────────────────────
app.use('/api', errorMiddleware);

// ── Frontend estático (React build) ───────────────────────────
const frontendDist = path.join(__dirname, '..', '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Cualquier ruta no-API sirve index.html (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

module.exports = app;

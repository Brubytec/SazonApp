require('dotenv').config();
const app  = require('./src/app');
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`\n🍽️  SazonApp API corriendo en http://localhost:${port}`);
  console.log(`📋  Documentación de endpoints:`);
  console.log(`    POST   /api/auth/login`);
  console.log(`    GET    /api/dashboard/resumen`);
  console.log(`    GET    /api/mesas`);
  console.log(`    GET    /api/productos`);
  console.log(`    GET    /api/reservas`);
  console.log(`    GET    /api/pedidos/activos`);
  console.log(`    GET    /api/facturas\n`);
});

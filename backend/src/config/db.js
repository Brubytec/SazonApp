const mysql = require('mysql2/promise');

// Pool de conexiones — reutiliza conexiones en lugar de abrir una nueva por petición
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              process.env.DB_PORT     || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'sazonapp',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          '-05:00'  // Colombia (UTC-5)
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a MySQL establecida correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con MySQL:', err.message);
    console.error('   Verifica las credenciales en el archivo .env');
  });

module.exports = pool;

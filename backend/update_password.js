require('dotenv').config();
const db = require('./src/config/db');

async function updatePassword() {
  try {
    const [result] = await db.query(
      "UPDATE usuario SET password = ? WHERE email = ?",
      ['$2a$10$wUXg48AppeBg8Ojv6sgJqOZa0iWTIhA8MwJWAK4qRTXH7Kl2ytpAO', 'cajero@sazonysabor.co']
    );
    console.log('Contraseña actualizada:', result);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

updatePassword();
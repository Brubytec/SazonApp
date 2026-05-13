const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const authService = {

  login: async (email, password) => {
    // Buscar usuario por email
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE email = ? AND activo = TRUE', [email]
    );
    if (rows.length === 0) {
      const err = new Error('Credenciales incorrectas');
      err.status = 401;
      throw err;
    }

    const usuario = rows[0];

    // Verificar contraseña con bcrypt
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) {
      const err = new Error('Credenciales incorrectas');
      err.status = 401;
      throw err;
    }

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return {
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre:     usuario.nombre,
        email:      usuario.email,
        rol:        usuario.rol
      }
    };
  },

  // Hashear contraseña (usado al crear usuarios)
  hashPassword: async (password) => {
    return bcrypt.hash(password, 10);
  }
};

module.exports = authService;

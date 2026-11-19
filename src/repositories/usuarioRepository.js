const db = require('../config/db');

// Nunca se devuelve la columna password.
const COLUMNAS = 'id_usuario, nombre, email, rol, activo, created_at';

const usuarioRepository = {
  findAll: async () => {
    const [rows] = await db.query(`SELECT ${COLUMNAS} FROM usuario ORDER BY activo DESC, nombre`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_usuario = ?`, [id]);
    return rows[0] || null;
  },

  insert: async ({ nombre, email, passwordHash, rol }) => {
    const [r] = await db.query(
      'INSERT INTO usuario (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, passwordHash, rol]
    );
    return r.insertId;
  },

  update: async (id, { nombre, email, rol }) => {
    const [r] = await db.query(
      'UPDATE usuario SET nombre = ?, email = ?, rol = ? WHERE id_usuario = ?',
      [nombre, email, rol, id]
    );
    return r.affectedRows > 0;
  },

  updateActivo: async (id, activo) => {
    const [r] = await db.query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [activo, id]);
    return r.affectedRows > 0;
  },

  updatePassword: async (id, passwordHash) => {
    const [r] = await db.query('UPDATE usuario SET password = ? WHERE id_usuario = ?', [passwordHash, id]);
    return r.affectedRows > 0;
  }
};

module.exports = usuarioRepository;

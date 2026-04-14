const db = require('../config/db');

const productoRepository = {

  findAll: async () => {
    const [rows] = await db.query(
      'SELECT p.*, c.nombre AS categoria ' +
      'FROM producto p JOIN categoria c ON p.id_categoria = c.id_categoria ' +
      'ORDER BY c.nombre, p.nombre'
    );
    return rows;
  },

  findDisponibles: async () => {
    const [rows] = await db.query('SELECT * FROM vista_productos_disponibles');
    return rows;
  },

  findByCategoria: async (idCategoria) => {
    const [rows] = await db.query(
      'SELECT p.*, c.nombre AS categoria FROM producto p ' +
      'JOIN categoria c ON p.id_categoria = c.id_categoria ' +
      'WHERE p.id_categoria = ? ORDER BY p.nombre',
      [idCategoria]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT p.*, c.nombre AS categoria FROM producto p ' +
      'JOIN categoria c ON p.id_categoria = c.id_categoria ' +
      'WHERE p.id_producto = ?', [id]
    );
    return rows[0] || null;
  },

  insert: async ({ id_categoria, nombre, descripcion, precio, disponible }) => {
    const [result] = await db.query(
      'INSERT INTO producto (id_categoria, nombre, descripcion, precio, disponible) VALUES (?,?,?,?,?)',
      [id_categoria, nombre, descripcion || null, precio, disponible ?? true]
    );
    return result.insertId;
  },

  update: async (id, { id_categoria, nombre, descripcion, precio, disponible }) => {
    const [result] = await db.query(
      'UPDATE producto SET id_categoria=?, nombre=?, descripcion=?, precio=?, disponible=? WHERE id_producto=?',
      [id_categoria, nombre, descripcion || null, precio, disponible, id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.query(
      'DELETE FROM producto WHERE id_producto = ?', [id]
    );
    return result.affectedRows > 0;
  },

  // Categorías
  findAllCategorias: async () => {
    const [rows] = await db.query('SELECT * FROM categoria ORDER BY nombre');
    return rows;
  }
};

module.exports = productoRepository;

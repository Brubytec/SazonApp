const db = require('../config/db');

const gastoRepository = {

  // ── Categorías ──────────────────────────────────────────────
  findCategorias: async ({ soloActivas = false } = {}) => {
    const [rows] = await db.query(
      'SELECT cg.*, ' +
      '  (SELECT COUNT(*) FROM gasto g WHERE g.id_categoria_gasto = cg.id_categoria_gasto) AS num_gastos ' +
      'FROM categoria_gasto cg ' +
      (soloActivas ? 'WHERE cg.activo = TRUE ' : '') +
      'ORDER BY cg.nombre'
    );
    return rows;
  },

  findCategoriaById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM categoria_gasto WHERE id_categoria_gasto = ?', [id]
    );
    return rows[0] || null;
  },

  insertCategoria: async ({ nombre, descripcion }) => {
    const [r] = await db.query(
      'INSERT INTO categoria_gasto (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion || null]
    );
    return r.insertId;
  },

  updateCategoria: async (id, { nombre, descripcion, activo }) => {
    const [r] = await db.query(
      'UPDATE categoria_gasto SET nombre = ?, descripcion = ?, activo = ? WHERE id_categoria_gasto = ?',
      [nombre, descripcion || null, activo, id]
    );
    return r.affectedRows > 0;
  },

  deleteCategoria: async (id) => {
    const [r] = await db.query('DELETE FROM categoria_gasto WHERE id_categoria_gasto = ?', [id]);
    return r.affectedRows > 0;
  },

  // ── Gastos ──────────────────────────────────────────────────
  findAll: async ({ desde, hasta, idCategoria }) => {
    let sql =
      'SELECT g.*, DATE_FORMAT(g.fecha, \'%Y-%m-%d\') AS fecha, cg.nombre AS categoria, u.nombre AS registrado_por ' +
      'FROM gasto g ' +
      'JOIN categoria_gasto cg ON g.id_categoria_gasto = cg.id_categoria_gasto ' +
      'JOIN usuario u ON g.id_usuario = u.id_usuario ' +
      'WHERE g.fecha BETWEEN ? AND ? ';
    const params = [desde, hasta];
    if (idCategoria) {
      sql += 'AND g.id_categoria_gasto = ? ';
      params.push(idCategoria);
    }
    sql += 'ORDER BY g.fecha DESC, g.id_gasto DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT g.*, DATE_FORMAT(g.fecha, \'%Y-%m-%d\') AS fecha, cg.nombre AS categoria FROM gasto g ' +
      'JOIN categoria_gasto cg ON g.id_categoria_gasto = cg.id_categoria_gasto ' +
      'WHERE g.id_gasto = ?', [id]
    );
    return rows[0] || null;
  },

  insert: async ({ id_categoria_gasto, fecha, descripcion, proveedor, monto, medio_pago }, idUsuario) => {
    const [r] = await db.query(
      'INSERT INTO gasto (id_categoria_gasto, id_usuario, fecha, descripcion, proveedor, monto, medio_pago) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_categoria_gasto, idUsuario, fecha, descripcion, proveedor || null, monto, medio_pago || 'efectivo']
    );
    return r.insertId;
  },

  update: async (id, { id_categoria_gasto, fecha, descripcion, proveedor, monto, medio_pago }) => {
    const [r] = await db.query(
      'UPDATE gasto SET id_categoria_gasto = ?, fecha = ?, descripcion = ?, proveedor = ?, monto = ?, medio_pago = ? ' +
      'WHERE id_gasto = ?',
      [id_categoria_gasto, fecha, descripcion, proveedor || null, monto, medio_pago || 'efectivo', id]
    );
    return r.affectedRows > 0;
  },

  delete: async (id) => {
    const [r] = await db.query('DELETE FROM gasto WHERE id_gasto = ?', [id]);
    return r.affectedRows > 0;
  },

  // ── Resumen: gastos por categoría vs. ventas del periodo ────
  totalesPorCategoria: async (desde, hasta) => {
    const [rows] = await db.query(
      'SELECT cg.id_categoria_gasto, cg.nombre AS categoria, ' +
      '       COUNT(g.id_gasto) AS num_gastos, COALESCE(SUM(g.monto), 0) AS total ' +
      'FROM categoria_gasto cg ' +
      'LEFT JOIN gasto g ON g.id_categoria_gasto = cg.id_categoria_gasto AND g.fecha BETWEEN ? AND ? ' +
      'GROUP BY cg.id_categoria_gasto, cg.nombre ' +
      'HAVING total > 0 ' +
      'ORDER BY total DESC',
      [desde, hasta]
    );
    return rows;
  },

  ventasDelPeriodo: async (desde, hasta) => {
    const [[row]] = await db.query(
      'SELECT COALESCE(SUM(total), 0) AS ventas, COUNT(*) AS facturas ' +
      'FROM factura WHERE DATE(fecha_hora) BETWEEN ? AND ?',
      [desde, hasta]
    );
    return row;
  }
};

module.exports = gastoRepository;

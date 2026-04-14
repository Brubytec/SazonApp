const db = require('../config/db');

const facturaRepository = {

  findAll: async ({ fechaInicio, fechaFin } = {}) => {
    let query =
      'SELECT f.*, m.numero AS numero_mesa, u.nombre AS cobrado_por ' +
      'FROM factura f ' +
      'JOIN pedido  p ON f.id_pedido  = p.id_pedido ' +
      'JOIN mesa    m ON p.id_mesa    = m.id_mesa ' +
      'JOIN usuario u ON f.id_usuario = u.id_usuario ';

    const params = [];
    if (fechaInicio && fechaFin) {
      query += 'WHERE DATE(f.fecha_hora) BETWEEN ? AND ? ';
      params.push(fechaInicio, fechaFin);
    }
    query += 'ORDER BY f.fecha_hora DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT f.*, m.numero AS numero_mesa, u.nombre AS cobrado_por ' +
      'FROM factura f ' +
      'JOIN pedido  p ON f.id_pedido  = p.id_pedido ' +
      'JOIN mesa    m ON p.id_mesa    = m.id_mesa ' +
      'JOIN usuario u ON f.id_usuario = u.id_usuario ' +
      'WHERE f.id_factura = ?', [id]
    );
    return rows[0] || null;
  },

  findDetalle: async (idFactura) => {
    const [rows] = await db.query(
      'SELECT dp.*, pr.nombre AS producto, cat.nombre AS categoria ' +
      'FROM factura f ' +
      'JOIN pedido        p   ON f.id_pedido    = p.id_pedido ' +
      'JOIN detalle_pedido dp ON p.id_pedido    = dp.id_pedido ' +
      'JOIN producto      pr  ON dp.id_producto = pr.id_producto ' +
      'JOIN categoria     cat ON pr.id_categoria = cat.id_categoria ' +
      'WHERE f.id_factura = ?', [idFactura]
    );
    return rows;
  },

  // Llama al procedimiento sp_GenerarFactura
  generar: async (idPedido, idUsuario, medioPago) => {
    await db.query(
      'CALL sp_GenerarFactura(?, ?, ?, @nfac)',
      [idPedido, idUsuario, medioPago]
    );
    const [[out]] = await db.query('SELECT @nfac AS numero_factura');
    return out.numero_factura;
  },

  ingresosPorDia: async () => {
    const [rows] = await db.query('SELECT * FROM vista_ingresos_por_dia LIMIT 30');
    return rows;
  },

  ingresosPorCategoria: async () => {
    const [rows] = await db.query('SELECT * FROM vista_ingresos_por_categoria');
    return rows;
  }
};

module.exports = facturaRepository;

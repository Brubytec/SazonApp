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

  // Genera factura, cierra pedido y libera mesa (lógica directa sin SP)
  generar: async (idPedido, idUsuario, medioPago) => {
    console.log(`[facturaRepository.generar] idPedido=${idPedido} medioPago=${medioPago}`);

    // ── PASO 1: idempotencia — buscar factura existente para este pedido ──────
    // Usamos solo la tabla factura (sin JOIN) para evitar fallos por estado del pedido
    const [rowsExist] = await db.query(
      'SELECT id_factura, numero_factura FROM factura WHERE id_pedido = ?',
      [idPedido]
    );
    if (rowsExist.length > 0) {
      const existing = rowsExist[0];
      console.log(`[facturaRepository.generar] factura ya existe: ${existing.numero_factura} — reparando estado`);
      const [rowsPedidoEx] = await db.query('SELECT id_mesa FROM pedido WHERE id_pedido = ?', [idPedido]);
      const idMesa = rowsPedidoEx[0]?.id_mesa;
      await db.query("UPDATE pedido SET estado = 'facturado' WHERE id_pedido = ? AND estado = 'abierto'", [idPedido]);
      if (idMesa) await db.query("UPDATE mesa SET estado = 'disponible' WHERE id_mesa = ? AND estado = 'ocupada'", [idMesa]);
      return { numero_factura: existing.numero_factura, id_factura: Number(existing.id_factura) };
    }

    // ── PASO 2: validaciones ──────────────────────────────────────────────────
    const [rowsPedido] = await db.query(
      'SELECT estado, total, id_mesa FROM pedido WHERE id_pedido = ?',
      [idPedido]
    );
    const pedido = rowsPedido[0];
    if (!pedido) {
      const e = new Error('Pedido no encontrado'); e.status = 404; throw e;
    }
    if (pedido.estado !== 'abierto') {
      const e = new Error('Solo se pueden facturar pedidos en estado abierto'); e.status = 400; throw e;
    }
    const [rowsCount] = await db.query(
      'SELECT COUNT(*) AS conteo FROM detalle_pedido WHERE id_pedido = ?',
      [idPedido]
    );
    if (Number(rowsCount[0].conteo) === 0) {
      const e = new Error('El pedido no tiene productos registrados'); e.status = 400; throw e;
    }

    // ── PASO 3: generar número de factura único ───────────────────────────────
    // Basado en MAX(id_factura)+1 para evitar colisiones con registros previos
    const [rowsMax] = await db.query('SELECT COALESCE(MAX(id_factura), 0) AS maxId FROM factura');
    const siguienteNum = Number(rowsMax[0].maxId) + 1;
    const numeroFactura = 'FAC-' + String(siguienteNum).padStart(6, '0');
    console.log(`[facturaRepository.generar] creando factura ${numeroFactura}`);

    // ── PASO 4: insertar factura, cerrar pedido y liberar mesa ────────────────
    const [result] = await db.query(
      'INSERT INTO factura (id_pedido, id_usuario, total, medio_pago, numero_factura) VALUES (?, ?, ?, ?, ?)',
      [idPedido, idUsuario, pedido.total, medioPago, numeroFactura]
    );
    await db.query("UPDATE pedido SET estado = 'facturado' WHERE id_pedido = ?", [idPedido]);
    await db.query("UPDATE mesa SET estado = 'disponible' WHERE id_mesa = ?", [pedido.id_mesa]);
    console.log(`[facturaRepository.generar] ✅ factura creada id=${result.insertId}`);
    return { numero_factura: numeroFactura, id_factura: result.insertId };
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

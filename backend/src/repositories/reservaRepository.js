const db = require('../config/db');

const reservaRepository = {

  findByFecha: async (fecha) => {
    // vista_reservas_hoy filtra WHERE fecha = CURDATE() — no sirve para otras fechas.
    // Consultamos la tabla directamente para soportar cualquier fecha.
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      'SELECT r.id_reserva, r.fecha, r.hora, ' +
      '       c.nombre AS cliente, c.telefono, ' +
      '       m.numero AS numero_mesa, m.capacidad, ' +
      '       r.num_personas, r.estado, r.observaciones, ' +
      '       u.nombre AS registrado_por ' +
      'FROM reserva r ' +
      'JOIN cliente c ON r.id_cliente = c.id_cliente ' +
      'JOIN mesa    m ON r.id_mesa    = m.id_mesa ' +
      'JOIN usuario u ON r.id_usuario = u.id_usuario ' +
      'WHERE r.fecha = ? ORDER BY r.hora',
      [fechaFiltro]
    );
    return rows;
  },

  findHoy: async () => {
    const [rows] = await db.query('SELECT * FROM vista_reservas_hoy ORDER BY hora');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT r.*, c.nombre AS cliente, c.telefono, m.numero AS numero_mesa ' +
      'FROM reserva r ' +
      'JOIN cliente c ON r.id_cliente = c.id_cliente ' +
      'JOIN mesa    m ON r.id_mesa    = m.id_mesa ' +
      'WHERE r.id_reserva = ?', [id]
    );
    return rows[0] || null;
  },

  insert: async ({ nombre_cliente, telefono, id_mesa, id_usuario, fecha, hora, num_personas, observaciones }) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Insertar o reutilizar cliente
      let id_cliente;
      const [exist] = await conn.query(
        'SELECT id_cliente FROM cliente WHERE nombre = ? AND telefono = ?',
        [nombre_cliente, telefono || null]
      );
      if (exist.length > 0) {
        id_cliente = exist[0].id_cliente;
      } else {
        const [res] = await conn.query(
          'INSERT INTO cliente (nombre, telefono) VALUES (?,?)',
          [nombre_cliente, telefono || null]
        );
        id_cliente = res.insertId;
      }

      // Insertar reserva (el trigger valida capacidad)
      const [result] = await conn.query(
        'INSERT INTO reserva (id_cliente, id_mesa, id_usuario, fecha, hora, num_personas, observaciones) VALUES (?,?,?,?,?,?,?)',
        [id_cliente, id_mesa, id_usuario, fecha, hora, num_personas, observaciones || null]
      );

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  updateEstado: async (id, estado) => {
    const [result] = await db.query(
      'UPDATE reserva SET estado = ? WHERE id_reserva = ?', [estado, id]
    );
    return result.affectedRows > 0;
  },

  cancelar: async (id) => {
    // El trigger trg_LiberarMesaAlCancelarReserva libera la mesa automáticamente
    const [result] = await db.query(
      "UPDATE reserva SET estado = 'cancelada' WHERE id_reserva = ?", [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = reservaRepository;

const db = require('../config/db');

const mesaRepository = {

  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM vista_estado_mesas');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM mesa WHERE id_mesa = ?', [id]
    );
    return rows[0] || null;
  },

  findDisponibles: async () => {
    const [rows] = await db.query(
      "SELECT * FROM mesa WHERE estado = 'disponible' ORDER BY numero"
    );
    return rows;
  },

  findDisponiblesParaReserva: async (fecha, hora) => {
    const [rows] = await db.query(
      'SELECT m.*, fn_MesaDisponible(m.id_mesa, ?, ?) AS disponible_reserva ' +
      'FROM mesa m WHERE m.estado != "ocupada" ORDER BY m.numero',
      [fecha, hora]
    );
    return rows.filter(m => m.disponible_reserva === 1);
  },

  updateEstado: async (id, estado) => {
    const [result] = await db.query(
      'UPDATE mesa SET estado = ? WHERE id_mesa = ?', [estado, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = mesaRepository;

const db = require('../config/db');

const pedidoRepository = {

  findActivos: async () => {
    const [rows] = await db.query('SELECT * FROM vista_pedidos_activos');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT p.*, m.numero AS numero_mesa FROM pedido p ' +
      'JOIN mesa m ON p.id_mesa = m.id_mesa ' +
      'WHERE p.id_pedido = ?', [id]
    );
    return rows[0] || null;
  },

  findDetalle: async (idPedido) => {
    const [rows] = await db.query(
      'SELECT * FROM vista_detalle_pedido_completo WHERE id_pedido = ?', [idPedido]
    );
    return rows;
  },

  // Llama al procedimiento almacenado sp_CrearPedido
  crear: async (idMesa, idUsuario) => {
    const [rows] = await db.query(
      'CALL sp_CrearPedido(?, ?, @pid)',
      [idMesa, idUsuario]
    );
    const [[out]] = await db.query('SELECT @pid AS id_pedido');
    return out.id_pedido;
  },

  // Llama al procedimiento almacenado sp_AgregarDetallePedido
  agregarDetalle: async (idPedido, idProducto, cantidad) => {
    await db.query(
      'CALL sp_AgregarDetallePedido(?, ?, ?)',
      [idPedido, idProducto, cantidad]
    );
  },

  // Llama al procedimiento almacenado sp_EliminarDetallePedido
  eliminarDetalle: async (idDetalle) => {
    await db.query('CALL sp_EliminarDetallePedido(?)', [idDetalle]);
  },

  updateTotal: async (idPedido) => {
    const [rows] = await db.query(
      'SELECT fn_TotalPedido(?) AS total', [idPedido]
    );
    const total = rows[0].total;
    await db.query('UPDATE pedido SET total = ? WHERE id_pedido = ?', [total, idPedido]);
    return total;
  },

  updateEstado: async (id, estado) => {
    const [result] = await db.query(
      'UPDATE pedido SET estado = ? WHERE id_pedido = ?', [estado, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = pedidoRepository;

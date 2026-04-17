const pedidoRepository = require('../repositories/pedidoRepository');

const pedidoService = {

  obtenerActivos: async () => {
    return pedidoRepository.findActivos();
  },

  obtenerPorId: async (id) => {
    const pedido = await pedidoRepository.findById(id);
    if (!pedido) {
      const err = new Error('Pedido no encontrado');
      err.status = 404;
      throw err;
    }
    return pedido;
  },

  obtenerDetalle: async (id) => {
    // obtenerPorId ya valida existencia y retorna el pedido — reutilizamos el resultado
    const pedido  = await pedidoService.obtenerPorId(id);
    const detalle = await pedidoRepository.findDetalle(id);
    return { pedido, detalle };
  },

  crear: async (idMesa, idUsuario) => {
    if (!idMesa) {
      const err = new Error('id_mesa es obligatorio');
      err.status = 400;
      throw err;
    }
    // sp_CrearPedido valida que la mesa esté disponible
    const idPedido = await pedidoRepository.crear(idMesa, idUsuario);
    return pedidoRepository.findById(idPedido);
  },

  agregarProducto: async (idPedido, idProducto, cantidad) => {
    if (!idProducto || !cantidad || cantidad < 1) {
      const err = new Error('id_producto y cantidad (≥1) son obligatorios');
      err.status = 400;
      throw err;
    }
    await pedidoService.obtenerPorId(idPedido);
    // sp_AgregarDetallePedido valida disponibilidad del producto
    await pedidoRepository.agregarDetalle(idPedido, idProducto, cantidad);
    return pedidoRepository.findDetalle(idPedido);
  },

  eliminarProducto: async (idDetalle) => {
    // sp_EliminarDetallePedido valida que el pedido esté abierto
    await pedidoRepository.eliminarDetalle(idDetalle);
    return { mensaje: 'Producto eliminado del pedido' };
  }
};

module.exports = pedidoService;

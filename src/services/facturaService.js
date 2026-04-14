const facturaRepository = require('../repositories/facturaRepository');

const facturaService = {

  obtenerTodas: async (filtros = {}) => {
    return facturaRepository.findAll(filtros);
  },

  obtenerPorId: async (id) => {
    const factura = await facturaRepository.findById(id);
    if (!factura) {
      const err = new Error('Factura no encontrada');
      err.status = 404;
      throw err;
    }
    return factura;
  },

  obtenerDetalle: async (id) => {
    const factura = await facturaService.obtenerPorId(id);
    const detalle = await facturaRepository.findDetalle(id);
    return { factura, detalle };
  },

  generar: async (idPedido, idUsuario, medioPago) => {
    const mediosValidos = ['efectivo', 'transferencia', 'tarjeta'];
    if (!mediosValidos.includes(medioPago)) {
      const err = new Error(`Medio de pago inválido. Valores: ${mediosValidos.join(', ')}`);
      err.status = 400;
      throw err;
    }
    // sp_GenerarFactura valida el estado del pedido y que tenga productos
    const numeroFactura = await facturaRepository.generar(idPedido, idUsuario, medioPago);
    return { numero_factura: numeroFactura, mensaje: 'Factura generada exitosamente' };
  },

  getIngresosDelDia: async () => {
    return facturaRepository.ingresosPorDia();
  },

  getIngresosPorCategoria: async () => {
    return facturaRepository.ingresosPorCategoria();
  }
};

module.exports = facturaService;

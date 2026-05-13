const reservaRepository = require('../repositories/reservaRepository');

const reservaService = {

  obtenerHoy: async () => {
    return reservaRepository.findHoy();
  },

  obtenerPorFecha: async (fecha) => {
    return reservaRepository.findByFecha(fecha);
  },

  obtenerPorId: async (id) => {
    const reserva = await reservaRepository.findById(id);
    if (!reserva) {
      const err = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }
    return reserva;
  },

  crear: async (datos, idUsuario) => {
    const { nombre_cliente, id_mesa, fecha, hora, num_personas } = datos;
    if (!nombre_cliente || !id_mesa || !fecha || !hora || !num_personas) {
      const err = new Error('Faltan campos obligatorios: nombre_cliente, id_mesa, fecha, hora, num_personas');
      err.status = 400;
      throw err;
    }
    // El trigger trg_ValidarCapacidadReserva valida la capacidad en la BD
    const id = await reservaRepository.insert({ ...datos, id_usuario: idUsuario });
    return reservaRepository.findById(id);
  },

  cambiarEstado: async (id, estado) => {
    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      const err = new Error(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`);
      err.status = 400;
      throw err;
    }
    await reservaService.obtenerPorId(id);
    await reservaRepository.updateEstado(id, estado);
    return reservaRepository.findById(id);
  },

  cancelar: async (id) => {
    const reserva = await reservaService.obtenerPorId(id);
    if (['completada', 'cancelada'].includes(reserva.estado)) {
      const err = new Error('No se puede cancelar una reserva ya completada o cancelada');
      err.status = 400;
      throw err;
    }
    // El trigger libera la mesa automáticamente
    await reservaRepository.cancelar(id);
    return { mensaje: 'Reserva cancelada exitosamente' };
  }
};

module.exports = reservaService;

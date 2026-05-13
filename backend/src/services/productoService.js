const productoRepository = require('../repositories/productoRepository');

const productoService = {

  obtenerTodos: async () => {
    return productoRepository.findAll();
  },

  obtenerDisponibles: async () => {
    return productoRepository.findDisponibles();
  },

  obtenerPorCategoria: async (idCategoria) => {
    return productoRepository.findByCategoria(idCategoria);
  },

  obtenerPorId: async (id) => {
    const producto = await productoRepository.findById(id);
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }
    return producto;
  },

  crear: async (datos) => {
    const { nombre, precio, id_categoria } = datos;
    if (!nombre || !precio || !id_categoria) {
      const err = new Error('nombre, precio e id_categoria son obligatorios');
      err.status = 400;
      throw err;
    }
    const id = await productoRepository.insert(datos);
    return productoRepository.findById(id);
  },

  actualizar: async (id, datos) => {
    await productoService.obtenerPorId(id); // valida existencia
    await productoRepository.update(id, datos);
    return productoRepository.findById(id);
  },

  eliminar: async (id) => {
    await productoService.obtenerPorId(id);
    return productoRepository.delete(id);
  },

  obtenerCategorias: async () => {
    return productoRepository.findAllCategorias();
  }
};

module.exports = productoService;

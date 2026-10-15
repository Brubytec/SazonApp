const gastoRepository = require('../repositories/gastoRepository');

const MEDIOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const errorHttp = (status, mensaje) => {
  const err = new Error(mensaje);
  err.status = status;
  return err;
};

// Si no llegan fechas se usa el mes actual (hora de Colombia).
const rangoPorDefecto = (desde, hasta) => {
  const hoy = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const inicioMes = hoy.slice(0, 8) + '01';
  const d = desde || inicioMes;
  const h = hasta || hoy;
  if (!FECHA_RE.test(d) || !FECHA_RE.test(h)) throw errorHttp(400, 'Las fechas deben tener formato AAAA-MM-DD');
  if (d > h) throw errorHttp(400, 'La fecha inicial no puede ser mayor que la final');
  return { desde: d, hasta: h };
};

const validarGasto = (datos) => {
  const { id_categoria_gasto, fecha, descripcion, monto, medio_pago } = datos;
  if (!id_categoria_gasto) throw errorHttp(400, 'La categoría es obligatoria');
  if (!fecha || !FECHA_RE.test(fecha)) throw errorHttp(400, 'La fecha es obligatoria (AAAA-MM-DD)');
  if (!descripcion || !String(descripcion).trim()) throw errorHttp(400, 'La descripción es obligatoria');
  if (!(Number(monto) > 0)) throw errorHttp(400, 'El monto debe ser mayor que cero');
  if (medio_pago && !MEDIOS_PAGO.includes(medio_pago)) {
    throw errorHttp(400, `Medio de pago inválido. Valores: ${MEDIOS_PAGO.join(', ')}`);
  }
  return { ...datos, descripcion: String(descripcion).trim(), monto: Number(monto) };
};

const gastoService = {

  // ── Categorías ──────────────────────────────────────────────
  obtenerCategorias: (soloActivas) => gastoRepository.findCategorias({ soloActivas }),

  crearCategoria: async ({ nombre, descripcion }) => {
    if (!nombre || !nombre.trim()) throw errorHttp(400, 'El nombre de la categoría es obligatorio');
    const id = await gastoRepository.insertCategoria({ nombre: nombre.trim(), descripcion });
    return gastoRepository.findCategoriaById(id);
  },

  actualizarCategoria: async (id, datos) => {
    const actual = await gastoRepository.findCategoriaById(id);
    if (!actual) throw errorHttp(404, 'Categoría no encontrada');
    const nombre = (datos.nombre ?? actual.nombre).trim();
    if (!nombre) throw errorHttp(400, 'El nombre de la categoría es obligatorio');
    await gastoRepository.updateCategoria(id, {
      nombre,
      descripcion: datos.descripcion ?? actual.descripcion,
      activo: datos.activo ?? actual.activo
    });
    return gastoRepository.findCategoriaById(id);
  },

  eliminarCategoria: async (id) => {
    const actual = await gastoRepository.findCategoriaById(id);
    if (!actual) throw errorHttp(404, 'Categoría no encontrada');
    try {
      await gastoRepository.deleteCategoria(id);
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw errorHttp(409, 'La categoría tiene gastos registrados. Desactívala en lugar de eliminarla.');
      }
      throw err;
    }
  },

  // ── Gastos ──────────────────────────────────────────────────
  obtenerGastos: ({ desde, hasta, categoria }) => {
    const rango = rangoPorDefecto(desde, hasta);
    return gastoRepository.findAll({ ...rango, idCategoria: categoria || null });
  },

  crearGasto: async (datos, idUsuario) => {
    const limpio = validarGasto(datos);
    const categoria = await gastoRepository.findCategoriaById(limpio.id_categoria_gasto);
    if (!categoria) throw errorHttp(400, 'La categoría no existe');
    if (!categoria.activo) throw errorHttp(400, 'La categoría está desactivada');
    const id = await gastoRepository.insert(limpio, idUsuario);
    return gastoRepository.findById(id);
  },

  actualizarGasto: async (id, datos) => {
    if (!(await gastoRepository.findById(id))) throw errorHttp(404, 'Gasto no encontrado');
    const limpio = validarGasto(datos);
    await gastoRepository.update(id, limpio);
    return gastoRepository.findById(id);
  },

  eliminarGasto: async (id) => {
    if (!(await gastoRepository.delete(id))) throw errorHttp(404, 'Gasto no encontrado');
  },

  /** Inversión del periodo por categoría, ventas y utilidad (ventas − gastos). */
  obtenerResumen: async ({ desde, hasta }) => {
    const rango = rangoPorDefecto(desde, hasta);
    const [porCategoria, ventas] = await Promise.all([
      gastoRepository.totalesPorCategoria(rango.desde, rango.hasta),
      gastoRepository.ventasDelPeriodo(rango.desde, rango.hasta)
    ]);
    const totalGastos = porCategoria.reduce((s, c) => s + Number(c.total), 0);
    const totalVentas = Number(ventas.ventas);
    return {
      ...rango,
      total_gastos: totalGastos,
      total_ventas: totalVentas,
      num_facturas: ventas.facturas,
      utilidad: totalVentas - totalGastos,
      por_categoria: porCategoria.map(c => ({ ...c, total: Number(c.total) }))
    };
  }
};

module.exports = gastoService;

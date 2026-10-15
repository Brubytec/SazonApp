import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

const pesos = (v) => '$' + Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })

// Fechas en hora local (AAAA-MM-DD)
const iso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
const hoy = () => iso(new Date())
const inicioMes = () => { const d = new Date(); d.setDate(1); return iso(d) }

const MEDIOS = [
  { valor: 'efectivo',      label: '💵 Efectivo' },
  { valor: 'transferencia', label: '🏦 Transferencia' },
  { valor: 'tarjeta',       label: '💳 Tarjeta' },
]

const formVacio = () => ({ id_categoria_gasto: '', fecha: hoy(), descripcion: '', proveedor: '', monto: '', medio_pago: 'efectivo' })

export default function Gastos() {
  const [desde, setDesde]           = useState(inicioMes())
  const [hasta, setHasta]           = useState(hoy())
  const [filtroCat, setFiltroCat]   = useState('')
  const [gastos, setGastos]         = useState([])
  const [resumen, setResumen]       = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading]       = useState(true)
  const [msg, setMsg]               = useState({ tipo: '', texto: '' })

  // Modal de gasto
  const [modal, setModal]       = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm]         = useState(formVacio())
  const [errorModal, setErrorModal] = useState('')

  // Modal de categorías
  const [modalCat, setModalCat] = useState(false)
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', descripcion: '' })
  const [catEditando, setCatEditando] = useState(null)
  const [errorCat, setErrorCat] = useState('')

  const cargar = async () => {
    try {
      const params = { desde, hasta, ...(filtroCat ? { categoria: filtroCat } : {}) }
      const [g, r, c] = await Promise.all([
        api.get('/gastos', { params }),
        api.get('/gastos/resumen', { params: { desde, hasta } }),
        api.get('/gastos/categorias')
      ])
      setGastos(g.data)
      setResumen(r.data)
      setCategorias(c.data)
    } catch (e) {
      setMsg({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo cargar la información' })
    } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [desde, hasta, filtroCat])

  // ── Gastos ──────────────────────────────────────────────────
  const abrirModal = (g = null) => {
    setErrorModal('')
    setEditando(g)
    setForm(g ? {
      id_categoria_gasto: g.id_categoria_gasto,
      fecha: String(g.fecha).slice(0, 10),
      descripcion: g.descripcion,
      proveedor: g.proveedor || '',
      monto: Number(g.monto),
      medio_pago: g.medio_pago
    } : formVacio())
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await api.put(`/gastos/${editando.id_gasto}`, form)
      else          await api.post('/gastos', form)
      setModal(false)
      setMsg({ tipo: 'success', texto: editando ? '✅ Gasto actualizado' : '✅ Gasto registrado' })
      cargar()
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'Error al guardar')
    }
  }

  const eliminar = async (g) => {
    if (!confirm(`¿Eliminar el gasto "${g.descripcion}" por ${pesos(g.monto)}?`)) return
    try { await api.delete(`/gastos/${g.id_gasto}`); cargar() }
    catch (e) { setMsg({ tipo: 'error', texto: e.response?.data?.error || 'Error al eliminar' }) }
  }

  // ── Categorías ──────────────────────────────────────────────
  const crearCategoria = async (e) => {
    e.preventDefault()
    setErrorCat('')
    try {
      await api.post('/gastos/categorias', nuevaCat)
      setNuevaCat({ nombre: '', descripcion: '' })
      cargar()
    } catch (err) { setErrorCat(err.response?.data?.error || 'Error al crear la categoría') }
  }

  const guardarCategoria = async (c, cambios) => {
    setErrorCat('')
    try {
      await api.put(`/gastos/categorias/${c.id_categoria_gasto}`, { ...c, ...cambios })
      setCatEditando(null)
      cargar()
    } catch (err) { setErrorCat(err.response?.data?.error || 'Error al actualizar') }
  }

  const eliminarCategoria = async (c) => {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
    setErrorCat('')
    try { await api.delete(`/gastos/categorias/${c.id_categoria_gasto}`); cargar() }
    catch (err) { setErrorCat(err.response?.data?.error || 'Error al eliminar') }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  const activas = categorias.filter(c => c.activo)
  const maxCat = Math.max(1, ...(resumen?.por_categoria || []).map(c => c.total))
  const utilidad = resumen?.utilidad ?? 0

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Inversión y gastos</div>
            <div className="topbar-sub">Alimentos, insumos, pago a empleados y demás costos del restaurante</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => { setErrorCat(''); setModalCat(true) }}>⚙️ Categorías</button>
            <button className="btn btn-primary" onClick={() => abrirModal()} disabled={activas.length === 0}>➕ Registrar gasto</button>
          </div>
        </div>

        <div className="page-body">
          {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

          {/* Filtros */}
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16, padding: 16 }}>
            <div>
              <label className="form-label">Desde</label>
              <input type="date" className="form-input" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Hasta</label>
              <input type="date" className="form-input" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} />
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="form-label">Categoría</label>
              <select className="form-input" value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id_categoria_gasto} value={c.id_categoria_gasto}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setDesde(inicioMes()); setHasta(hoy()) }}>Este mes</button>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-rojo">
              <div className="kpi-icon">🧾</div>
              <div className="kpi-label">Total invertido</div>
              <div className="kpi-value" style={{ fontSize: 26 }}>{pesos(resumen?.total_gastos)}</div>
              <div className="kpi-sub">{gastos.length} registros en el periodo</div>
            </div>
            <div className="kpi-card kpi-verde">
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Ventas</div>
              <div className="kpi-value" style={{ fontSize: 26 }}>{pesos(resumen?.total_ventas)}</div>
              <div className="kpi-sub">{resumen?.num_facturas ?? 0} facturas</div>
            </div>
            <div className={`kpi-card ${utilidad >= 0 ? 'kpi-verde' : 'kpi-rojo'}`}>
              <div className="kpi-icon">📈</div>
              <div className="kpi-label">Utilidad</div>
              <div className="kpi-value" style={{ fontSize: 26, color: utilidad >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
                {utilidad < 0 ? '−' : ''}{pesos(Math.abs(utilidad))}
              </div>
              <div className="kpi-sub">ventas − gastos</div>
            </div>
            <div className="kpi-card kpi-amber">
              <div className="kpi-icon">🏷️</div>
              <div className="kpi-label">Mayor gasto</div>
              <div className="kpi-value" style={{ fontSize: 20 }}>{resumen?.por_categoria?.[0]?.categoria || '—'}</div>
              <div className="kpi-sub">{resumen?.por_categoria?.[0] ? pesos(resumen.por_categoria[0].total) : 'Sin gastos'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
            {/* Por categoría */}
            <div className="card">
              <div className="section-title">Inversión por categoría</div>
              {(resumen?.por_categoria || []).length === 0
                ? <div style={{ color: 'var(--text-s)', fontSize: 13 }}>No hay gastos en este periodo.</div>
                : resumen.por_categoria.map(c => (
                  <div key={c.id_categoria_gasto} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.categoria}</span>
                      <span>{pesos(c.total)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--gris-l)', borderRadius: 99 }}>
                      <div style={{ width: `${(c.total / maxCat) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2 }}>
                      {c.num_gastos} registro{c.num_gastos === 1 ? '' : 's'} · {resumen.total_gastos ? Math.round(c.total * 100 / resumen.total_gastos) : 0}%
                    </div>
                  </div>
                ))}
            </div>

            {/* Tabla */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Proveedor / empleado</th><th>Medio</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr>
                </thead>
                <tbody>
                  {gastos.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-s)' }}>No hay gastos registrados en este periodo</td></tr>
                    : gastos.map(g => (
                      <tr key={g.id_gasto}>
                        <td style={{ whiteSpace: 'nowrap' }}>{String(g.fecha).slice(0, 10)}</td>
                        <td><span className="badge badge-rosa">{g.categoria}</span></td>
                        <td>{g.descripcion}</td>
                        <td>{g.proveedor || <span style={{ color: 'var(--text-s)' }}>—</span>}</td>
                        <td style={{ textTransform: 'capitalize' }}>{g.medio_pago}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{pesos(g.monto)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(g)}>✏️</button>{' '}
                          <button className="btn btn-danger btn-sm" onClick={() => eliminar(g)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal gasto ─────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editando ? '✏️ Editar gasto' : '➕ Registrar gasto'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {errorModal && <div className="alert alert-error">{errorModal}</div>}
            <form onSubmit={guardar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-input" required value={form.id_categoria_gasto}
                    onChange={e => setForm({ ...form, id_categoria_gasto: +e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {categorias.filter(c => c.activo || c.id_categoria_gasto === form.id_categoria_gasto).map(c => (
                      <option key={c.id_categoria_gasto} value={c.id_categoria_gasto}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" required value={form.fecha} max={hoy()}
                    onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input className="form-input" required maxLength={255} value={form.descripcion}
                  placeholder="Ej: 20 kg de papa, turno de cocina del sábado..."
                  onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor o empleado</label>
                <input className="form-input" maxLength={120} value={form.proveedor}
                  placeholder="Opcional"
                  onChange={e => setForm({ ...form, proveedor: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Monto *</label>
                  <input type="number" className="form-input" required min={1} step={1} value={form.monto}
                    onChange={e => setForm({ ...form, monto: e.target.value === '' ? '' : +e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Medio de pago</label>
                  <select className="form-input" value={form.medio_pago}
                    onChange={e => setForm({ ...form, medio_pago: e.target.value })}>
                    {MEDIOS.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal categorías (parametrización) ───────────────── */}
      {modalCat && (
        <div className="modal-overlay" onClick={() => setModalCat(false)}>
          <div className="modal-box" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚙️ Categorías de gasto</div>
              <button className="modal-close" onClick={() => setModalCat(false)}>✕</button>
            </div>
            {errorCat && <div className="alert alert-error">{errorCat}</div>}

            <form onSubmit={crearCategoria} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="form-input" required maxLength={80} placeholder="Nueva categoría (ej: Mantenimiento)"
                value={nuevaCat.nombre} onChange={e => setNuevaCat({ ...nuevaCat, nombre: e.target.value })} />
              <input className="form-input" maxLength={255} placeholder="Descripción (opcional)"
                value={nuevaCat.descripcion} onChange={e => setNuevaCat({ ...nuevaCat, descripcion: e.target.value })} />
              <button className="btn btn-primary" type="submit">Agregar</button>
            </form>

            <div className="table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Nombre</th><th>Gastos</th><th>Activa</th><th></th></tr></thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.id_categoria_gasto} style={{ opacity: c.activo ? 1 : .55 }}>
                      <td>
                        {catEditando?.id_categoria_gasto === c.id_categoria_gasto
                          ? <input className="form-input" autoFocus value={catEditando.nombre}
                              onChange={e => setCatEditando({ ...catEditando, nombre: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && guardarCategoria(c, { nombre: catEditando.nombre })} />
                          : <>
                              <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                              {c.descripcion && <div style={{ fontSize: 11, color: 'var(--text-s)' }}>{c.descripcion}</div>}
                            </>}
                      </td>
                      <td>{c.num_gastos}</td>
                      <td>
                        <div className={`toggle-track${c.activo ? ' on' : ''}`}
                          title={c.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => guardarCategoria(c, { activo: !c.activo })}>
                          <div className="toggle-thumb" />
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {catEditando?.id_categoria_gasto === c.id_categoria_gasto
                          ? <>
                              <button className="btn btn-primary btn-sm" onClick={() => guardarCategoria(c, { nombre: catEditando.nombre })}>Guardar</button>{' '}
                              <button className="btn btn-secondary btn-sm" onClick={() => setCatEditando(null)}>✕</button>
                            </>
                          : <>
                              <button className="btn btn-secondary btn-sm" onClick={() => setCatEditando(c)}>✏️</button>{' '}
                              <button className="btn btn-danger btn-sm" disabled={c.num_gastos > 0}
                                title={c.num_gastos > 0 ? 'Tiene gastos: desactívala en lugar de eliminarla' : 'Eliminar'}
                                onClick={() => eliminarCategoria(c)}>🗑️</button>
                            </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 10 }}>
              Una categoría con gastos no se puede borrar; desactívala para que no aparezca al registrar nuevos gastos.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

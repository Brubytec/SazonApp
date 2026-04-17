import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

/* ── Emoji por categoría ─────────────────────────────────── */
const catEmoji = (nombre = '') => {
  const n = nombre.toLowerCase()
  if (n.includes('bebida') || n.includes('jugo') || n.includes('refresco')) return '🥤'
  if (n.includes('sopa') || n.includes('caldo') || n.includes('sancocho')) return '🍲'
  if (n.includes('entrada') || n.includes('aperitivo')) return '🥗'
  if (n.includes('postre') || n.includes('dulce')) return '🍮'
  if (n.includes('bandeja') || n.includes('especial')) return '🍛'
  if (n.includes('arroz')) return '🍚'
  if (n.includes('pollo')) return '🍗'
  if (n.includes('res') || n.includes('carne')) return '🥩'
  if (n.includes('cerdo') || n.includes('chuleta')) return '🥓'
  if (n.includes('mariscos') || n.includes('pescado')) return '🐟'
  return '🍽️'
}

const prodEmoji = (nombre = '', categoria = '') => {
  const n = nombre.toLowerCase()
  if (n.includes('jugo') || n.includes('limonada') || n.includes('naranjada')) return '🥤'
  if (n.includes('agua')) return '💧'
  if (n.includes('café') || n.includes('tinto')) return '☕'
  if (n.includes('sopa') || n.includes('caldo') || n.includes('sancocho')) return '🍲'
  if (n.includes('arroz')) return '🍚'
  if (n.includes('bandeja')) return '🍛'
  if (n.includes('pollo')) return '🍗'
  if (n.includes('res') || n.includes('carne') || n.includes('bistec')) return '🥩'
  if (n.includes('cerdo') || n.includes('chuleta')) return '🥓'
  if (n.includes('pescado') || n.includes('trucha')) return '🐟'
  if (n.includes('empanada') || n.includes('tamale')) return '🫔'
  if (n.includes('postre') || n.includes('torta') || n.includes('flan')) return '🍮'
  if (n.includes('ensalada')) return '🥗'
  return catEmoji(categoria)
}

export default function Menu() {
  const [productos,  setProductos]  = useState([])
  const [categorias, setCategorias] = useState([])
  const [catActiva,  setCatActiva]  = useState(null)
  const [modal,      setModal]      = useState(false)
  const [editando,   setEditando]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [msg,        setMsg]        = useState({ tipo: '', texto: '' })
  const [form,       setForm]       = useState({ id_categoria: '', nombre: '', descripcion: '', precio: '', disponible: true })

  const cargar = async () => {
    try {
      const [p, c] = await Promise.all([
        api.get('/productos'),
        api.get('/productos/categorias')
      ])
      setProductos(p.data)
      setCategorias(c.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const productosFiltrados = catActiva
    ? productos.filter(p => p.id_categoria === catActiva)
    : productos

  const abrirModal = (prod = null) => {
    setMsg({ tipo: '', texto: '' })
    setEditando(prod)
    setForm(prod
      ? { id_categoria: prod.id_categoria, nombre: prod.nombre, descripcion: prod.descripcion || '', precio: prod.precio, disponible: prod.disponible }
      : { id_categoria: '', nombre: '', descripcion: '', precio: '', disponible: true })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await api.put(`/productos/${editando.id_producto}`, form)
      else          await api.post('/productos', form)
      setMsg({ tipo: 'success', texto: editando ? '✅ Producto actualizado' : '✅ Producto creado' })
      setModal(false)
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar' })
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try { await api.delete(`/productos/${id}`); cargar() }
    catch (e) { alert(e.response?.data?.error || 'Error al eliminar') }
  }

  const toggleDisponible = async (prod) => {
    try {
      await api.put(`/productos/${prod.id_producto}`, { ...prod, disponible: !prod.disponible })
      cargar()
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Menú y Productos</div>
            <div className="topbar-sub">{productos.length} productos · {categorias.length} categorías</div>
          </div>
          <button className="btn btn-primary" onClick={() => abrirModal()}>➕ Nuevo producto</button>
        </div>

        <div className="page-body">
          {msg.texto && !modal && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

          {/* ── Pills de categorías ─────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              onClick={() => setCatActiva(null)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: !catActiva ? 'var(--primary)' : 'var(--card-bg)',
                color: !catActiva ? '#fff' : 'var(--text-s)',
                boxShadow: !catActiva ? '0 2px 10px rgba(190,24,93,.35)' : 'none',
                transition: '.15s'
              }}>
              Todos ({productos.length})
            </button>
            {categorias.map(c => {
              const count = productos.filter(p => p.id_categoria === c.id_categoria).length
              const active = catActiva === c.id_categoria
              return (
                <button key={c.id_categoria}
                  onClick={() => setCatActiva(active ? null : c.id_categoria)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: active ? 'var(--primary)' : 'var(--card-bg)',
                    color: active ? '#fff' : 'var(--text-s)',
                    boxShadow: active ? '0 2px 10px rgba(190,24,93,.35)' : 'none',
                    transition: '.15s'
                  }}>
                  {catEmoji(c.nombre)} {c.nombre} ({count})
                </button>
              )
            })}
          </div>

          {/* ── Grid de tarjetas ────────────────────────────── */}
          {productosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-s)', fontSize: 15 }}>
              No hay productos en esta categoría
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16
            }}>
              {productosFiltrados.map(p => (
                <div key={p.id_producto} style={{
                  background: 'var(--card-bg)',
                  borderRadius: 16,
                  border: `1.5px solid ${p.disponible ? 'var(--card-b)' : 'rgba(255,255,255,.06)'}`,
                  overflow: 'hidden',
                  opacity: p.disponible ? 1 : 0.55,
                  display: 'flex', flexDirection: 'column',
                  transition: '.2s',
                  boxShadow: '0 2px 12px rgba(0,0,0,.18)'
                }}>
                  {/* Cabecera oscura con icono */}
                  <div style={{
                    background: 'linear-gradient(135deg, #2d1045, #1a0a2e)',
                    padding: '22px 0 16px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'rgba(190,24,93,.18)',
                      border: '2px solid rgba(190,24,93,.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30, margin: '0 auto',
                      boxShadow: '0 4px 16px rgba(190,24,93,.25)'
                    }}>
                      {prodEmoji(p.nombre, p.categoria)}
                    </div>
                    {/* Badge estado */}
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: p.disponible ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)',
                      border: `1px solid ${p.disponible ? '#22c55e' : '#ef4444'}`,
                      borderRadius: 20, padding: '2px 8px',
                      fontSize: 10, fontWeight: 700,
                      color: p.disponible ? '#4ade80' : '#f87171',
                      letterSpacing: '.04em'
                    }}>
                      {p.disponible ? 'ACTIVO' : 'INACTIVO'}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-s)', flex: 1, lineHeight: 1.4, minHeight: 28 }}>
                      {p.descripcion || <span style={{ fontStyle: 'italic', opacity: .5 }}>Sin descripción</span>}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: 'rgba(190,24,93,.15)',
                        border: '1px solid rgba(190,24,93,.3)',
                        color: '#f9a8d4', borderRadius: 6, padding: '2px 8px'
                      }}>
                        {p.categoria}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#f9a8d4' }}>
                        ${Number(p.precio).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{
                    borderTop: '1px solid var(--card-b)',
                    padding: '10px 12px',
                    display: 'flex', gap: 6, alignItems: 'center'
                  }}>
                    {/* Toggle disponible */}
                    <div
                      onClick={() => toggleDisponible(p)}
                      title={p.disponible ? 'Desactivar' : 'Activar'}
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: p.disponible ? '#16a34a' : 'rgba(255,255,255,.15)',
                        cursor: 'pointer', position: 'relative', transition: '.2s', flexShrink: 0
                      }}>
                      <div style={{
                        position: 'absolute', top: 2,
                        left: p.disponible ? 18 : 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'white', transition: '.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,.3)'
                      }}/>
                    </div>
                    <div style={{ flex: 1 }} />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => abrirModal(p)}
                      style={{ padding: '5px 10px', fontSize: 12 }}>
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => eliminar(p.id_producto)}
                      style={{ padding: '5px 10px', fontSize: 12 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal producto ───────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editando ? '✏️ Editar producto' : '➕ Nuevo producto'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" required value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-input" required value={form.id_categoria}
                    onChange={e => setForm({ ...form, id_categoria: +e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {catEmoji(c.nombre)} {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input type="number" className="form-input" required min={0} step={100}
                    value={form.precio} onChange={e => setForm({ ...form, precio: +e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" value={form.descripcion}
                  placeholder="Describe brevemente el plato..."
                  onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`toggle-track${form.disponible ? ' on' : ''}`}
                  onClick={() => setForm({ ...form, disponible: !form.disponible })}>
                  <div className="toggle-thumb" />
                </div>
                <label className="form-label" style={{ margin: 0 }}>
                  {form.disponible ? 'Disponible en menú' : 'No disponible'}
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

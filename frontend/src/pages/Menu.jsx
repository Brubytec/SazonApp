import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function Menu() {
  const [productos,   setProductos]   = useState([])
  const [categorias,  setCategorias]  = useState([])
  const [catActiva,   setCatActiva]   = useState(null)
  const [modal,       setModal]       = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [msg, setMsg] = useState({ tipo:'', texto:'' })
  const [form, setForm] = useState({ id_categoria:'', nombre:'', descripcion:'', precio:'', disponible:true })

  const cargar = async () => {
    try {
      const [p, c] = await Promise.all([
        api.get('/productos'),
        api.get('/productos/categorias')
      ])
      setProductos(p.data)
      setCategorias(c.data)
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const productosFiltrados = catActiva
    ? productos.filter(p => p.id_categoria === catActiva)
    : productos

  const abrirModal = (prod = null) => {
    setMsg({ tipo:'', texto:'' })
    setEditando(prod)
    setForm(prod
      ? { id_categoria: prod.id_categoria, nombre: prod.nombre, descripcion: prod.descripcion||'', precio: prod.precio, disponible: prod.disponible }
      : { id_categoria:'', nombre:'', descripcion:'', precio:'', disponible:true })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await api.put(`/productos/${editando.id_producto}`, form)
      else          await api.post('/productos', form)
      setMsg({ tipo:'success', texto: editando ? '✅ Producto actualizado' : '✅ Producto creado' })
      setModal(false)
      cargar()
    } catch(err) {
      setMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al guardar' })
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try { await api.delete(`/productos/${id}`); cargar() }
    catch(e){ alert(e.response?.data?.error || 'Error al eliminar') }
  }

  const toggleDisponible = async (prod) => {
    try {
      await api.put(`/productos/${prod.id_producto}`, { ...prod, disponible: !prod.disponible })
      cargar()
    } catch(e){ console.error(e) }
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

          {/* Pills de categorías */}
          <div className="cat-pills">
            <div className={`cat-pill${!catActiva?' active':''}`} onClick={() => setCatActiva(null)}>Todos</div>
            {categorias.map(c => (
              <div key={c.id_categoria} className={`cat-pill${catActiva===c.id_categoria?' active':''}`}
                onClick={() => setCatActiva(c.id_categoria)}>
                {c.nombre}
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Categoría</th><th>Descripción</th><th>Precio</th><th>Disponible</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => (
                  <tr key={p.id_producto} style={{ opacity: p.disponible?1:.55 }}>
                    <td><strong>{p.nombre}</strong></td>
                    <td><span className="badge badge-rosa">{p.categoria}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-s)', maxWidth:200 }}>{p.descripcion || '—'}</td>
                    <td>${Number(p.precio).toLocaleString('es-CO')}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div className={`toggle-track${p.disponible?' on':''}`} onClick={() => toggleDisponible(p)}>
                          <div className="toggle-thumb"/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, color: p.disponible?'var(--verde)':'var(--gris)' }}>
                          {p.disponible ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(p)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id_producto)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal producto */}
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
                  onChange={e => setForm({...form, nombre:e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-input" required value={form.id_categoria}
                    onChange={e => setForm({...form, id_categoria:+e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input type="number" className="form-input" required min={0} step={100}
                    value={form.precio} onChange={e => setForm({...form, precio:+e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" value={form.descripcion}
                  onChange={e => setForm({...form, descripcion:e.target.value})} />
              </div>
              <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className={`toggle-track${form.disponible?' on':''}`}
                  onClick={() => setForm({...form, disponible:!form.disponible})}>
                  <div className="toggle-thumb"/>
                </div>
                <label className="form-label" style={{ margin:0 }}>
                  {form.disponible ? 'Disponible en menú' : 'No disponible'}
                </label>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
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

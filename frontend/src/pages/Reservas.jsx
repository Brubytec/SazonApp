import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

const HOY = new Date().toISOString().split('T')[0]

export default function Reservas() {
  const [reservas, setReservas] = useState([])
  const [mesas,    setMesas]    = useState([])
  const [fecha,    setFecha]    = useState(HOY)
  const [modal,    setModal]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [form, setForm] = useState({ nombre_cliente:'', telefono:'', id_mesa:'', fecha:HOY, hora:'12:00', num_personas:2, observaciones:'' })
  const [msg, setMsg] = useState({ tipo:'', texto:'' })

  const cargar = async () => {
    try {
      const [r, m] = await Promise.all([
        api.get(`/reservas?fecha=${fecha}`),
        api.get('/mesas/disponibles')
      ])
      setReservas(r.data)
      setMesas(m.data)
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [fecha])

  const crear = async (e) => {
    e.preventDefault()
    try {
      await api.post('/reservas', form)
      setMsg({ tipo:'success', texto:'✅ Reserva registrada exitosamente' })
      setModal(false)
      setForm({ nombre_cliente:'', telefono:'', id_mesa:'', fecha:HOY, hora:'12:00', num_personas:2, observaciones:'' })
      cargar()
    } catch(err) {
      setMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al crear reserva' })
    }
  }

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await api.delete(`/reservas/${id}`)
      cargar()
    } catch(e){ alert(e.response?.data?.error || 'Error') }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/reservas/${id}/estado`, { estado })
      cargar()
    } catch(e){ alert(e.response?.data?.error || 'Error') }
  }

  const badgeCls = { confirmada:'badge-azul', pendiente:'badge-amarillo', cancelada:'badge-rojo', completada:'badge-verde' }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Gestión de Reservas</div>
            <div className="topbar-sub">{reservas.length} reservas para la fecha seleccionada</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setMsg({tipo:'',texto:''}); setModal(true) }}>➕ Nueva reserva</button>
        </div>

        <div className="page-body">
          {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

          {/* Filtro fecha */}
          <div className="card" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, padding:'12px 16px' }}>
            <label className="form-label" style={{ margin:0 }}>📅 Fecha:</label>
            <input type="date" className="form-input" style={{ width:'auto' }} value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Mesa</th><th>Hora</th><th>Personas</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {reservas.length === 0
                  ? <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-s)',padding:30}}>Sin reservas para esta fecha</td></tr>
                  : reservas.map(r => (
                    <tr key={r.id_reserva} style={{ opacity: r.estado==='cancelada'?.5:1 }}>
                      <td style={{ fontFamily:'monospace', fontSize:12 }}>RES-{String(r.id_reserva).padStart(3,'0')}</td>
                      <td>{r.cliente}</td>
                      <td>{r.telefono || '—'}</td>
                      <td>Mesa {r.numero_mesa}</td>
                      <td>{r.hora?.slice(0,5)}</td>
                      <td>{r.num_personas}</td>
                      <td>
                        <select className="form-input" style={{ width:'auto', padding:'3px 8px', fontSize:12 }}
                          value={r.estado} onChange={e => cambiarEstado(r.id_reserva, e.target.value)}
                          disabled={r.estado==='cancelada'}>
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </td>
                      <td>
                        {r.estado !== 'cancelada' && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelar(r.id_reserva)}>✕ Cancelar</button>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal nueva reserva */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📅 Nueva Reserva</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={crear}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Nombre del cliente *</label>
                  <input className="form-input" required placeholder="Ej. Ana Torres"
                    value={form.nombre_cliente} onChange={e => setForm({...form, nombre_cliente:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" placeholder="300-000-0000"
                    value={form.telefono} onChange={e => setForm({...form, telefono:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" required
                    value={form.fecha} onChange={e => setForm({...form, fecha:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input type="time" className="form-input" required
                    value={form.hora} onChange={e => setForm({...form, hora:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">N° personas *</label>
                  <input type="number" className="form-input" min={1} required
                    value={form.num_personas} onChange={e => setForm({...form, num_personas:+e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mesa *</label>
                  <select className="form-input" required
                    value={form.id_mesa} onChange={e => setForm({...form, id_mesa:e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {mesas.map(m => <option key={m.id_mesa} value={m.id_mesa}>Mesa {m.numero} (cap. {m.capacidad})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <input className="form-input" placeholder="Ej. Celebración de cumpleaños"
                  value={form.observaciones} onChange={e => setForm({...form, observaciones:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar reserva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function Mesas() {
  const [mesas,   setMesas]   = useState([])
  const [detalle, setDetalle] = useState(null)
  const [pedido,  setPedido]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState(null)
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const { data } = await api.get('/mesas')
      setMesas(data)
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const seleccionar = async (mesa) => {
    setSeleccionada(mesa.id_mesa)
    setDetalle(null)
    setPedido(null)
    if (mesa.estado === 'ocupada' && mesa.id_pedido) {
      try {
        const { data } = await api.get(`/pedidos/${mesa.id_pedido}`)
        setPedido(data.pedido)
        setDetalle(data.detalle)
      } catch(e){ console.error(e) }
    }
  }

  const abrirPedido = async (idMesa) => {
    try {
      await api.post('/pedidos', { id_mesa: idMesa })
      await cargar()
    } catch(e){ alert(e.response?.data?.error || 'Error al abrir pedido') }
  }

  const eliminarProducto = async (idDetalle) => {
    try {
      await api.delete(`/pedidos/${pedido.id_pedido}/productos/${idDetalle}`)
      const { data } = await api.get(`/pedidos/${pedido.id_pedido}`)
      setDetalle(data.detalle)
      setPedido(data.pedido)
    } catch(e){ alert(e.response?.data?.error || 'Error') }
  }

  const coloresMesa = { disponible:'verde', ocupada:'rojo', reservada:'rosa' }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Mesas y Pedidos</div>
            <div className="topbar-sub">Selecciona una mesa para ver su pedido activo</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span className="badge badge-verde">🟢 {mesas.filter(m=>m.estado==='disponible').length} Disponibles</span>
            <span className="badge badge-rojo">🔴 {mesas.filter(m=>m.estado==='ocupada').length} Ocupadas</span>
            <span className="badge badge-rosa">🩷 {mesas.filter(m=>m.estado==='reservada').length} Reservadas</span>
            <button className="btn btn-secondary btn-sm" onClick={cargar}>🔄</button>
          </div>
        </div>

        <div className="page-body">
          {/* Grid de mesas */}
          <div className="mesas-grid">
            {mesas.map(m => (
              <div key={m.id_mesa}
                className={`mesa-card ${m.estado}${seleccionada===m.id_mesa?' selected':''}`}
                onClick={() => seleccionar(m)}>
                <div className="mesa-num">Mesa {m.numero}</div>
                <div className="mesa-cap">👥 Cap. {m.capacidad}</div>
                <span className={`badge badge-${coloresMesa[m.estado]}`}>{m.estado}</span>
                {m.estado === 'disponible' && (
                  <div style={{ marginTop:8 }}>
                    <button className="btn btn-success btn-sm"
                      onClick={e => { e.stopPropagation(); abrirPedido(m.id_mesa) }}>
                      + Abrir pedido
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detalle del pedido */}
          {pedido && detalle && (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800 }}>
                    Mesa {mesas.find(m=>m.id_mesa===seleccionada)?.numero} — Pedido #{String(pedido.id_pedido).padStart(6,'0')}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-s)', marginTop:3 }}>
                    Abierto hace {Math.floor((Date.now() - new Date(pedido.fecha_hora))/60000)} min
                    &nbsp;·&nbsp;<span className="badge badge-rojo">Ocupada</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-success btn-sm"
                    onClick={() => navigate(`/factura/${pedido.id_pedido}`)}>
                    🧾 Generar factura
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th><th></th></tr></thead>
                  <tbody>
                    {detalle.map(d => (
                      <tr key={d.id_detalle ?? d.producto}>
                        <td>{d.producto}</td>
                        <td>{d.cantidad}</td>
                        <td>${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
                        <td>${Number(d.subtotal).toLocaleString('es-CO')}</td>
                        <td>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => eliminarProducto(d.id_detalle)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background:'var(--primary-l)', borderRadius:9, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--primary)' }}>Total acumulado</span>
                <span style={{ fontSize:24, fontWeight:800, color:'var(--primary-d)' }}>
                  ${Number(pedido.total).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          )}

          {seleccionada && !pedido && mesas.find(m=>m.id_mesa===seleccionada)?.estado !== 'ocupada' && (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-s)' }}>
              Esta mesa está {mesas.find(m=>m.id_mesa===seleccionada)?.estado}. Sin pedido activo.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

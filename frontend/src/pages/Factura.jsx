import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

const Logo = () => (
  <svg width="50" height="50" viewBox="0 0 48 48">
    <ellipse cx="24" cy="32" rx="20" ry="6" fill="#9d174d" opacity=".25"/>
    <path d="M4 28 Q4 14 24 14 Q44 14 44 28 Z" fill="#be185d"/>
    <path d="M6 28 Q6 16 24 16 Q42 16 42 28 Z" fill="#f472b6"/>
    <rect x="6" y="27" width="36" height="5" rx="2.5" fill="#be185d"/>
    <circle cx="15" cy="22" r="3" fill="#fff" opacity=".25"/>
  </svg>
)

export default function Factura() {
  const { idPedido } = useParams()
  const navigate     = useNavigate()
  const [data,      setData]      = useState(null)
  const [historial, setHistorial] = useState([])
  const [medioPago, setMedioPago] = useState('efectivo')
  const [loading,   setLoading]   = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [msg, setMsg] = useState({ tipo:'', texto:'' })

  useEffect(() => {
    Promise.all([
      api.get(`/pedidos/${idPedido}`),
      api.get('/facturas?fechaInicio=&fechaFin=')
    ]).then(([p, f]) => {
      setData(p.data)
      setHistorial(f.data.slice(0, 5))
    }).catch(e => console.error(e))
    .finally(() => setLoading(false))
  }, [idPedido])

  const generar = async () => {
    if (!confirm(`¿Generar factura con pago en ${medioPago}?`)) return
    setProcesando(true)
    try {
      const { data: res } = await api.post('/facturas', {
        id_pedido: +idPedido,
        medio_pago: medioPago
      })
      setMsg({ tipo:'success', texto:`✅ ${res.numero_factura} generada exitosamente. Mesa liberada.` })
      setTimeout(() => navigate('/mesas'), 2000)
    } catch(err) {
      setMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al generar factura' })
    } finally { setProcesando(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>
  if (!data)   return <div style={{padding:40,color:'var(--text-s)'}}>Pedido no encontrado</div>

  const { pedido, detalle } = data
  const badgePago = { efectivo:'badge-verde', transferencia:'badge-azul', tarjeta:'badge-gris' }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Generar Factura</div>
            <div className="topbar-sub">Mesa {pedido.numero_mesa} · Pedido #{String(pedido.id_pedido).padStart(6,'0')}</div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/mesas')}>← Volver a Mesas</button>
        </div>

        <div className="page-body">
          {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:18 }}>
            {/* Detalle consumo */}
            <div>
              <div className="section-title">📋 Detalle del consumo</div>
              <div className="table-wrap" style={{ marginBottom:16 }}>
                <table>
                  <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {detalle.map((d, i) => (
                      <tr key={i}>
                        <td>{d.producto}</td>
                        <td>{d.cantidad}</td>
                        <td>${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
                        <td>${Number(d.subtotal).toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'var(--primary-l)' }}>
                      <td colSpan={3} style={{ fontWeight:800, textAlign:'right', padding:'12px 14px', color:'var(--primary)' }}>TOTAL</td>
                      <td style={{ fontWeight:900, fontSize:16, color:'var(--primary-d)' }}>
                        ${Number(pedido.total).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="section-title">🗂️ Historial de facturas recientes</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>N° Factura</th><th>Mesa</th><th>Fecha</th><th>Total</th><th>Pago</th></tr></thead>
                  <tbody>
                    {historial.length === 0
                      ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-s)'}}>Sin facturas registradas</td></tr>
                      : historial.map(f => (
                        <tr key={f.id_factura}>
                          <td style={{ fontFamily:'monospace', fontSize:12 }}>{f.numero_factura}</td>
                          <td>Mesa {f.numero_mesa}</td>
                          <td style={{ fontSize:12 }}>{new Date(f.fecha_hora).toLocaleString('es-CO')}</td>
                          <td>${Number(f.total).toLocaleString('es-CO')}</td>
                          <td><span className={`badge ${badgePago[f.medio_pago]}`}>{f.medio_pago}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel cobro */}
            <div className="card" style={{ height:'fit-content' }}>
              <div style={{ textAlign:'center', marginBottom:18, paddingBottom:16, borderBottom:'2px dashed var(--border)' }}>
                <Logo />
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginTop:6 }}>Sazón y Sabor</div>
                <div style={{ fontSize:12, color:'var(--text-s)' }}>Comida típica colombiana · Popayán, Cauca</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', marginTop:6 }}>
                  FAC-{String(pedido.id_pedido).padStart(6,'0')} · Mesa {pedido.numero_mesa}
                </div>
                <div style={{ fontSize:11, color:'var(--text-s)', marginTop:4 }}>
                  {new Date().toLocaleString('es-CO')}
                </div>
              </div>

              <div style={{ fontSize:11, fontWeight:800, color:'var(--text-s)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>
                Medio de pago
              </div>
              <div className="pago-opts">
                {['efectivo','transferencia','tarjeta'].map(mp => (
                  <div key={mp} className={`pago-opt${medioPago===mp?' selected':''}`} onClick={() => setMedioPago(mp)}>
                    <div className="pago-opt-icon">{mp==='efectivo'?'💵':mp==='transferencia'?'📲':'💳'}</div>
                    <div className="pago-opt-label" style={{ textTransform:'capitalize' }}>{mp}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--primary-l)', borderRadius:10, padding:'18px', textAlign:'center', margin:'12px 0' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'var(--primary)', letterSpacing:'.06em', textTransform:'uppercase' }}>Total a cobrar</div>
                <div style={{ fontSize:40, fontWeight:900, color:'var(--primary-d)', margin:'4px 0' }}>
                  ${Number(pedido.total).toLocaleString('es-CO')}
                </div>
                <div style={{ fontSize:11, color:'var(--text-s)' }}>{detalle.length} productos · Mesa {pedido.numero_mesa}</div>
              </div>

              <button className="btn btn-success" onClick={generar} disabled={procesando}
                style={{ width:'100%', justifyContent:'center', padding:14, fontSize:14, fontWeight:700, borderRadius:9 }}>
                {procesando ? '⏳ Procesando...' : '✅ Confirmar y generar factura'}
              </button>
              <div style={{ marginTop:10, textAlign:'center', fontSize:11, color:'var(--text-s)' }}>
                La mesa pasará automáticamente a disponible
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

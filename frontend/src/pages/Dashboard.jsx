import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [reservas, setReservas] = useState([])
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const [r, res, ped] = await Promise.all([
        api.get('/dashboard/resumen'),
        api.get('/reservas'),
        api.get('/pedidos/activos')
      ])
      setResumen(r.data)
      setReservas(res.data)
      setPedidos(ped.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const badgeReserva = (estado) => {
    const map = { confirmada:'badge-azul', pendiente:'badge-amarillo', cancelada:'badge-rojo', completada:'badge-verde' }
    return map[estado] || 'badge-gris'
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Dashboard operacional</div>
            <div className="topbar-sub">{new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · Turno activo</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={cargar}>🔄 Actualizar</button>
        </div>

        <div className="page-body">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-verde">
              <div className="kpi-icon">🟢</div>
              <div className="kpi-label">Mesas disponibles</div>
              <div className="kpi-value">{resumen?.mesas_disponibles ?? 0}</div>
              <div className="kpi-sub">de {(resumen?.mesas_disponibles||0)+(resumen?.mesas_ocupadas||0)+(resumen?.mesas_reservadas||0)} totales</div>
            </div>
            <div className="kpi-card kpi-rojo">
              <div className="kpi-icon">🔴</div>
              <div className="kpi-label">Mesas ocupadas</div>
              <div className="kpi-value">{resumen?.mesas_ocupadas ?? 0}</div>
              <div className="kpi-sub">con pedido activo</div>
            </div>
            <div className="kpi-card kpi-rosa">
              <div className="kpi-icon">📅</div>
              <div className="kpi-label">Reservas hoy</div>
              <div className="kpi-value">{resumen?.reservas_hoy ?? 0}</div>
              <div className="kpi-sub">{resumen?.pedidos_activos ?? 0} pedidos activos</div>
            </div>
            <div className="kpi-card kpi-amber">
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Ventas del día</div>
              <div className="kpi-value">${Number(resumen?.ventas_hoy||0).toLocaleString('es-CO')}</div>
              <div className="kpi-sub">{resumen?.facturas_hoy ?? 0} facturas emitidas</div>
            </div>
          </div>

          {/* Tablas */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div className="section-title">📅 Reservas de hoy</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Cliente</th><th>Mesa</th><th>Hora</th><th>Estado</th></tr></thead>
                  <tbody>
                    {reservas.length === 0
                      ? <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-s)'}}>Sin reservas hoy</td></tr>
                      : reservas.map(r => (
                        <tr key={r.id_reserva}>
                          <td>{r.cliente}</td>
                          <td>Mesa {r.numero_mesa}</td>
                          <td>{r.hora?.slice(0,5)}</td>
                          <td><span className={`badge ${badgeReserva(r.estado)}`}>{r.estado}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="section-title">🍽️ Pedidos activos</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Mesa</th><th>Tiempo</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {pedidos.length === 0
                      ? <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-s)'}}>Sin pedidos activos</td></tr>
                      : pedidos.map(p => (
                        <tr key={p.id_pedido}>
                          <td><strong>Mesa {p.numero_mesa}</strong></td>
                          <td>{p.minutos_abierto} min</td>
                          <td>${Number(p.total).toLocaleString('es-CO')}</td>
                          <td><button className="btn btn-primary btn-sm" onClick={() => navigate('/mesas')}>Ver</button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

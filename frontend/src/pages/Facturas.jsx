import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function Facturas() {
  const [facturas, setFacturas] = useState([])
  const [ingresosDia, setIngresosDia] = useState([])
  const [ingresosCategorias, setIngresosCategorias] = useState([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const [f, d, c] = await Promise.all([
        api.get('/facturas', { params: { fechaInicio, fechaFin } }),
        api.get('/facturas/ingresos/dia'),
        api.get('/facturas/ingresos/categorias')
      ])
      setFacturas(f.data)
      setIngresosDia(d.data)
      setIngresosCategorias(c.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [fechaInicio, fechaFin])

  const verDetalle = (id) => {
    navigate(`/factura/${id}`)
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Facturas e Ingresos</div>
            <div className="topbar-sub">Historial de facturas y reportes de ingresos</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={cargar}>🔄 Actualizar</button>
        </div>

        <div className="page-body">
          {/* Filtros */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label">Fecha inicio</label>
                <input type="date" className="form-input" value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Fecha fin</label>
                <input type="date" className="form-input" value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)} />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button className="btn btn-primary btn-sm" onClick={cargar}>Filtrar</button>
              </div>
            </div>
          </div>

          {/* KPIs de ingresos */}
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <div className="kpi-card kpi-verde">
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Ingresos hoy</div>
              <div className="kpi-value">${ingresosDia.reduce((sum, d) => sum + Number(d.total_ingresos), 0).toLocaleString('es-CO')}</div>
              <div className="kpi-sub">{ingresosDia.reduce((sum, d) => sum + Number(d.num_facturas), 0)} facturas</div>
            </div>
            <div className="kpi-card kpi-amber">
              <div className="kpi-icon">📊</div>
              <div className="kpi-label">Total categorías</div>
              <div className="kpi-value">{ingresosCategorias.length}</div>
              <div className="kpi-sub">Categorías con ventas</div>
            </div>
          </div>

          {/* Historial de facturas */}
          <div className="section-title">📄 Historial de Facturas</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Mesa</th>
                  <th>Total</th>
                  <th>Medio de pago</th>
                  <th>Cobrado por</th>
                  <th>Fecha/Hora</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-s)' }}>
                      No hay facturas en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  facturas.map(f => (
                    <tr key={f.id_factura}>
                      <td><strong>{f.numero_factura}</strong></td>
                      <td>Mesa {f.numero_mesa}</td>
                      <td>${Number(f.total).toLocaleString('es-CO')}</td>
                      <td>
                        <span className={`badge ${f.medio_pago === 'efectivo' ? 'badge-verde' : f.medio_pago === 'tarjeta' ? 'badge-azul' : 'badge-rosa'}`}>
                          {f.medio_pago}
                        </span>
                      </td>
                      <td>{f.cobrado_por}</td>
                      <td>{new Date(f.fecha_hora).toLocaleString('es-CO')}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => verDetalle(f.id_factura)}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ingresos por día */}
          {ingresosDia.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 24 }}>📈 Ingresos por Día</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Medio de pago</th>
                      <th>Total</th>
                      <th>Facturas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosDia.map(d => (
                      <tr key={`${d.fecha}-${d.medio_pago}`}>
                        <td>{new Date(d.fecha).toLocaleDateString('es-CO')}</td>
                        <td>
                          <span className={`badge ${d.medio_pago === 'efectivo' ? 'badge-verde' : d.medio_pago === 'tarjeta' ? 'badge-azul' : 'badge-rosa'}`}>
                            {d.medio_pago === 'efectivo' ? '💵' : d.medio_pago === 'tarjeta' ? '💳' : '📲'} {d.medio_pago}
                          </span>
                        </td>
                        <td>${Number(d.total_ingresos).toLocaleString('es-CO')}</td>
                        <td>{d.num_facturas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Ingresos por categoría */}
          {ingresosCategorias.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 24 }}>🍽️ Ingresos por Categoría</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Total vendido</th>
                      <th>Cantidad productos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosCategorias.map(c => (
                      <tr key={c.categoria}>
                        <td>{c.categoria}</td>
                        <td>${Number(c.ingresos_categoria).toLocaleString('es-CO')}</td>
                        <td>{c.unidades_vendidas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
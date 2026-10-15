import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { valor: 'mesero',        label: 'Mesero',        desc: 'Toma pedidos desde la app Android', badge: 'badge-azul' },
  { valor: 'cajero',        label: 'Cajero',        desc: 'Mesas, pedidos y facturación',      badge: 'badge-amarillo' },
  { valor: 'administrador', label: 'Administrador', desc: 'Acceso total, incluye gastos y usuarios', badge: 'badge-rosa' },
]
const rolInfo = (rol) => ROLES.find(r => r.valor === rol) || { label: rol, badge: 'badge-gris' }

const formVacio = { nombre: '', email: '', password: '', rol: 'mesero' }

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ tipo: '', texto: '' })

  const [modal, setModal]       = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm]         = useState(formVacio)
  const [errorModal, setErrorModal] = useState('')

  const [modalClave, setModalClave] = useState(null)
  const [clave, setClave]           = useState('')

  const cargar = async () => {
    try { setUsuarios((await api.get('/usuarios')).data) }
    catch (e) { setMsg({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo cargar la lista de usuarios' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirModal = (u = null) => {
    setErrorModal('')
    setEditando(u)
    setForm(u ? { nombre: u.nombre, email: u.email, password: '', rol: u.rol } : formVacio)
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id_usuario}`, { nombre: form.nombre, email: form.email, rol: form.rol })
      } else {
        await api.post('/usuarios', form)
      }
      setModal(false)
      setMsg({ tipo: 'success', texto: editando ? '✅ Usuario actualizado' : `✅ Usuario ${form.email} creado` })
      cargar()
    } catch (err) { setErrorModal(err.response?.data?.error || 'Error al guardar') }
  }

  const cambiarEstado = async (u) => {
    try {
      await api.patch(`/usuarios/${u.id_usuario}/estado`, { activo: !u.activo })
      cargar()
    } catch (e) { setMsg({ tipo: 'error', texto: e.response?.data?.error || 'Error al cambiar el estado' }) }
  }

  const guardarClave = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/usuarios/${modalClave.id_usuario}/password`, { password: clave })
      setMsg({ tipo: 'success', texto: `✅ Contraseña de ${modalClave.nombre} actualizada` })
      setModalClave(null)
    } catch (err) { setErrorModal(err.response?.data?.error || 'Error al cambiar la contraseña') }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner"/></div>

  const conteo = (rol) => usuarios.filter(u => u.rol === rol && u.activo).length

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Usuarios</div>
            <div className="topbar-sub">
              {conteo('administrador')} administradores · {conteo('cajero')} cajeros · {conteo('mesero')} meseros activos
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => abrirModal()}>➕ Nuevo usuario</button>
        </div>

        <div className="page-body">
          {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Activo</th><th>Creado</th><th></th></tr></thead>
              <tbody>
                {usuarios.map(u => {
                  const esYo = u.id_usuario === yo?.id_usuario
                  return (
                    <tr key={u.id_usuario} style={{ opacity: u.activo ? 1 : .55 }}>
                      <td style={{ fontWeight: 600 }}>{u.nombre}{esYo && <span style={{ color: 'var(--text-s)', fontWeight: 400 }}> (tú)</span>}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${rolInfo(u.rol).badge}`}>{rolInfo(u.rol).label}</span></td>
                      <td>
                        <div className={`toggle-track${u.activo ? ' on' : ''}`}
                          style={{ cursor: esYo ? 'not-allowed' : 'pointer' }}
                          title={esYo ? 'No puedes desactivar tu propio usuario' : (u.activo ? 'Desactivar' : 'Activar')}
                          onClick={() => !esYo && cambiarEstado(u)}>
                          <div className="toggle-thumb" />
                        </div>
                      </td>
                      <td>{String(u.created_at).slice(0, 10)}</td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(u)}>✏️ Editar</button>{' '}
                        <button className="btn btn-secondary btn-sm" onClick={() => { setErrorModal(''); setClave(''); setModalClave(u) }}>🔑 Contraseña</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 10 }}>
            Los usuarios no se eliminan para conservar el historial de pedidos y facturas: desactívalos y ya no podrán iniciar sesión.
          </div>
        </div>
      </div>

      {/* ── Modal crear / editar ───────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editando ? '✏️ Editar usuario' : '➕ Nuevo usuario'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {errorModal && <div className="alert alert-error">{errorModal}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input className="form-input" required maxLength={100} value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Correo (usuario de ingreso) *</label>
                <input type="email" className="form-input" required maxLength={100} value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editando && (
                <div className="form-group">
                  <label className="form-label">Contraseña * (mínimo 8 caracteres)</label>
                  <input type="password" className="form-input" required minLength={8} value={form.password}
                    autoComplete="new-password"
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ROLES.map(r => {
                    const bloqueado = editando?.id_usuario === yo?.id_usuario && r.valor !== 'administrador'
                    return (
                      <label key={r.valor} style={{
                        display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px',
                        border: `2px solid ${form.rol === r.valor ? 'var(--primary)' : 'var(--border)'}`,
                        background: form.rol === r.valor ? 'var(--primary-l)' : 'var(--white)',
                        borderRadius: 8, cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? .5 : 1
                      }}>
                        <input type="radio" name="rol" value={r.valor} checked={form.rol === r.valor} disabled={bloqueado}
                          onChange={() => setForm({ ...form, rol: r.valor })} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-s)' }}>{r.desc}</div>
                        </div>
                      </label>
                    )
                  })}
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

      {/* ── Modal contraseña ───────────────────────────────── */}
      {modalClave && (
        <div className="modal-overlay" onClick={() => setModalClave(null)}>
          <div className="modal-box" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🔑 Nueva contraseña</div>
              <button className="modal-close" onClick={() => setModalClave(null)}>✕</button>
            </div>
            {errorModal && <div className="alert alert-error">{errorModal}</div>}
            <form onSubmit={guardarClave}>
              <div className="form-group">
                <label className="form-label">{modalClave.nombre} · mínimo 8 caracteres</label>
                <input type="password" className="form-input" required minLength={8} autoFocus
                  autoComplete="new-password" value={clave} onChange={e => setClave(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalClave(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

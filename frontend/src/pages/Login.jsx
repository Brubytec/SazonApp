import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Logo = () => (
  <svg width="72" height="72" viewBox="0 0 48 48">
    <ellipse cx="24" cy="32" rx="20" ry="6" fill="#9d174d" opacity=".25"/>
    <path d="M4 28 Q4 14 24 14 Q44 14 44 28 Z" fill="#be185d"/>
    <path d="M6 28 Q6 16 24 16 Q42 16 42 28 Z" fill="#f472b6"/>
    <rect x="6" y="27" width="36" height="5" rx="2.5" fill="#be185d"/>
    <path d="M18 11 Q19 8 18 5" stroke="#f9a8d4" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M24 10 Q25 7 24 4" stroke="#f9a8d4" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M30 11 Q31 8 30 5" stroke="#f9a8d4" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="15" cy="22" r="3" fill="#fff" opacity=".25"/>
  </svg>
)

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg, #1e0a2e 0%, #3d1a5c 50%, #1a0a2e 100%)',
      display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <div style={{
        background:'#fff', borderRadius:18, padding:'40px 36px',
        width:390, boxShadow:'0 24px 80px rgba(0,0,0,.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Logo />
          <div style={{ fontSize:24, fontWeight:900, color:'var(--primary)', marginTop:8 }}>SazonApp</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginTop:2 }}>Restaurante Sazón y Sabor</div>
          <div style={{ fontSize:12, color:'var(--text-s)', marginTop:4 }}>Sistema de gestión interno · Popayán, Cauca</div>
        </div>

        <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'0 0 20px' }}/>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" placeholder="admin@sazonysabor.co"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:12, fontSize:14, borderRadius:9, marginTop:4 }}>
            {loading ? '⏳ Verificando...' : '🔐 Ingresar al sistema'}
          </button>
        </form>

        <div style={{ textAlign:'center', fontSize:11, color:'#94a3b8', marginTop:16 }}>
          Acceso exclusivo para administradores autorizados
        </div>
      </div>
    </div>
  )
}

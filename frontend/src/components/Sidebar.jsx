import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Logo = () => (
  <svg width="38" height="38" viewBox="0 0 48 48">
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

const menuItems = [
  { to: '/',         icon: '📊', label: 'Dashboard' },
  { to: '/mesas',    icon: '🪑', label: 'Mesas y Pedidos' },
  { to: '/reservas', icon: '📅', label: 'Reservas' },
  { to: '/menu',     icon: '🍽️', label: 'Menú y Productos' },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside style={{
      width: 228, flexShrink: 0,
      background: 'var(--sidebar)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--sidebar-b)'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 18px', borderBottom: '1px solid var(--sidebar-b)', display:'flex', alignItems:'center', gap:10 }}>
        <Logo />
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>SazonApp</div>
          <div style={{ fontSize:10, color:'var(--sidebar-m)', marginTop:1 }}>Sazón y Sabor · Popayán</div>
        </div>
      </div>

      {/* Menú */}
      <nav style={{ flex:1, padding:'10px 0', overflowY:'auto' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--sidebar-m)', letterSpacing:'.1em', textTransform:'uppercase', padding:'12px 18px 4px' }}>Principal</div>
        {menuItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 18px', fontSize:13, textDecoration:'none',
              color: isActive ? '#f9a8d4' : 'var(--sidebar-t)',
              background: isActive ? 'rgba(190,24,93,.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: isActive ? 700 : 400,
              transition: '.12s'
            })}>
            <span style={{ fontSize:15, width:20, textAlign:'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'14px 18px', borderTop:'1px solid var(--sidebar-b)' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--sidebar-t)', marginBottom:6 }}>
          👤 {usuario?.nombre || 'Administrador'}
        </div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:3 }}>
          {usuario?.rol}
        </div>
        <button onClick={handleLogout}
          style={{ background:'none', border:'none', color:'#f87171', fontSize:12, cursor:'pointer', padding:0 }}>
          ⬅ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mesas     from './pages/Mesas'
import Reservas  from './pages/Reservas'
import Menu      from './pages/Menu'
import Factura   from './pages/Factura'
import Gastos    from './pages/Gastos'
import Usuarios  from './pages/Usuarios'

function RutaProtegida({ children, soloAdmin = false }) {
  const { token, usuario, cargando } = useAuth()
  if (cargando) return <div className="spinner-wrap"><div className="spinner"/></div>
  if (!token) return <Navigate to="/login" replace />
  if (soloAdmin && usuario?.rol !== 'administrador') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/mesas"    element={<RutaProtegida><Mesas /></RutaProtegida>} />
          <Route path="/reservas" element={<RutaProtegida><Reservas /></RutaProtegida>} />
          <Route path="/menu"     element={<RutaProtegida><Menu /></RutaProtegida>} />
          <Route path="/factura/:idPedido" element={<RutaProtegida><Factura /></RutaProtegida>} />
          <Route path="/gastos"   element={<RutaProtegida soloAdmin><Gastos /></RutaProtegida>} />
          <Route path="/usuarios" element={<RutaProtegida soloAdmin><Usuarios /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

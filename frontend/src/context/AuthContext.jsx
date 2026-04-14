import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token,   setToken]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('sazon_token')
    const u = localStorage.getItem('sazon_usuario')
    if (t && u) {
      setToken(t)
      setUsuario(JSON.parse(u))
    }
    setCargando(false)
  }, [])

  const login = (data) => {
    setToken(data.token)
    setUsuario(data.usuario)
    localStorage.setItem('sazon_token',   data.token)
    localStorage.setItem('sazon_usuario', JSON.stringify(data.usuario))
  }

  const logout = () => {
    setToken(null)
    setUsuario(null)
    localStorage.removeItem('sazon_token')
    localStorage.removeItem('sazon_usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

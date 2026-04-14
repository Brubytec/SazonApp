import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Inyecta el token JWT en cada petición automáticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sazon_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira, redirige al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sazon_token')
      localStorage.removeItem('sazon_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

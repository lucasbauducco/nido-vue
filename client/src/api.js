import axios from 'axios'
import store from '@/store'

// La URL del servidor sale de client/.env (VUE_APP_API_URL). Ver .env.example
const SERVER_URL = (process.env.VUE_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  timeout: 10000
})

// el token se lee en cada request, asi siempre esta actualizado (login/logout)
api.interceptors.request.use(config => {
  const token = store.getters.token
  if (token) config.headers.Authorization = token
  return config
})

// si el token vencio o es invalido, cerramos la sesion y vamos al login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401 && store.getters.token) {
      store.commit('logout')
      import('@/router').then(m => m.default.push('/login'))
    }
    return Promise.reject(error)
  }
)

// URL completa de una imagen subida al servidor
export const assetUrl = path => `${SERVER_URL}/${path}`

export default api

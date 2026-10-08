import axios from 'axios'
import { obtenerToken } from '../auth/token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = obtenerToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

export default api

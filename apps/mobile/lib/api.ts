import axios from 'axios'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

let getToken: (() => string | null) | null = null

export function setTokenGetter(fn: () => string | null) {
  getToken = fn
}

api.interceptors.request.use((config) => {
  const token = getToken?.()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

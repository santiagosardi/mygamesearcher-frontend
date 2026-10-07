import api from './api'
import type { AuthUser, LoginResponse, RegisterCredentials } from '../types/auth'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password })
  return response.data
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<AuthUser>('/auth/me')
  return response.data
}

export async function register(datos: RegisterCredentials): Promise<AuthUser> {
  const response = await api.post<AuthUser>('/auth/register', datos)
  return response.data
}

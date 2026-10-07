import api from './api'
import type { AuthUser, LoginResponse } from '../types/auth'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password })
  return response.data
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<AuthUser>('/auth/me')
  return response.data
}

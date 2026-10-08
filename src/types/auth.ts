export interface AuthUser {
  id: number
  nombre: string
  apellido: string | null
  email: string
  rol: 'USER' | 'ADMIN'
  activo: boolean
  fechaCreacion: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
}

export interface RegisterCredentials {
  nombre: string
  apellido?: string
  email: string
  password: string
}

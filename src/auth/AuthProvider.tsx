import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { AuthContext } from './AuthContext'
import { eliminarToken, guardarToken, obtenerToken } from './token'
import { getMe, login as iniciarSesion } from '../services/auth.service'
import type { AuthUser, LoginCredentials } from '../types/auth'

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const version = useRef(0)

  useEffect(() => {
    let activo = true
    const consulta = ++version.current
    async function restaurarSesion() {
      try {
        if (!obtenerToken()) return
        const usuario = await getMe()
        if (activo && consulta === version.current) setUser(usuario)
      } catch (error) {
        if (!activo || consulta !== version.current) return
        if (isAxiosError(error) && error.response?.status === 401) eliminarToken()
        else setSessionError('No pudimos verificar tu sesión. Intentá iniciar sesión nuevamente.')
        setUser(null)
      } finally {
        if (activo && consulta === version.current) setIsLoading(false)
      }
    }
    void restaurarSesion()
    return () => { activo = false; version.current += 1 }
  }, [])

  async function login({ email, password }: LoginCredentials) {
    const consulta = ++version.current
    const respuesta = await iniciarSesion(email, password)
    if (consulta !== version.current) return
    guardarToken(respuesta.accessToken)
    setUser(respuesta.user)
    setSessionError(null)
    setIsLoading(false)
  }

  function logout() {
    version.current += 1
    eliminarToken()
    setUser(null)
    setSessionError(null)
    setIsLoading(false)
  }

  return <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, sessionError, login, logout }}>{children}</AuthContext.Provider>
}

export default AuthProvider

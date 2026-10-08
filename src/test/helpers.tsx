import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthProvider from '../auth/AuthProvider'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import type { AuthUser } from '../types/auth'

export const usuario: AuthUser = { id: 99, nombre: 'Persona ficticia', apellido: null,
  email: 'persona@example.test', rol: 'USER', activo: true, fechaCreacion: '2026-01-01T00:00:00Z' }

export function renderAuthPage(path: '/login' | '/registro') {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/registro" element={<RegisterPage />} />
    <Route path="/catalogo" element={<h1>Catálogo de prueba</h1>} />
  </Routes></AuthProvider></MemoryRouter>)
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

export function errorHttp(status?: number) {
  return { isAxiosError: true, response: status ? { status } : undefined }
}

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/AuthContext'
import type { AuthContextValue } from '../auth/AuthContext'
import ProtectedRoute from '../auth/ProtectedRoute'
import Navbar from '../components/Navbar'
import { usuario } from './helpers'

function contexto(rol?: 'USER' | 'ADMIN', cargando = false): AuthContextValue {
  return { user: rol ? { ...usuario, rol } : null, isAuthenticated: Boolean(rol), isLoading: cargando,
    sessionError: null, login: vi.fn(), logout: vi.fn() }
}

function ruta(path: string, auth: AuthContextValue) {
  return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={auth}><Routes>
    <Route path="/login" element={<h1>Login de prueba</h1>} />
    <Route element={<ProtectedRoute />}><Route path="/biblioteca" element={<h1>Biblioteca privada</h1>} /></Route>
    <Route element={<ProtectedRoute roles={['ADMIN']} />}>
      <Route path="/admin" element={<h1>Panel privado</h1>} />
      <Route path="/admin/juegos" element={<h1>Juegos privados</h1>} />
    </Route>
  </Routes></AuthContext.Provider></MemoryRouter>)
}

describe('ProtectedRoute: acceso directo por URL', () => {
  it.each(['/biblioteca', '/admin', '/admin/juegos'])('redirige visitante de %s a login', async (path) => {
    ruta(path, contexto())
    expect(await screen.findByRole('heading', { name: 'Login de prueba' })).toBeVisible()
  })
  it('permite Biblioteca a USER', () => {
    ruta('/biblioteca', contexto('USER'))
    expect(screen.getByRole('heading', { name: 'Biblioteca privada' })).toBeVisible()
  })
  it.each(['/admin', '/admin/juegos'])('deniega %s a USER', (path) => {
    ruta(path, contexto('USER'))
    expect(screen.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/catalogo')
    expect(screen.queryByText(/privado/)).not.toBeInTheDocument()
  })
  it.each([['/admin', 'Panel privado'], ['/admin/juegos', 'Juegos privados']])('permite %s a ADMIN', (path, titulo) => {
    ruta(path, contexto('ADMIN'))
    expect(screen.getByRole('heading', { name: titulo })).toBeVisible()
  })
  it('espera verificación sin mostrar contenido ni redirigir', () => {
    ruta('/admin', contexto(undefined, true))
    expect(screen.getByRole('status')).toHaveTextContent('Verificando sesión')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

describe('Navbar por roles', () => {
  it.each([undefined, 'USER', 'ADMIN'] as const)('muestra herramientas según rol %s', (rol) => {
    render(<MemoryRouter><AuthContext.Provider value={contexto(rol)}><Navbar /></AuthContext.Provider></MemoryRouter>)
    if (rol === 'ADMIN') expect(screen.getByRole('link', { name: 'Administración' })).toHaveAttribute('href', '/admin')
    else expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument()
    if (rol) expect(screen.getByText(`Hola, ${usuario.nombre}`)).toBeVisible()
    else expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  })
})

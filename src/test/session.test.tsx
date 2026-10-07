import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthProvider from '../auth/AuthProvider'
import { useAuth } from '../auth/useAuth'
import Navbar from '../components/Navbar'
import ProtectedRoute from '../auth/ProtectedRoute'
import { getMe } from '../services/auth.service'
import { guardarToken, obtenerToken } from '../auth/token'
import { deferred, errorHttp, usuario } from './helpers'
import type { AuthUser } from '../types/auth'

function EstadoSesion() {
  const { isLoading, isAuthenticated, user, sessionError, logout } = useAuth()
  return <>
    <p role="status">{isLoading ? 'Verificando' : isAuthenticated ? `Autenticado: ${user?.nombre}` : 'Sin sesión'}</p>
    {sessionError && <p role="alert">{sessionError}</p>}
    <button onClick={logout}>Salir</button>
  </>
}

describe('AuthProvider y persistencia', () => {
  it('sin token no consulta me y deja sesión cerrada', async () => {
    render(<AuthProvider><EstadoSesion /></AuthProvider>)
    expect(await screen.findByRole('status')).toHaveTextContent('Sin sesión')
    expect(getMe).not.toHaveBeenCalled()
  })
  it('restaura usuario desde token y mantiene carga mientras espera', async () => {
    guardarToken('token-ficticio')
    const pendiente = deferred<AuthUser>()
    vi.mocked(getMe).mockReturnValue(pendiente.promise)
    render(<AuthProvider><EstadoSesion /></AuthProvider>)
    expect(screen.getByRole('status')).toHaveTextContent('Verificando')
    expect(getMe).toHaveBeenCalledTimes(1)
    await act(async () => pendiente.resolve(usuario))
    expect(screen.getByRole('status')).toHaveTextContent(`Autenticado: ${usuario.nombre}`)
    expect(obtenerToken()).toBe('token-ficticio')
  })
  it('token inválido: elimina token y deja sesión cerrada', async () => {
    guardarToken('token-invalido-ficticio')
    vi.mocked(getMe).mockRejectedValue(errorHttp(401))
    render(<AuthProvider><EstadoSesion /></AuthProvider>)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sin sesión'))
    expect(obtenerToken()).toBeNull()
  })
  it('fallo de red: muestra aviso y conserva token sin autenticar', async () => {
    guardarToken('token-ficticio')
    vi.mocked(getMe).mockRejectedValue(errorHttp())
    render(<AuthProvider><EstadoSesion /></AuthProvider>)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos verificar tu sesión')
    expect(screen.getByRole('status')).toHaveTextContent('Sin sesión')
    expect(obtenerToken()).toBe('token-ficticio')
  })
  it('logout elimina token, saludo y Administración, y navega a login', async () => {
    guardarToken('token-admin-ficticio')
    vi.mocked(getMe).mockResolvedValue({ ...usuario, rol: 'ADMIN' })
    render(<MemoryRouter initialEntries={['/admin']}><AuthProvider><Navbar /><Routes>
      <Route element={<ProtectedRoute roles={['ADMIN']} />}><Route path="/admin" element={<h1>Panel privado</h1>} /></Route>
      <Route path="/login" element={<h1>Login de prueba</h1>} />
    </Routes></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Panel privado' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Administración' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Login de prueba' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument()
    expect(screen.queryByText(`Hola, ${usuario.nombre}`)).not.toBeInTheDocument()
    expect(obtenerToken()).toBeNull()
  })
  it('ignora restauración tardía después de logout', async () => {
    guardarToken('token-ficticio')
    const pendiente = deferred<AuthUser>()
    vi.mocked(getMe).mockReturnValue(pendiente.promise)
    render(<AuthProvider><EstadoSesion /></AuthProvider>)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Salir' }))
    await act(async () => pendiente.resolve(usuario))
    expect(screen.getByRole('status')).toHaveTextContent('Sin sesión')
    expect(obtenerToken()).toBeNull()
  })
  it('restaura correctamente bajo StrictMode', async () => {
    guardarToken('token-ficticio')
    vi.mocked(getMe).mockResolvedValue(usuario)
    render(<StrictMode><AuthProvider><EstadoSesion /></AuthProvider></StrictMode>)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Autenticado'))
  })
})

import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { login } from '../services/auth.service'
import { obtenerToken } from '../auth/token'
import { deferred, errorHttp, renderAuthPage, usuario } from './helpers'
import type { LoginResponse } from '../types/auth'

async function completar() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), 'PERSONA@example.test')
  await user.type(screen.getByLabelText('Contraseña'), 'ficticia-123')
  return user
}

describe('Login', () => {
  it('muestra el formulario y permite navegar a registro', async () => {
    renderAuthPage('/login')
    expect(await screen.findByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: /registrate/i }))
    expect(await screen.findByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
  })
  it('envía credenciales, guarda solo token y navega al catálogo', async () => {
    vi.mocked(login).mockResolvedValue({ user: usuario, accessToken: 'token-ficticio' })
    renderAuthPage('/login')
    const user = await completar()
    expect(screen.getByLabelText('Email')).toHaveValue('PERSONA@example.test')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('ficticia-123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo de prueba' })).toBeVisible()
    expect(login).toHaveBeenCalledWith('persona@example.test', 'ficticia-123')
    expect(obtenerToken()).toBe('token-ficticio')
    expect(localStorage.length).toBe(1)
    expect(sessionStorage.length).toBe(0)
  })
  it.each([[401, 'Email o contraseña incorrectos.'], [undefined, 'conectar con el servidor'], [500, 'No pudimos iniciar sesión']])('maneja error %s y conserva credenciales', async (status, texto) => {
    vi.mocked(login).mockRejectedValue(errorHttp(status as number | undefined))
    renderAuthPage('/login')
    const user = await completar()
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(texto as string)
    expect(screen.getByLabelText('Contraseña')).toHaveValue('ficticia-123')
    expect(obtenerToken()).toBeNull()
  })
  it('bloquea envíos duplicados mientras espera', async () => {
    const pendiente = deferred<LoginResponse>()
    vi.mocked(login).mockReturnValue(pendiente.promise)
    renderAuthPage('/login')
    const user = await completar()
    await user.dblClick(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('button', { name: 'Iniciando sesión...' })).toBeDisabled()
    expect(login).toHaveBeenCalledTimes(1)
    await act(async () => pendiente.resolve({ user: usuario, accessToken: 'token-ficticio' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo de prueba' })).toBeVisible()
  })
})

import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { register, login } from '../services/auth.service'
import { obtenerToken } from '../auth/token'
import { deferred, errorHttp, renderAuthPage, usuario } from './helpers'
import type { AuthUser } from '../types/auth'

async function completar(opciones: { password?: string; confirmacion?: string; apellido?: string } = {}) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Nombre'), ' Persona ')
  if (opciones.apellido) await user.type(screen.getByLabelText('Apellido (opcional)'), opciones.apellido)
  await user.type(screen.getByLabelText('Email'), 'PERSONA@example.test')
  await user.type(screen.getByLabelText('Contraseña', { exact: true }), opciones.password ?? 'ficticia-123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), opciones.confirmacion ?? opciones.password ?? 'ficticia-123')
  return user
}

describe('Registro', () => {
  it('muestra campos y enlace a login', async () => {
    renderAuthPage('/registro')
    expect(await screen.findByLabelText('Nombre')).toBeRequired()
    expect(screen.getByLabelText('Apellido (opcional)')).not.toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Contraseña', { exact: true })).toBeRequired()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeRequired()
    expect(screen.getByRole('link', { name: /ya tenés cuenta/i })).toHaveAttribute('href', '/login')
  })
  it('impide enviar campos vacíos mediante validación nativa', async () => {
    renderAuthPage('/registro')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('Nombre')).toBeInvalid()
    expect(register).not.toHaveBeenCalled()
  })
  it('rechaza un nombre compuesto por espacios', async () => {
    renderAuthPage('/registro')
    const user = await completar()
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), '   ')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre es obligatorio')
    expect(register).not.toHaveBeenCalled()
  })
  it('rechaza contraseña corta', async () => {
    renderAuthPage('/registro')
    const user = await completar({ password: 'corta' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('al menos 8 caracteres')
    expect(register).not.toHaveBeenCalled()
  })
  it('rechaza contraseñas distintas', async () => {
    renderAuthPage('/registro')
    const user = await completar({ confirmacion: 'otra-ficticia' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden')
    expect(register).not.toHaveBeenCalled()
  })
  it('rechaza email inválido sin consultar el servidor', async () => {
    renderAuthPage('/registro')
    const user = await completar()
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'email-invalido')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(register).not.toHaveBeenCalled()
  })
  it.each([undefined, ' Apellido ficticio '])('envía solo el contrato real, apellido=%s, y redirige sin autenticar', async (apellido) => {
    vi.mocked(register).mockResolvedValue(usuario)
    renderAuthPage('/registro')
    const user = await completar({ apellido })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Tu cuenta se creó correctamente')
    expect(register).toHaveBeenCalledWith({ nombre: 'Persona', ...(apellido ? { apellido: 'Apellido ficticio' } : {}), email: 'persona@example.test', password: 'ficticia-123' })
    expect(login).not.toHaveBeenCalled()
    expect(obtenerToken()).toBeNull()
  })
  it('informa email duplicado y conserva todos los campos', async () => {
    vi.mocked(register).mockRejectedValue(errorHttp(409))
    renderAuthPage('/registro')
    const user = await completar({ apellido: 'Apellido' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ya está registrado')
    expect(screen.getByLabelText('Nombre')).toHaveValue(' Persona ')
    expect(screen.getByLabelText('Apellido (opcional)')).toHaveValue('Apellido')
    expect(screen.getByLabelText('Email')).toHaveValue('PERSONA@example.test')
    expect(screen.getByLabelText('Contraseña', { exact: true })).toHaveValue('ficticia-123')
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveValue('ficticia-123')
  })
  it.each([[400, 'rechazó los datos'], [undefined, 'conectar'], [500, 'más tarde']])('muestra error de registro %s', async (status, texto) => {
    vi.mocked(register).mockRejectedValue(errorHttp(status as number | undefined))
    renderAuthPage('/registro')
    const user = await completar()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(texto as string)
  })
  it('bloquea doble envío y permite mostrar/ocultar las contraseñas', async () => {
    const pendiente = deferred<AuthUser>()
    vi.mocked(register).mockReturnValue(pendiente.promise)
    renderAuthPage('/registro')
    const user = await completar()
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseñas' }))
    expect(screen.getByLabelText('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseñas' }))
    expect(screen.getByLabelText('Contraseña', { exact: true })).toHaveAttribute('type', 'password')
    await user.dblClick(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByRole('button', { name: 'Creando cuenta...' })).toBeDisabled()
    expect(register).toHaveBeenCalledTimes(1)
    await act(async () => pendiente.resolve(usuario))
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })
})

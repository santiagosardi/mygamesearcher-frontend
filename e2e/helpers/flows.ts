import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export function datosUsuario() {
  return { nombre: `E2E-${randomUUID().slice(0, 8)}`, email: `e2e-${randomUUID()}@example.test`,
    password: `E2E-${randomUUID()}!` }
}

export async function iniciarSesion(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
}

export async function registrarUsuario(page: Page) {
  const usuario = datosUsuario()
  await page.goto('/registro')
  await page.getByLabel('Nombre', { exact: true }).fill(usuario.nombre)
  await page.getByLabel('Email', { exact: true }).fill(usuario.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(usuario.password)
  await page.getByLabel('Confirmar contraseña').fill(usuario.password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('status').filter({ hasText: 'Tu cuenta se creó correctamente' })).toBeVisible()
  return usuario
}

export async function registrarEIngresar(page: Page) {
  const usuario = await registrarUsuario(page)
  await iniciarSesion(page, usuario.email, usuario.password)
  await expect(page.getByText(`Hola, ${usuario.nombre}`, { exact: true })).toBeVisible()
  return usuario
}

// Contrato del futuro seed E2E; no corresponde al catálogo habitual.
export const juegoBase = 'E2E Juego base'

export async function agregarBase(page: Page) {
  await page.goto('/catalogo')
  const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: juegoBase, exact: true }) })
  await tarjeta.getByRole('button', { name: 'Agregar a mi biblioteca', exact: true }).click()
  await expect(tarjeta.getByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
}

export async function crearColeccionConJuego(page: Page) {
  const nombre = `E2E colección ${randomUUID()}`
  await page.goto('/colecciones')
  await page.getByLabel('Nombre', { exact: true }).fill(nombre)
  await page.getByRole('button', { name: 'Crear colección', exact: true }).click()
  const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre, exact: true }) })
  await expect(tarjeta).toBeVisible()
  await tarjeta.getByRole('button', { name: 'Gestionar juegos' }).click()
  await tarjeta.getByRole('button', { name: `Agregar ${juegoBase} a la colección`, exact: true }).click()
  await expect(tarjeta.getByRole('button', { name: `Quitar ${juegoBase} de la colección`, exact: true })).toBeEnabled()
  return { nombre, tarjeta }
}

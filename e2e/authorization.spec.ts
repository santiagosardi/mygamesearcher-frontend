import { test, expect } from './helpers/test'
import { iniciarSesion, registrarEIngresar } from './helpers/flows'
import { cargarEntorno } from './helpers/environment'

test('USER recibe acceso denegado en /admin escrito manualmente', async ({ page }) => {
  await registrarEIngresar(page)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Administración' })).toHaveCount(0)
})

test('ADMIN aislado accede al panel y administración de juegos', async ({ page }) => {
  const env = cargarEntorno()
  const email = env.E2E_ADMIN_EMAIL
  const password = env.E2E_ADMIN_PASSWORD
  if (!email?.endsWith('@example.test') || !password || /REEMPLAZAR/.test(email + password)) throw new Error('Falta ADMIN E2E con email @example.test y contraseña temporal en el archivo local.')
  await iniciarSesion(page, email, password)
  await page.getByRole('navigation').getByRole('link', { name: 'Administración' }).click()
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()
  await page.goto('/admin/juegos')
  await expect(page.getByRole('heading', { name: 'Administrar juegos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear juego', exact: true })).toBeEnabled()
})

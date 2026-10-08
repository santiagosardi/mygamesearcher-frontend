import { test, expect } from './helpers/test'

test('visitante navega inicio, catálogo, login y registro', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tus juegos. Tu espacio.' })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Catálogo', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
  await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await page.getByRole('link', { name: '¿No tenés cuenta? Registrate' }).click()
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
})

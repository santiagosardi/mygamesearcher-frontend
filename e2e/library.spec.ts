import { test, expect } from './helpers/test'
import { agregarBase, juegoBase, registrarEIngresar } from './helpers/flows'

test('agrega, cambia estado, marca favorito y elimina de biblioteca', async ({ page }) => {
  await registrarEIngresar(page)
  await agregarBase(page)
  await page.goto('/biblioteca')
  const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: juegoBase, exact: true }) })
  await expect(tarjeta).toBeVisible()
  await tarjeta.getByLabel('Cambiar estado').selectOption('JUGANDO')
  await expect(tarjeta.getByRole('status')).toHaveText('Estado actualizado.')
  await expect(tarjeta.getByLabel('Cambiar estado')).toHaveValue('JUGANDO')
  await tarjeta.getByRole('button', { name: 'Marcar favorito' }).click()
  await expect(tarjeta.getByRole('button', { name: 'Quitar favorito' })).toBeEnabled()
  page.once('dialog', (dialog) => dialog.accept())
  await tarjeta.getByRole('button', { name: 'Eliminar de biblioteca' }).click()
  await expect(tarjeta).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
})

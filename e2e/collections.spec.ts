import { test, expect } from './helpers/test'
import { crearColeccionConJuego, juegoBase, registrarEIngresar } from './helpers/flows'

test('crea colección, agrega juego, filtra y elimina la colección', async ({ page }) => {
  await registrarEIngresar(page)
  const { tarjeta } = await crearColeccionConJuego(page)
  await tarjeta.getByLabel('Mostrar', { exact: true }).selectOption('coleccion')
  const lista = tarjeta.getByRole('list', { name: 'Listado de juegos' })
  await expect(lista.getByRole('listitem')).toHaveCount(1)
  await expect(lista.getByText(juegoBase, { exact: true })).toBeVisible()
  await tarjeta.getByPlaceholder('Buscar juego...').fill('inexistente-e2e')
  await expect(tarjeta.getByText('No se encontraron juegos con esa búsqueda y filtro.')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await tarjeta.getByRole('button', { name: 'Eliminar colección' }).click()
  await expect(tarjeta).toHaveCount(0)
})

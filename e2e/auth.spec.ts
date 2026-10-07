import { test } from './helpers/test'
import { registrarEIngresar } from './helpers/flows'

test('registra USER único, redirige al login y muestra saludo al ingresar', async ({ page }) => {
  await registrarEIngresar(page)
})

import { test, expect } from './helpers/test'
import { agregarBase, crearColeccionConJuego, registrarEIngresar } from './helpers/flows'
import type { RespuestaRecomendaciones } from '../src/types/recomendacion'

test('selecciona colección, agrega recomendado y muestra ranking nuevo del backend', async ({ page }) => {
  await registrarEIngresar(page)
  await agregarBase(page)
  const { nombre } = await crearColeccionConJuego(page)
  await page.goto('/recomendaciones')
  const selector = page.getByLabel('Recomendar según')
  await expect(selector.getByRole('option', { name: nombre, exact: true })).toHaveCount(1)
  const id = await selector.getByRole('option', { name: nombre, exact: true }).getAttribute('value')
  expect(id).toBeTruthy()
  const consultaColeccion = page.waitForResponse((r) => new URL(r.url()).pathname === '/recomendaciones'
    && new URL(r.url()).searchParams.get('coleccionId') === id && r.request().method() === 'GET')
  await selector.selectOption(id!)
  expect((await consultaColeccion).ok()).toBeTruthy()
  const tarjeta = page.getByRole('article').first()
  await expect(tarjeta.getByRole('button', { name: 'Agregar a mi biblioteca' })).toBeEnabled()
  const titulo = await tarjeta.getByRole('heading', { level: 2 }).innerText()
  const post = page.waitForResponse((r) => new URL(r.url()).pathname === '/bibliotecas' && r.request().method() === 'POST')
  const nuevoRanking = page.waitForResponse((r) => new URL(r.url()).pathname === '/recomendaciones'
    && new URL(r.url()).searchParams.get('coleccionId') === id && r.request().method() === 'GET')
  await tarjeta.getByRole('button', { name: 'Agregar a mi biblioteca' }).click()
  expect((await post).ok()).toBeTruthy()
  const respuesta = await nuevoRanking
  expect(respuesta.ok()).toBeTruthy()
  const datos: RespuestaRecomendaciones = await respuesta.json()
  expect(datos.recomendaciones.some((r) => r.juego.titulo === titulo)).toBe(false)
  await expect(selector).toHaveValue(id!)
  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(datos.recomendaciones.map((r) => r.juego.titulo))
})

import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import type { RespuestaRecomendaciones } from '../types/recomendacion'
import { deferred, errorHttp, usuario } from './helpers'
import { coleccion, entrada, juegos, mockHttp, renderResource } from './resourceHelpers'

function ranking(indice = 0): RespuestaRecomendaciones {
  return { usuarioId: usuario.id, recomendaciones: [{ juego: juegos[indice], puntaje: 7,
    motivos: ['Coincide con un género de tu biblioteca', 'Comparte una plataforma'] }] }
}

function preparar(consulta: (config: InternalAxiosRequestConfig) => unknown = () => ranking(),
  post: (config: InternalAxiosRequestConfig) => unknown = () => entrada()) {
  return mockHttp((config) => {
    if (config.url === '/colecciones') return [coleccion()]
    if (config.url === '/recomendaciones') return consulta(config)
    if (config.url === '/bibliotecas' && config.method === 'post') return post(config)
    throw new Error(`HTTP inesperado: ${config.method} ${config.url}`)
  })
}

describe('Recomendaciones con servicios reales y HTTP simulado', () => {
  it('consulta el ranking global con JWT, sin IDs de usuario, y muestra puntaje y motivos', async () => {
    const http = preparar()
    renderResource('/recomendaciones')
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText('Coincide con un género de tu biblioteca')).toBeVisible()
    expect(screen.getByText('Comparte una plataforma')).toBeVisible()
    expect(screen.getByText('Descripción de prueba')).toBeVisible()
    expect(screen.getByText('Estudio ficticio')).toBeVisible()
    for (const [config] of http.mock.calls) {
      expect(config.headers.get('Authorization')).toBe('Bearer token-ficticio')
      expect(config.params).toBeUndefined()
    }
  })
  it('muestra carga antes de recibir el ranking', async () => {
    const pendiente = deferred<RespuestaRecomendaciones>()
    preparar(() => pendiente.promise)
    renderResource('/recomendaciones')
    expect(screen.getByText('Cargando recomendaciones…')).toHaveAttribute('role', 'status')
    await act(async () => pendiente.resolve(ranking()))
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
  })
  it.each([undefined, 500])('muestra error de GET con estado HTTP %s', async (status) => {
    preparar(() => { throw errorHttp(status) })
    renderResource('/recomendaciones')
    expect(await screen.findByRole('alert')).toHaveTextContent(status ? 'No pudimos cargar las recomendaciones' : 'No pudimos conectar')
    expect(screen.getByRole('button', { name: 'Reintentar actualización' })).toBeEnabled()
  })
  it('muestra estado vacío y el mensaje enviado por el backend', async () => {
    preparar(() => ({ usuarioId: usuario.id, recomendaciones: [], mensaje: 'La colección está vacía.' }))
    renderResource('/recomendaciones')
    expect(await screen.findByRole('heading', { name: 'Todavía no hay recomendaciones disponibles' })).toBeVisible()
    expect(screen.getByText('La colección está vacía.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Explorar catálogo' })).toHaveAttribute('href', '/catalogo')
  })
  it('selecciona el ID real de colección y al volver a global omite coleccionId', async () => {
    const http = preparar((config) => ranking(config.params?.coleccionId ? 1 : 0))
    renderResource('/recomendaciones')
    await screen.findByRole('option', { name: coleccion().nombre })
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '73')
    expect(await screen.findByRole('heading', { name: juegos[1].titulo })).toBeVisible()
    expect(screen.getByLabelText('Recomendar según')).toHaveValue('73')
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '')
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    const consultas = http.mock.calls.filter(([config]) => config.url === '/recomendaciones').map(([config]) => config)
    expect(consultas.map((config) => config.params)).toEqual([undefined, { coleccionId: 73 }, undefined])
    consultas.forEach((config) => expect(config.headers.get('Authorization')).toBe('Bearer token-ficticio'))
  })
  it('la biblioteca sigue disponible cuando falla cargar colecciones', async () => {
    mockHttp((config) => { if (config.url === '/colecciones') throw errorHttp(500); return ranking() })
    renderResource('/recomendaciones')
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Podés seguir usando Toda mi biblioteca')
    expect(screen.getByLabelText('Recomendar según')).toHaveValue('')
  })
  it('agrega con juegoId, evita doble POST y espera el nuevo ranking de la fuente seleccionada', async () => {
    const postPendiente = deferred<ReturnType<typeof entrada>>()
    const rankingPendiente = deferred<RespuestaRecomendaciones>()
    let consultas = 0
    const http = preparar(() => ++consultas <= 2 ? ranking() : rankingPendiente.promise, () => postPendiente.promise)
    renderResource('/recomendaciones')
    const user = userEvent.setup()
    await screen.findByRole('option', { name: coleccion().nombre })
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '73')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await user.dblClick(screen.getByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(screen.getByRole('button', { name: 'Agregando...' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    const posts = http.mock.calls.filter(([config]) => config.method === 'post')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0][0].data)).toEqual({ juegoId: 10 })
    expect(posts[0][0].headers.get('Authorization')).toBe('Bearer token-ficticio')
    await act(async () => postPendiente.resolve(entrada()))
    expect(await screen.findByText('Se agregó "Zeta ficticio" a tu biblioteca.')).toBeVisible()
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByText('Actualizando recomendaciones…')).toBeVisible()
    await act(async () => rankingPendiente.resolve(ranking(1)))
    expect(await screen.findByRole('heading', { name: juegos[1].titulo })).toBeVisible()
    expect(screen.queryByRole('heading', { name: juegos[0].titulo })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Recomendar según')).toHaveValue('73')
    expect(http.mock.calls.filter(([config]) => config.url === '/recomendaciones').at(-1)![0].params).toEqual({ coleccionId: 73 })
  })
  it('POST fallido conserva la recomendación y permite reintentar sin refrescar', async () => {
    const http = preparar(undefined, () => { throw errorHttp(500) })
    renderResource('/recomendaciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos agregar')
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Agregar a mi biblioteca' })).toBeEnabled()
    expect(http.mock.calls.filter(([config]) => config.url === '/recomendaciones')).toHaveLength(1)
  })
  it('409 informa que ya estaba guardado y refresca desde el backend', async () => {
    let consultas = 0
    preparar(() => ++consultas === 1 ? ranking() : ranking(1), () => { throw errorHttp(409) })
    renderResource('/recomendaciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(await screen.findByText('"Zeta ficticio" ya estaba en tu biblioteca.')).toBeVisible()
    expect(await screen.findByRole('heading', { name: juegos[1].titulo })).toBeVisible()
  })
  it('si POST funciona pero GET falla informa ambos resultados sin quitar la tarjeta', async () => {
    let consultas = 0
    preparar(() => { if (++consultas > 1) throw errorHttp(500); return ranking() })
    renderResource('/recomendaciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El juego está en tu biblioteca, pero no pudimos actualizar el ranking')
    expect(screen.getByText('Se agregó "Zeta ficticio" a tu biblioteca.')).toBeVisible()
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
  })
  it('ignora respuestas antiguas al cambiar rápidamente de colección a global', async () => {
    const antigua = deferred<RespuestaRecomendaciones>()
    const ultima = deferred<RespuestaRecomendaciones>()
    let consultas = 0
    preparar(() => { consultas++; return consultas === 1 ? ranking() : consultas === 2 ? antigua.promise : ultima.promise })
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await screen.findByRole('option', { name: coleccion().nombre })
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '73')
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '')
    await act(async () => ultima.resolve(ranking(1)))
    expect(await screen.findByRole('heading', { name: juegos[1].titulo })).toBeVisible()
    await act(async () => antigua.resolve(ranking()))
    expect(screen.getByRole('heading', { name: juegos[1].titulo })).toBeVisible()
    expect(screen.queryByRole('heading', { name: juegos[0].titulo })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Recomendar según')).toHaveValue('')
  })
  it('conserva el orden y puntajes recibidos sin ordenarlos en React', async () => {
    preparar(() => ({ usuarioId: usuario.id, recomendaciones: [ranking().recomendaciones[0],
      { ...ranking(1).recomendaciones[0], puntaje: 100 }] }))
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    const tarjetas = screen.getAllByRole('article')
    expect(tarjetas.map((tarjeta) => within(tarjeta).getByRole('heading', { level: 2 }).textContent)).toEqual(juegos.map((juego) => juego.titulo))
    expect(within(tarjetas[0]).getByText('7')).toBeVisible()
    expect(within(tarjetas[1]).getByText('100')).toBeVisible()
  })
})

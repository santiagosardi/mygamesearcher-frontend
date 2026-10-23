import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { deferred, errorHttp, usuario } from './helpers'
import { coleccion, entrada, juegos, mockHttp, renderResource } from './resourceHelpers'
import type { RespuestaRecomendacionesIa } from '../types/recomendacion'

const resultado: RespuestaRecomendacionesIa = {
  recomendaciones: [10, 20, 30].map((id) => ({ juego: { ...juegos[0], id, titulo: `Juego IA ${id}` }, motivo: `Exploración y ritmo pausado ${id}` })),
}

function preparar(ia: () => unknown = () => resultado) {
  return mockHttp((config) => {
    if (config.url === '/recomendaciones/ia') return ia()
    if (config.url === '/colecciones') return [coleccion()]
    if (config.url === '/bibliotecas') return entrada()
    if (config.url === '/recomendaciones') return { usuarioId: usuario.id,
      recomendaciones: [{ juego: juegos[0], puntaje: 7, motivos: ['Afinidad normal'] }] }
    throw new Error('HTTP inesperado')
  })
}

describe('Recomendaciones IA opcionales', () => {
  it('no genera al montar ni cambiar fuente; envia la colección solo al pulsar', async () => {
    const http = preparar()
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '73')
    expect(http.mock.calls.filter(([c]) => c.method === 'post')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    await screen.findByRole('region', { name: '✨ Recomendaciones con IA' })
    const posts = http.mock.calls.filter(([c]) => c.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0][0].url).toBe('/recomendaciones/ia')
    expect(JSON.parse(posts[0][0].data)).toEqual({ coleccionId: 73 })
    expect(posts[0][0].headers.get('Authorization')).toBe('Bearer token-ficticio')
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '')
    expect(screen.queryByRole('region', { name: '✨ Recomendaciones con IA' })).not.toBeInTheDocument()
    expect(http.mock.calls.filter(([c]) => c.method === 'post')).toHaveLength(1)
  })
  it('biblioteca envía objeto vacío, bloquea doble clic y muestra tres resultados con motivo y detalle', async () => {
    const pendiente = deferred<RespuestaRecomendacionesIa>()
    const http = preparar(() => pendiente.promise)
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await userEvent.setup().dblClick(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    expect(screen.getByRole('button', { name: 'Generando recomendación...' })).toBeDisabled()
    const posts = http.mock.calls.filter(([c]) => c.method === 'post')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0][0].data)).toEqual({})
    await act(async () => pendiente.resolve(resultado))
    const seccion = within(screen.getByRole('region', { name: '✨ Recomendaciones con IA' }))
    expect(seccion.getAllByRole('article')).toHaveLength(3)
    expect(seccion.getByText('Exploración y ritmo pausado 10')).toBeVisible()
    expect(seccion.queryByText(/Puntaje/)).not.toBeInTheDocument()
    expect(seccion.getAllByRole('link', { name: 'Ver detalle' })[0]).toHaveAttribute('href', '/catalogo/10')
    expect(seccion.getAllByRole('link', { name: 'Ver detalle' })[0]).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Afinidad normal')).toBeVisible()
  })
  it('descarta una respuesta pendiente si cambia la fuente, incluso al volver a biblioteca', async () => {
    const pendiente = deferred<RespuestaRecomendacionesIa>()
    const http = preparar(() => pendiente.promise)
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '73')
    await user.selectOptions(screen.getByLabelText('Recomendar según'), '')
    await act(async () => pendiente.resolve(resultado))
    expect(screen.queryByRole('region', { name: '✨ Recomendaciones con IA' })).not.toBeInTheDocument()
    expect(http.mock.calls.filter(([c]) => c.method === 'post')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '✦ Generar recomendación con IA' })).toBeEnabled()
  })
  it('error IA conserva el ranking y permite reintentar', async () => {
    preparar(() => { throw errorHttp(502) })
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await userEvent.setup().click(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos generar las recomendaciones con IA')
    expect(screen.getByText('Afinidad normal')).toBeVisible()
    expect(screen.getByLabelText('Recomendar según')).toBeEnabled()
    expect(screen.getByRole('button', { name: '✦ Generar recomendación con IA' })).toBeEnabled()
  })
  it('muestra el mensaje del backend ante resultado vacío', async () => {
    preparar(() => ({ recomendaciones: [], mensaje: 'No hay candidatos disponibles.' }))
    renderResource('/recomendaciones')
    await userEvent.setup().click(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    expect(await screen.findByText('No hay candidatos disponibles.')).toBeVisible()
    expect(screen.getByText('Afinidad normal')).toBeVisible()
  })
  it('reutiliza el alta en biblioteca y refresca solo el GET normal', async () => {
    const http = preparar()
    renderResource('/recomendaciones')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '✦ Generar recomendación con IA' }))
    const seccion = within(await screen.findByRole('region', { name: '✨ Recomendaciones con IA' }))
    await user.click(seccion.getAllByRole('button', { name: 'Agregar a mi biblioteca' })[0])
    expect(await seccion.findByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    const alta = http.mock.calls.find(([c]) => c.url === '/bibliotecas')![0]
    expect(JSON.parse(alta.data)).toEqual({ juegoId: 10 })
    expect(http.mock.calls.filter(([c]) => c.url === '/recomendaciones/ia')).toHaveLength(1)
    expect(http.mock.calls.filter(([c]) => c.url === '/recomendaciones')).toHaveLength(2)
  })
})

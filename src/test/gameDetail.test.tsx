import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../App'
import AuthProvider from '../auth/AuthProvider'
import { deferred, errorHttp } from './helpers'
import { juegos, mockHttp } from './resourceHelpers'
import type { OfertasJuego } from '../types/juego'

const detalle = { ...juegos[0], fechaLanzamiento: '2026-02-03',
  caracteristicas: [{ id: 5, nombre: 'Multijugador' }] }
const oferta: OfertasJuego = { disponible: true, fuente: 'CheapShark', titulo: detalle.titulo,
  precioMasBajoUSD: '52.89', urlOferta: 'https://www.cheapshark.com/redirect?dealID=prueba',
  urlSteam: 'https://store.steampowered.com/app/1245620' }

function abrirDetalle(id = '10') {
  return render(<MemoryRouter initialEntries={[`/catalogo/${id}`]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('Página independiente de detalle', () => {
  it('resuelve la ruta directa, consulta ambos endpoints y muestra datos y ofertas', async () => {
    const http = mockHttp((config) => config.url?.endsWith('/ofertas') ? oferta : detalle)
    abrirDetalle()
    expect(await screen.findByRole('heading', { name: detalle.titulo })).toBeVisible()
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(['/juegos/10', '/juegos/10/ofertas'])
    expect(screen.getByText('Descripción de prueba')).toBeVisible()
    expect(screen.getByText('Estudio ficticio')).toBeVisible()
    expect(screen.getByText('2026-02-03')).toBeVisible()
    expect(screen.getByText('Género A')).toBeVisible()
    expect(screen.getByText('Plataforma A')).toBeVisible()
    expect(screen.getByText('Multijugador')).toBeVisible()
    expect(await screen.findByText('Precio más bajo: USD 52.89')).toBeVisible()
    expect(screen.getByText('Fuente: CheapShark')).toBeVisible()
    expect(screen.getByText(/no necesariamente es el precio de Steam/)).toBeVisible()
    for (const [nombre, url] of [['Ver oferta', oferta.urlOferta], ['Ver en Steam', oferta.urlSteam]] as const) {
      const enlace = screen.getByRole('link', { name: nombre })
      expect(enlace).toHaveAttribute('href', url)
      expect(enlace).toHaveAttribute('target', '_blank')
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/catalogo')
  })
  it('mantiene el detalle cuando no se encuentran ofertas', async () => {
    mockHttp((config) => config.url?.endsWith('/ofertas')
      ? { disponible: false, fuente: 'CheapShark', mensaje: 'Sin ofertas' } : detalle)
    abrirDetalle()
    expect(await screen.findByText('No encontramos ofertas externas para este juego.')).toBeVisible()
    expect(screen.getByRole('heading', { name: detalle.titulo })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Ver oferta' })).not.toBeInTheDocument()
  })
  it('un error 502 externo no oculta los datos propios', async () => {
    mockHttp((config) => { if (config.url?.endsWith('/ofertas')) throw errorHttp(502); return detalle })
    abrirDetalle()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos consultar las ofertas externas en este momento.')
    expect(screen.getByRole('heading', { name: detalle.titulo })).toBeVisible()
    expect(screen.getByText('Multijugador')).toBeVisible()
  })
  it('maneja el error del detalle principal', async () => {
    mockHttp((config) => { if (config.url === '/juegos/10') throw errorHttp(404); return oferta })
    abrirDetalle()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el detalle del juego')
    expect(screen.queryByRole('heading', { name: detalle.titulo })).not.toBeInTheDocument()
  })
  it('no muestra Steam cuando falta urlSteam', async () => {
    mockHttp((config) => config.url?.endsWith('/ofertas') ? { ...oferta, urlSteam: null } : detalle)
    abrirDetalle()
    expect(await screen.findByRole('link', { name: 'Ver oferta' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Ver en Steam' })).not.toBeInTheDocument()
  })
  it('muestra el detalle sin esperar las ofertas y mantiene cargas separadas', async () => {
    const propio = deferred<typeof detalle>()
    const externo = deferred<OfertasJuego>()
    mockHttp((config) => config.url?.endsWith('/ofertas') ? externo.promise : propio.promise)
    abrirDetalle()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle')
    await act(async () => propio.resolve(detalle))
    expect(screen.getByRole('heading', { name: detalle.titulo })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Consultando ofertas')
    await act(async () => externo.resolve(oferta))
    expect(screen.getByRole('link', { name: 'Ver oferta' })).toBeVisible()
  })
  it('rechaza identificadores inválidos sin realizar requests', async () => {
    const http = mockHttp(() => detalle)
    abrirDetalle('invalido')
    expect(await screen.findByRole('alert')).toHaveTextContent('El identificador no es válido')
    expect(http).not.toHaveBeenCalled()
  })
  it('ignora respuestas después de desmontar la página', async () => {
    const propio = deferred<typeof detalle>()
    const externo = deferred<OfertasJuego>()
    mockHttp((config) => config.url?.endsWith('/ofertas') ? externo.promise : propio.promise)
    const vista = abrirDetalle()
    vista.unmount()
    await act(async () => { propio.resolve(detalle); externo.resolve(oferta) })
    expect(screen.queryByRole('heading', { name: detalle.titulo })).not.toBeInTheDocument()
  })
})

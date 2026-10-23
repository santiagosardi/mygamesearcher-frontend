import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import AuthProvider from '../auth/AuthProvider'
import { deferred, errorHttp, usuario } from './helpers'
import { entrada, juegos, mockHttp } from './resourceHelpers'
import { AuthContext } from '../auth/AuthContext'
import { guardarToken } from '../auth/token'
import type { OfertasJuego } from '../types/juego'

const detalle = { ...juegos[0], fechaLanzamiento: '2026-02-03',
  caracteristicas: [{ id: 5, nombre: 'Multijugador' }] }
const oferta: OfertasJuego = { disponible: true, fuente: 'CheapShark', titulo: detalle.titulo,
  precioMasBajoUSD: '52.89', urlOferta: 'https://www.cheapshark.com/redirect?dealID=prueba',
  urlSteam: 'https://store.steampowered.com/app/1245620' }

function abrirDetalle(id = '10') {
  return render(<MemoryRouter initialEntries={[`/catalogo/${id}`]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

function abrirConSesion() {
  guardarToken('token-ficticio')
  return render(<MemoryRouter initialEntries={['/catalogo/10']}><AuthContext.Provider value={{
    user: usuario, isAuthenticated: true, isLoading: false, sessionError: null, login: vi.fn(), logout: vi.fn(),
  }}><App /></AuthContext.Provider></MemoryRouter>)
}

describe('Página independiente de detalle', () => {
  it('muestra portada y ofrece login al visitante sin consultar biblioteca', async () => {
    const http = mockHttp((config) => config.url?.endsWith('/ofertas') ? oferta : { ...detalle, urlImagen: '/portada-prueba.webp' })
    abrirDetalle()
    const imagen = await screen.findByRole('img', { name: `Portada de ${detalle.titulo}` })
    expect(imagen).toHaveAttribute('src', '/portada-prueba.webp')
    expect(imagen.parentElement).toHaveClass('game-detail-cover')
    expect(screen.getByRole('link', { name: 'Iniciar sesión para agregar' })).toHaveAttribute('href', '/login')
    expect(http.mock.calls.some(([config]) => config.url === '/bibliotecas')).toBe(false)
  })
  it('agrega usando el servicio existente y bloquea doble envío', async () => {
    const pendiente = deferred<ReturnType<typeof entrada>>()
    const http = mockHttp((config) => config.url === '/bibliotecas'
      ? config.method === 'post' ? pendiente.promise : []
      : config.url?.endsWith('/ofertas') ? oferta : detalle)
    abrirConSesion()
    const boton = await screen.findByRole('button', { name: 'Agregar a mi biblioteca' })
    await waitFor(() => expect(boton).toBeEnabled())
    await userEvent.setup().dblClick(boton)
    expect(screen.getByRole('button', { name: 'Agregando...' })).toBeDisabled()
    const posts = http.mock.calls.filter(([config]) => config.method === 'post')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0][0].data)).toEqual({ juegoId: detalle.id })
    expect(posts[0][0].headers.get('Authorization')).toBe('Bearer token-ficticio')
    await act(async () => pendiente.resolve(entrada()))
    expect(screen.getByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    expect(screen.getByText('Juego agregado a tu biblioteca.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver oferta' })).toBeVisible()
  })
  it('detecta un juego guardado sin permitir otro POST', async () => {
    const http = mockHttp((config) => config.url === '/bibliotecas' ? [entrada()]
      : config.url?.endsWith('/ofertas') ? oferta : detalle)
    abrirConSesion()
    expect(await screen.findByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    expect(http.mock.calls.some(([config]) => config.method === 'post')).toBe(false)
  })
  it.each([409, 500])('maneja el error POST %s sin afectar CheapShark', async (status) => {
    mockHttp((config) => {
      if (config.method === 'post') throw errorHttp(status)
      return config.url === '/bibliotecas' ? [] : config.url?.endsWith('/ofertas') ? oferta : detalle
    })
    abrirConSesion()
    const boton = await screen.findByRole('button', { name: 'Agregar a mi biblioteca' })
    await waitFor(() => expect(boton).toBeEnabled())
    await userEvent.setup().click(boton)
    if (status === 409) {
      expect(await screen.findByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    } else {
      expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos agregar el juego')
      expect(boton).toBeEnabled()
    }
    expect(screen.getByRole('link', { name: 'Ver oferta' })).toBeVisible()
  })
  it('bloquea altas si no puede verificar la biblioteca', async () => {
    mockHttp((config) => {
      if (config.url === '/bibliotecas') throw errorHttp(401)
      return config.url?.endsWith('/ofertas') ? oferta : detalle
    })
    abrirConSesion()
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión venció')
    expect(screen.getByRole('button', { name: 'Agregar a mi biblioteca' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: detalle.titulo })).toBeVisible()
  })
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

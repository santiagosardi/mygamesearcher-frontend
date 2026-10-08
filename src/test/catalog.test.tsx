import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { deferred, errorHttp } from './helpers'
import { entrada, juegos, mockHttp, renderResource } from './resourceHelpers'

describe('Catálogo con servicios reales y HTTP simulado', () => {
  it('consulta juegos y muestra sus datos para visitantes sin consultar biblioteca', async () => {
    const http = mockHttp((config) => { expect(config.url).toBe('/juegos'); return juegos })
    renderResource('/catalogo', false)
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByText('Descripción de prueba')).toBeVisible()
    expect(screen.getByText('Estudio ficticio')).toBeVisible()
    expect(screen.getByText('Género A', { selector: 'dd' })).toBeVisible()
    expect(screen.getByText('Plataforma A', { selector: 'dd' })).toBeVisible()
    expect(http).toHaveBeenCalledTimes(1)
  })
  it('mantiene loading hasta la respuesta', async () => {
    const pendiente = deferred<typeof juegos>()
    mockHttp(() => pendiente.promise)
    renderResource('/catalogo', false)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando juegos')
    await act(async () => pendiente.resolve(juegos))
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.queryByText('Cargando juegos…')).not.toBeInTheDocument()
  })
  it('muestra fallo de carga', async () => {
    mockHttp(() => { throw errorHttp() })
    renderResource('/catalogo', false)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el catálogo')
  })
  it('muestra catálogo vacío', async () => {
    mockHttp(() => [])
    renderResource('/catalogo', false)
    expect(await screen.findByRole('heading', { name: 'Todavía no hay juegos en el catálogo' })).toBeVisible()
  })
  it('busca ignorando mayúsculas y espacios sin nuevas consultas', async () => {
    const http = mockHttp(() => juegos)
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await userEvent.setup().type(screen.getByLabelText('Buscar por título'), '  ALFA  ')
    expect(screen.getByRole('heading', { name: juegos[1].titulo })).toBeVisible()
    expect(screen.queryByRole('heading', { name: juegos[0].titulo })).not.toBeInTheDocument()
    expect(http).toHaveBeenCalledTimes(1)
  })
  it('informa búsqueda sin coincidencias', async () => {
    mockHttp(() => juegos)
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })
    await userEvent.setup().type(screen.getByLabelText('Buscar por título'), 'inexistente')
    expect(screen.getByRole('status')).toHaveTextContent('No se encontraron juegos')
  })
  it('combina género, plataforma y búsqueda; Limpiar filtros restaura todo', async () => {
    mockHttp(() => juegos)
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Género'), '1')
    await user.selectOptions(screen.getByLabelText('Plataforma'), '2')
    expect(screen.getByRole('status')).toHaveTextContent('No se encontraron juegos')
    await user.selectOptions(screen.getByLabelText('Plataforma'), '1')
    await user.type(screen.getByLabelText('Buscar por título'), 'ZETA')
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
  })
  it('visitante navega a login sin POST', async () => {
    const http = mockHttp(() => juegos)
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })
    expect(screen.queryByRole('button', { name: 'Agregar a mi biblioteca' })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getAllByRole('link', { name: 'Iniciar sesión para agregar' })[0])
    expect(await screen.findByRole('heading', { name: 'Login de prueba' })).toBeVisible()
    expect(http.mock.calls.every(([config]) => config.method === 'get')).toBe(true)
  })
  it('USER agrega, envía JWT sin usuarioId, bloquea duplicados y reordena', async () => {
    const pendiente = deferred<ReturnType<typeof entrada>>()
    const http = mockHttp((config) => config.url === '/juegos' ? juegos : config.method === 'get' ? [] : pendiente.promise)
    renderResource('/catalogo')
    const botones = await screen.findAllByRole('button', { name: 'Agregar a mi biblioteca' })
    const user = userEvent.setup()
    await user.dblClick(botones[0])
    expect(screen.getByRole('button', { name: 'Agregando...' })).toBeDisabled()
    const posts = http.mock.calls.filter(([config]) => config.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0][0].url).toBe('/bibliotecas')
    expect(JSON.parse(posts[0][0].data)).toEqual({ juegoId: juegos[1].id })
    expect(posts[0][0].headers.get('Authorization')).toBe('Bearer token-ficticio')
    await act(async () => pendiente.resolve(entrada(juegos[1])))
    const guardado = await screen.findByRole('button', { name: 'Ya está en tu biblioteca' })
    expect(guardado).toBeDisabled()
    await user.click(guardado)
    expect(http.mock.calls.filter(([config]) => config.method === 'post')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 2 }).map((elemento) => elemento.textContent)).toEqual([juegos[0].titulo, juegos[1].titulo])
  })
  it('detecta juegos ya guardados y los coloca al final', async () => {
    mockHttp((config) => config.url === '/juegos' ? juegos : [entrada(juegos[1])])
    renderResource('/catalogo')
    expect(await screen.findByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    expect(screen.getAllByRole('heading', { level: 2 }).map((elemento) => elemento.textContent)).toEqual([juegos[0].titulo, juegos[1].titulo])
  })
  it('409 marca como guardado', async () => {
    mockHttp((config) => { if (config.method === 'post') throw errorHttp(409); return config.url === '/juegos' ? [juegos[0]] : [] })
    renderResource('/catalogo')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(await screen.findByRole('button', { name: 'Ya está en tu biblioteca' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('ya estaba')
  })
  it('POST fallido conserva tarjeta y permite reintentar', async () => {
    mockHttp((config) => { if (config.method === 'post') throw errorHttp(); return config.url === '/juegos' ? [juegos[0]] : [] })
    renderResource('/catalogo')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Agregar a mi biblioteca' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('conectar')
    expect(screen.getByRole('button', { name: 'Agregar a mi biblioteca' })).toBeEnabled()
  })
  it('fallo de biblioteca no impide leer catálogo pero bloquea altas', async () => {
    mockHttp((config) => { if (config.url === '/bibliotecas') throw errorHttp(401); return juegos })
    renderResource('/catalogo')
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión venció')
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    for (const boton of screen.getAllByRole('button', { name: 'Agregar a mi biblioteca' })) expect(boton).toBeDisabled()
  })
  it('ignora una respuesta después de desmontarse', async () => {
    const pendiente = deferred<typeof juegos>()
    mockHttp(() => pendiente.promise)
    const vista = renderResource('/catalogo', false)
    vista.unmount()
    await act(async () => pendiente.resolve(juegos))
    expect(screen.queryByRole('heading', { name: juegos[0].titulo })).not.toBeInTheDocument()
  })
  it('consulta el juego individual y muestra el detalle con sus relaciones', async () => {
    const detalle = {
      ...juegos[0],
      descripcion: 'Descripción completa del juego para el detalle.',
      fechaLanzamiento: '2026-02-03',
      generos: [{ id: 1, nombre: 'Género A', descripcion: 'Acción' }],
      plataformas: [{ id: 1, nombre: 'Plataforma A', descripcion: 'PC' }],
      caracteristicas: [{ id: 5, nombre: 'Multijugador', descripcion: 'Jugar con amigos' }],
    }
    const http = mockHttp((config) => config.url === '/juegos' ? juegos : detalle)
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])

    expect(http.mock.calls.map(([config]) => config.url)).toEqual(['/juegos', '/juegos/20'])
    expect(await screen.findByRole('dialog')).toHaveTextContent('Descripción completa del juego para el detalle.')
    expect(screen.getByText('Multijugador')).toBeVisible()
    expect(screen.getByText('2026-02-03')).toBeVisible()
  })
  it('muestra un error entendible si falla la consulta individual', async () => {
    const http = mockHttp((config) => {
      if (config.url === '/juegos') return juegos
      throw errorHttp(404)
    })
    renderResource('/catalogo', false)
    await screen.findByRole('heading', { name: juegos[0].titulo })

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el detalle del juego')
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(['/juegos', '/juegos/20'])
  })
})

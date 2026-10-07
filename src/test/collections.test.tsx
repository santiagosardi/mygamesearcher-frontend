import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import type { Coleccion } from '../types/coleccion'
import { deferred, errorHttp } from './helpers'
import { coleccion, entrada, juegos, mockHttp, renderResource } from './resourceHelpers'

function preparar(operacion?: (config: InternalAxiosRequestConfig) => unknown, datos = [coleccion()]) {
  return mockHttp((config) => {
    if (config.method !== 'get' && operacion) return operacion(config)
    if (config.url === '/colecciones' && config.method === 'get') return datos
    if (config.url === '/juegos') return juegos
    if (config.url === '/bibliotecas') return [entrada(juegos[1])]
    throw new Error(`HTTP inesperado: ${config.method} ${config.url}`)
  })
}

describe('Colecciones con servicios reales y HTTP simulado', () => {
  it('carga datos del usuario autenticado con JWT y sin usuarioId', async () => {
    const http = preparar()
    renderResource('/colecciones')
    expect(await screen.findByRole('heading', { name: coleccion().nombre })).toBeVisible()
    expect(screen.getByText('Grupo de prueba')).toBeVisible()
    for (const [config] of http.mock.calls) {
      expect(config.headers.get('Authorization')).toBe('Bearer token-ficticio')
      expect(config.params).toBeUndefined()
    }
  })
  it('muestra carga mientras espera la consulta', async () => {
    const pendiente = deferred<Coleccion[]>()
    mockHttp((config) => config.url === '/colecciones' ? pendiente.promise : [])
    renderResource('/colecciones')
    expect(screen.getByText('Cargando colecciones…')).toHaveAttribute('role', 'status')
    await act(async () => pendiente.resolve([coleccion()]))
    expect(await screen.findByRole('heading', { name: coleccion().nombre })).toBeVisible()
  })
  it('muestra error cuando falla GET', async () => {
    mockHttp((config) => { if (config.url === '/colecciones') throw errorHttp(500); return [] })
    renderResource('/colecciones')
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tus colecciones')
  })
  it('muestra estado vacío', async () => {
    preparar(undefined, [])
    renderResource('/colecciones')
    expect(await screen.findByRole('heading', { name: 'Todavía no tenés colecciones' })).toBeVisible()
  })
  it('crea con nombre y descripción ingresados, sin usuarioId, y limpia el formulario', async () => {
    const nueva = coleccion({ id: 74, nombre: 'Nuevo grupo', descripcion: 'Descripción nueva', juegos: [] })
    const http = preparar(() => nueva, [])
    renderResource('/colecciones')
    await screen.findByRole('heading', { name: 'Todavía no tenés colecciones' })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nombre'), '  Nuevo grupo  ')
    await user.type(screen.getByLabelText('Descripción (opcional)'), '  Descripción nueva  ')
    await user.click(screen.getByRole('button', { name: 'Crear colección' }))
    expect(await screen.findByRole('heading', { name: nueva.nombre })).toBeVisible()
    const post = http.mock.calls.find(([config]) => config.method === 'post')![0]
    expect(post.url).toBe('/colecciones')
    expect(JSON.parse(post.data)).toEqual({ nombre: 'Nuevo grupo', descripcion: 'Descripción nueva' })
    expect(post.headers.get('Authorization')).toBe('Bearer token-ficticio')
    expect(screen.getByLabelText('Nombre')).toHaveValue('')
    expect(screen.getByLabelText('Descripción (opcional)')).toHaveValue('')
  })
  it('conserva el formulario ante conflicto de creación', async () => {
    preparar(() => { throw errorHttp(409) }, [])
    renderResource('/colecciones')
    await screen.findByRole('heading', { name: 'Todavía no tenés colecciones' })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nombre'), 'Grupo repetido')
    await user.click(screen.getByRole('button', { name: 'Crear colección' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una colección')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Grupo repetido')
  })
  it('edita enviando solo campos modificados y usa la respuesta del backend', async () => {
    const http = preparar(() => coleccion({ nombre: 'Nombre editado', descripcion: 'Texto editado' }))
    renderResource('/colecciones')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const card = within(screen.getByRole('article'))
    await user.clear(card.getByLabelText('Nombre'))
    await user.type(card.getByLabelText('Nombre'), '  Nombre editado  ')
    await user.clear(card.getByLabelText('Descripción'))
    await user.type(card.getByLabelText('Descripción'), 'Texto editado')
    await user.click(card.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('heading', { name: 'Nombre editado' })).toBeVisible()
    expect(screen.getByText('Texto editado')).toBeVisible()
    const patch = http.mock.calls.find(([config]) => config.method === 'patch')![0]
    expect(patch.url).toBe('/colecciones/73')
    expect(JSON.parse(patch.data)).toEqual({ nombre: 'Nombre editado', descripcion: 'Texto editado' })
    expect(patch.headers.get('Authorization')).toBe('Bearer token-ficticio')
  })
  it('edición fallida conserva la colección y permite cancelar el borrador', async () => {
    preparar(() => { throw errorHttp(500) })
    renderResource('/colecciones')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const card = within(screen.getByRole('article'))
    await user.clear(card.getByLabelText('Nombre'))
    await user.type(card.getByLabelText('Nombre'), 'Borrador')
    await user.click(card.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(card.getByLabelText('Nombre')).toHaveValue('Borrador')
    await user.click(card.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('heading', { name: coleccion().nombre })).toBeVisible()
    expect(screen.getByText(coleccion().descripcion!)).toBeVisible()
  })
  it('cancelar confirmación no envía DELETE', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const http = preparar()
    renderResource('/colecciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar colección' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining(coleccion().nombre))
    expect(http.mock.calls.some(([config]) => config.method === 'delete')).toBe(false)
    expect(screen.getByRole('heading', { name: coleccion().nombre })).toBeVisible()
  })
  it('elimina únicamente después de confirmar y recibir éxito', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const pendiente = deferred<undefined>()
    const http = preparar(() => pendiente.promise)
    renderResource('/colecciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar colección' }))
    expect(screen.getByRole('heading', { name: coleccion().nombre })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    await act(async () => pendiente.resolve(undefined))
    expect(await screen.findByRole('heading', { name: 'Todavía no tenés colecciones' })).toBeVisible()
    const peticion = http.mock.calls.find(([config]) => config.method === 'delete')![0]
    expect(peticion.url).toBe('/colecciones/73')
    expect(peticion.headers.get('Authorization')).toBe('Bearer token-ficticio')
  })
  it('DELETE rechazado mantiene la colección visible', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    preparar(() => { throw errorHttp(500) })
    renderResource('/colecciones')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar colección' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByRole('heading', { name: coleccion().nombre })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Eliminar colección' })).toBeEnabled()
  })
  it('agrega y quita juegos con juegoIds sin duplicados y actualiza los controles', async () => {
    const http = preparar((config) => {
      const ids: number[] = JSON.parse(config.data).juegoIds
      return coleccion({ juegos: juegos.filter((juego) => ids.includes(juego.id)) })
    })
    renderResource('/colecciones')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Gestionar juegos' }))
    await user.click(await screen.findByRole('button', { name: `Agregar ${juegos[1].titulo} a la colección` }))
    expect(await screen.findByRole('button', { name: `Quitar ${juegos[1].titulo} de la colección` })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: `Quitar ${juegos[0].titulo} de la colección` }))
    expect(await screen.findByRole('button', { name: `Agregar ${juegos[0].titulo} a la colección` })).toBeEnabled()
    const patches = http.mock.calls.filter(([config]) => config.method === 'patch').map(([config]) => config)
    expect(patches.map((config) => JSON.parse(config.data))).toEqual([{ juegoIds: [10, 20] }, { juegoIds: [20] }])
    patches.forEach((config) => expect(config.headers.get('Authorization')).toBe('Bearer token-ficticio'))
  })
  it('combina búsqueda y filtros reutilizando una biblioteca para todas las tarjetas', async () => {
    const http = preparar(undefined, [coleccion(), coleccion({ id: 74, nombre: 'Otro grupo', juegos: [] })])
    renderResource('/colecciones')
    const user = userEvent.setup()
    const botones = await screen.findAllByRole('button', { name: 'Gestionar juegos' })
    for (const boton of botones) await user.click(boton)
    const gestor = within(screen.getByRole('region', { name: `Juegos de ${coleccion().nombre}` }))
    await waitFor(() => expect(gestor.getByRole('option', { name: 'En mi biblioteca' })).toBeEnabled())
    const lista = () => within(gestor.getByRole('list', { name: 'Listado de juegos' }))
    expect(lista().getAllByRole('listitem')).toHaveLength(2)
    await user.selectOptions(gestor.getByLabelText('Mostrar'), 'coleccion')
    expect(lista().getByText(juegos[0].titulo)).toBeVisible()
    expect(lista().queryByText(juegos[1].titulo)).not.toBeInTheDocument()
    await user.type(gestor.getByPlaceholderText('Buscar juego...'), '  aLfA  ')
    expect(gestor.getByText('No se encontraron juegos con esa búsqueda y filtro.')).toBeVisible()
    await user.selectOptions(gestor.getByLabelText('Mostrar'), 'biblioteca')
    expect(lista().getByText(juegos[1].titulo)).toBeVisible()
    await user.clear(gestor.getByPlaceholderText('Buscar juego...'))
    await user.selectOptions(gestor.getByLabelText('Mostrar'), 'todos')
    expect(lista().getAllByRole('listitem')).toHaveLength(2)
    expect(http.mock.calls.filter(([config]) => config.url === '/bibliotecas')).toHaveLength(1)
    expect(http.mock.calls).toHaveLength(3)
  })
})

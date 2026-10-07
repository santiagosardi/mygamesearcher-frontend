import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { deferred, errorHttp } from './helpers'
import { entrada, juegos, mockHttp, renderResource } from './resourceHelpers'

describe('Biblioteca con servicios reales y HTTP simulado', () => {
  it('consulta biblioteca con JWT, sin usuarioId, y muestra datos', async () => {
    const item = entrada()
    const http = mockHttp(() => [item])
    renderResource('/biblioteca')
    expect(await screen.findByRole('heading', { name: item.juego.titulo })).toBeVisible()
    expect(screen.getByText('Descripción de prueba')).toBeVisible()
    expect(screen.getByText('Pendiente', { selector: 'dd' })).toBeVisible()
    expect(screen.getByText('No', { selector: 'dd' })).toBeVisible()
    expect(screen.getByText(new Date(item.fechaAgregado).toLocaleDateString('es-AR'))).toBeVisible()
    expect(http.mock.calls[0][0].url).toBe('/bibliotecas')
    expect(http.mock.calls[0][0].params).toBeUndefined()
    expect(http.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer token-ficticio')
  })
  it('muestra loading hasta finalizar GET', async () => {
    const pendiente = deferred<ReturnType<typeof entrada>[]>()
    mockHttp(() => pendiente.promise)
    renderResource('/biblioteca')
    expect(screen.getByRole('status')).toHaveTextContent('Cargando biblioteca')
    await act(async () => pendiente.resolve([entrada()]))
    expect(await screen.findByRole('heading', { name: juegos[0].titulo })).toBeVisible()
  })
  it('muestra error al fallar GET', async () => {
    mockHttp(() => { throw errorHttp() })
    renderResource('/biblioteca')
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tu biblioteca')
  })
  it('muestra estado vacío', async () => {
    mockHttp(() => [])
    renderResource('/biblioteca')
    expect(await screen.findByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
  })
  it('ordena por estado y título sin alterar la respuesta original', async () => {
    const datos = [entrada(juegos[0], { estado: 'COMPLETADO' }), entrada(juegos[1]),
      entrada({ ...juegos[0], id: 30, titulo: 'Beta ficticio' }, { estado: 'JUGANDO' }),
      entrada({ ...juegos[0], id: 40, titulo: 'Omega ficticio' }),
      entrada({ ...juegos[0], id: 50, titulo: 'Abandonado ficticio' }, { estado: 'ABANDONADO' })]
    mockHttp(() => datos)
    renderResource('/biblioteca')
    await screen.findByRole('heading', { name: juegos[0].titulo })
    expect(screen.getAllByRole('heading', { level: 2 }).map((elemento) => elemento.textContent)).toEqual([
      'Alfa ficticio', 'Omega ficticio', 'Beta ficticio', 'Zeta ficticio', 'Abandonado ficticio',
    ])
    expect(datos[0].estado).toBe('COMPLETADO')
  })
  it('PATCH estado envía solo estado y reubica la entrada', async () => {
    const primero = entrada(juegos[1])
    const segundo = entrada(juegos[0], { estado: 'JUGANDO' })
    const http = mockHttp((config) => config.method === 'get' ? [primero, segundo] : { ...primero, estado: 'COMPLETADO' })
    renderResource('/biblioteca')
    const selectores = await screen.findAllByLabelText('Cambiar estado')
    await userEvent.setup().selectOptions(selectores[0], 'COMPLETADO')
    expect(await screen.findByText('Estado actualizado.')).toBeVisible()
    const patch = http.mock.calls.find(([config]) => config.method === 'patch')![0]
    expect(patch.url).toBe(`/bibliotecas/${primero.id}`)
    expect(JSON.parse(patch.data)).toEqual({ estado: 'COMPLETADO' })
    expect(screen.getAllByRole('heading', { level: 2 }).map((elemento) => elemento.textContent)).toEqual([segundo.juego.titulo, primero.juego.titulo])
  })
  it.each([false, true])('cambia favorito desde %s enviando solo favorito', async (favorito) => {
    const item = entrada(juegos[0], { favorito })
    const http = mockHttp((config) => config.method === 'get' ? [item] : { ...item, favorito: !favorito })
    renderResource('/biblioteca')
    await userEvent.setup().click(await screen.findByRole('button', { name: favorito ? 'Quitar favorito' : 'Marcar favorito' }))
    expect(await screen.findByRole('button', { name: favorito ? 'Marcar favorito' : 'Quitar favorito' })).toBeEnabled()
    expect(screen.getByText(favorito ? 'No' : 'Sí', { selector: 'dd' })).toBeVisible()
    expect(JSON.parse(http.mock.calls.find(([config]) => config.method === 'patch')![0].data)).toEqual({ favorito: !favorito })
  })
  it('PATCH fallido conserva estado previo y habilita reintento', async () => {
    mockHttp((config) => { if (config.method === 'patch') throw errorHttp(500); return [entrada()] })
    renderResource('/biblioteca')
    await userEvent.setup().selectOptions(await screen.findByLabelText('Cambiar estado'), 'JUGANDO')
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar el cambio')
    expect(screen.getByLabelText('Cambiar estado')).toHaveValue('PENDIENTE')
    expect(screen.getByLabelText('Cambiar estado')).toBeEnabled()
  })
  it('DELETE cancelado no envía petición ni elimina tarjeta', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const http = mockHttp(() => [entrada()])
    renderResource('/biblioteca')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar de biblioteca' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining(juegos[0].titulo))
    expect(http.mock.calls.some(([config]) => config.method === 'delete')).toBe(false)
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
  })
  it('DELETE confirmado espera éxito antes de retirar el juego', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const pendiente = deferred<undefined>()
    const http = mockHttp((config) => config.method === 'get' ? [entrada()] : pendiente.promise)
    renderResource('/biblioteca')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar de biblioteca' }))
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Eliminar de biblioteca' })).toBeDisabled()
    await act(async () => pendiente.resolve(undefined))
    expect(await screen.findByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: juegos[0].titulo })).not.toBeInTheDocument()
    expect(http.mock.calls.find(([config]) => config.method === 'delete')![0].url).toBe(`/bibliotecas/${entrada().id}`)
  })
  it('DELETE fallido conserva tarjeta y muestra error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockHttp((config) => { if (config.method === 'delete') throw errorHttp(409); return [entrada()] })
    renderResource('/biblioteca')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Eliminar de biblioteca' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos eliminar el juego')
    expect(screen.getByRole('heading', { name: juegos[0].titulo })).toBeVisible()
  })
  it('bloquea todas las acciones de la entrada y evita doble PATCH', async () => {
    const pendiente = deferred<ReturnType<typeof entrada>>()
    const http = mockHttp((config) => config.method === 'get' ? [entrada()] : pendiente.promise)
    renderResource('/biblioteca')
    await userEvent.setup().dblClick(await screen.findByRole('button', { name: 'Marcar favorito' }))
    const tarjeta = screen.getByRole('article')
    expect(within(tarjeta).getByLabelText('Cambiar estado')).toBeDisabled()
    expect(within(tarjeta).getByRole('button', { name: 'Eliminar de biblioteca' })).toBeDisabled()
    expect(http.mock.calls.filter(([config]) => config.method === 'patch')).toHaveLength(1)
    await act(async () => pendiente.resolve(entrada(juegos[0], { favorito: true })))
    expect(await screen.findByRole('button', { name: 'Quitar favorito' })).toBeEnabled()
  })
})

import api from './api'
import type { ActualizarJuego, CrearJuego, Juego } from '../types/juego'

export async function obtenerJuegos(): Promise<Juego[]> {
  const response = await api.get<Juego[]>('/juegos')
  return response.data
}

export async function obtenerJuegoPorId(id: number): Promise<Juego> {
  const response = await api.get<Juego>(`/juegos/${id}`)
  return response.data
}

export async function crearJuego(datos: CrearJuego): Promise<Juego> {
  return (await api.post<Juego>('/juegos', datos)).data
}

export async function actualizarJuego(id: number, datos: ActualizarJuego): Promise<Juego> {
  return (await api.patch<Juego>(`/juegos/${id}`, datos)).data
}

export async function eliminarJuego(id: number): Promise<void> {
  await api.delete(`/juegos/${id}`)
}

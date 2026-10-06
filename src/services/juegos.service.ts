import api from './api'
import type { Juego } from '../types/juego'

export async function obtenerJuegos(): Promise<Juego[]> {
  const response = await api.get<Juego[]>('/juegos')
  return response.data
}

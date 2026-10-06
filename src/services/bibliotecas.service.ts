import api from './api'
import type { Biblioteca } from '../types/biblioteca'

export async function obtenerBiblioteca(usuarioId: number): Promise<Biblioteca[]> {
  const response = await api.get<Biblioteca[]>('/bibliotecas', {
    params: { usuarioId },
  })
  return response.data
}

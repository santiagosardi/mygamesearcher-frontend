import api from './api'
import type { ActualizarBiblioteca, Biblioteca } from '../types/biblioteca'

export async function obtenerBiblioteca(): Promise<Biblioteca[]> {
  const response = await api.get<Biblioteca[]>('/bibliotecas')
  return response.data
}

export async function agregarJuegoABiblioteca(juegoId: number): Promise<Biblioteca> {
  const response = await api.post<Biblioteca>('/bibliotecas', { juegoId })
  return response.data
}

export async function actualizarBiblioteca(id: number, datos: ActualizarBiblioteca): Promise<Biblioteca> {
  const response = await api.patch<Biblioteca>(`/bibliotecas/${id}`, datos)
  return response.data
}

export async function eliminarBiblioteca(id: number): Promise<void> {
  await api.delete(`/bibliotecas/${id}`)
}

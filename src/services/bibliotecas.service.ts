import api from './api'
import type { ActualizarBiblioteca, AgregarJuegoBiblioteca, Biblioteca } from '../types/biblioteca'

export async function obtenerBiblioteca(usuarioId: number): Promise<Biblioteca[]> {
  const response = await api.get<Biblioteca[]>('/bibliotecas', {
    params: { usuarioId },
  })
  return response.data
}

export async function agregarJuegoABiblioteca(datos: AgregarJuegoBiblioteca): Promise<Biblioteca> {
  const response = await api.post<Biblioteca>('/bibliotecas', datos)
  return response.data
}

export async function actualizarBiblioteca(id: number, datos: ActualizarBiblioteca): Promise<Biblioteca> {
  const response = await api.patch<Biblioteca>(`/bibliotecas/${id}`, datos)
  return response.data
}

export async function eliminarBiblioteca(id: number): Promise<void> {
  await api.delete(`/bibliotecas/${id}`)
}

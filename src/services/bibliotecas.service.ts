import api from './api'
import type { AgregarJuegoBiblioteca, Biblioteca } from '../types/biblioteca'

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

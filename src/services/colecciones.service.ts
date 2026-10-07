import api from './api'
import type { ActualizarColeccion, Coleccion, CrearColeccion } from '../types/coleccion'

export async function obtenerColecciones(): Promise<Coleccion[]> {
  const response = await api.get<Coleccion[]>('/colecciones')
  return response.data
}

export async function crearColeccion(datos: CrearColeccion): Promise<Coleccion> {
  const response = await api.post<Coleccion>('/colecciones', datos)
  return response.data
}

export async function actualizarColeccion(id: number, datos: ActualizarColeccion): Promise<Coleccion> {
  const response = await api.patch<Coleccion>(`/colecciones/${id}`, datos)
  return response.data
}

export async function eliminarColeccion(id: number): Promise<void> {
  await api.delete(`/colecciones/${id}`)
}

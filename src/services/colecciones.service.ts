import api from './api'
import type { Coleccion, CrearColeccion } from '../types/coleccion'

export async function obtenerColecciones(usuarioId: number): Promise<Coleccion[]> {
  const response = await api.get<Coleccion[]>('/colecciones', {
    params: { usuarioId },
  })
  return response.data
}

export async function crearColeccion(datos: CrearColeccion): Promise<Coleccion> {
  const response = await api.post<Coleccion>('/colecciones', datos)
  return response.data
}

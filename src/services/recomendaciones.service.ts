import api from './api'
import type { RespuestaRecomendaciones } from '../types/recomendacion'

export async function obtenerRecomendaciones(coleccionId?: number): Promise<RespuestaRecomendaciones> {
  const response = await api.get<RespuestaRecomendaciones>('/recomendaciones', {
    params: coleccionId !== undefined ? { coleccionId } : undefined,
  })
  return response.data
}

import api from './api'
import type { RespuestaRecomendaciones } from '../types/recomendacion'

export async function obtenerRecomendaciones(usuarioId: number, coleccionId?: number): Promise<RespuestaRecomendaciones> {
  const response = await api.get<RespuestaRecomendaciones>('/recomendaciones', {
    params: { usuarioId, ...(coleccionId !== undefined ? { coleccionId } : {}) },
  })
  return response.data
}

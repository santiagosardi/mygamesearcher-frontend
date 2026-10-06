import api from './api'
import type { RespuestaRecomendaciones } from '../types/recomendacion'

export async function obtenerRecomendaciones(usuarioId: number): Promise<RespuestaRecomendaciones> {
  const response = await api.get<RespuestaRecomendaciones>('/recomendaciones', {
    params: { usuarioId },
  })
  return response.data
}

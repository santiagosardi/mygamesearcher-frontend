import api from './api'
import type { RespuestaRecomendaciones, RespuestaRecomendacionesIa } from '../types/recomendacion'

export async function obtenerRecomendaciones(coleccionId?: number): Promise<RespuestaRecomendaciones> {
  const response = await api.get<RespuestaRecomendaciones>('/recomendaciones', {
    params: coleccionId !== undefined ? { coleccionId } : undefined,
  })
  return response.data
}

export async function generarRecomendacionesIa(coleccionId?: number): Promise<RespuestaRecomendacionesIa> {
  const response = await api.post<RespuestaRecomendacionesIa>('/recomendaciones/ia',
    coleccionId !== undefined ? { coleccionId } : {})
  return response.data
}

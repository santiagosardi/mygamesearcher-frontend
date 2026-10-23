import type { Juego } from './juego'

export interface Recomendacion {
  juego: Juego
  puntaje: number
  motivos: string[]
}

export interface RespuestaRecomendaciones {
  usuarioId: number
  recomendaciones: Recomendacion[]
  mensaje?: string
}

export interface RecomendacionIa {
  juego: Juego
  motivo: string
}

export interface RespuestaRecomendacionesIa {
  recomendaciones: RecomendacionIa[]
  mensaje?: string
}

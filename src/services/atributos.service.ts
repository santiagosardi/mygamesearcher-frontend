import api from './api'
import type { Genero, Plataforma, Caracteristica } from '../types/juego'

export async function obtenerAtributos() {
  const [generos, plataformas, caracteristicas] = await Promise.all([
    api.get<Genero[]>('/generos'),
    api.get<Plataforma[]>('/plataformas'),
    api.get<Caracteristica[]>('/caracteristicas'),
  ])
  return { generos: generos.data, plataformas: plataformas.data, caracteristicas: caracteristicas.data }
}

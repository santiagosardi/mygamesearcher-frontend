import api from './api'
import type { Genero, Plataforma, Caracteristica } from '../types/juego'

export type TipoAtributo = 'generos' | 'plataformas' | 'caracteristicas'
export type Atributo = Genero | Plataforma | Caracteristica
export type CrearAtributo = Pick<Genero, 'nombre'> & { descripcion?: string }
export type ActualizarAtributo = Partial<CrearAtributo>

export async function listarAtributos(tipo: TipoAtributo): Promise<Atributo[]> {
  return (await api.get<Atributo[]>(`/${tipo}`)).data
}

export async function crearAtributo(tipo: TipoAtributo, datos: CrearAtributo): Promise<Atributo> {
  return (await api.post<Atributo>(`/${tipo}`, datos)).data
}

export async function actualizarAtributo(tipo: TipoAtributo, id: number, datos: ActualizarAtributo): Promise<Atributo> {
  return (await api.patch<Atributo>(`/${tipo}/${id}`, datos)).data
}

export async function eliminarAtributo(tipo: TipoAtributo, id: number): Promise<void> {
  await api.delete(`/${tipo}/${id}`)
}

export async function obtenerAtributos() {
  const [generos, plataformas, caracteristicas] = await Promise.all([
    api.get<Genero[]>('/generos'),
    api.get<Plataforma[]>('/plataformas'),
    api.get<Caracteristica[]>('/caracteristicas'),
  ])
  return { generos: generos.data, plataformas: plataformas.data, caracteristicas: caracteristicas.data }
}

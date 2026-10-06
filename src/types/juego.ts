export interface Genero {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface Plataforma {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface Caracteristica {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface Juego {
  id: number
  titulo: string
  descripcion?: string | null
  fechaLanzamiento?: string | null
  desarrollador?: string | null
  urlImagen?: string | null
  generos: Genero[]
  plataformas: Plataforma[]
  caracteristicas: Caracteristica[]
}

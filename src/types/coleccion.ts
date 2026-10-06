import type { UsuarioBiblioteca } from './biblioteca'
import type { Juego } from './juego'

export interface Coleccion {
  id: number
  nombre: string
  descripcion?: string | null
  usuario: UsuarioBiblioteca
  // GET carga los juegos, pero no sus relaciones internas.
  juegos: Omit<Juego, 'generos' | 'plataformas' | 'caracteristicas'>[]
  fechaCreacion: string
}

export interface CrearColeccion {
  usuarioId: number
  nombre: string
  descripcion?: string
}

export interface ActualizarColeccion {
  nombre?: string
  descripcion?: string
  juegoIds?: number[]
}

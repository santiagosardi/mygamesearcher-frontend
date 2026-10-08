import type { Juego } from './juego'

export type EstadoBiblioteca = 'PENDIENTE' | 'JUGANDO' | 'COMPLETADO' | 'ABANDONADO'

export interface ActualizarBiblioteca {
  estado?: EstadoBiblioteca
  favorito?: boolean
}

export interface AgregarJuegoBiblioteca {
  juegoId: number
  estado?: EstadoBiblioteca
  favorito?: boolean
}

export interface UsuarioBiblioteca {
  id: number
  nombre: string
  apellido?: string | null
  email: string
  rol: 'USER' | 'ADMIN'
  activo: boolean
  fechaCreacion: string
}

export interface Biblioteca {
  id: number
  usuario: UsuarioBiblioteca
  // Este endpoint no carga las relaciones internas del juego.
  juego: Omit<Juego, 'generos' | 'plataformas' | 'caracteristicas'>
  estado: EstadoBiblioteca
  favorito: boolean
  fechaAgregado: string
}

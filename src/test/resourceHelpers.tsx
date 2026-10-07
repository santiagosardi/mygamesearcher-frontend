import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import api from '../services/api'
import { AuthContext } from '../auth/AuthContext'
import CatalogPage from '../pages/Catalog/CatalogPage'
import LibraryPage from '../pages/Library/LibraryPage'
import type { Juego } from '../types/juego'
import type { Biblioteca } from '../types/biblioteca'
import { usuario } from './helpers'
import { guardarToken } from '../auth/token'

export const juegos: Juego[] = [
  { id: 10, titulo: 'Zeta ficticio', descripcion: 'Descripción de prueba', desarrollador: 'Estudio ficticio', generos: [{ id: 1, nombre: 'Género A' }], plataformas: [{ id: 1, nombre: 'Plataforma A' }], caracteristicas: [] },
  { id: 20, titulo: 'Alfa ficticio', generos: [{ id: 2, nombre: 'Género B' }], plataformas: [{ id: 2, nombre: 'Plataforma B' }], caracteristicas: [] },
]

export function entrada(juego = juegos[0], cambios: Partial<Biblioteca> = {}): Biblioteca {
  return { id: 100 + juego.id, usuario, juego, estado: 'PENDIENTE', favorito: false, fechaAgregado: '2026-01-02T12:00:00Z', ...cambios }
}

export function mockHttp(handler: (config: InternalAxiosRequestConfig) => unknown | Promise<unknown>) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => ({ data: await handler(config), status: 200,
    statusText: 'OK', headers: {}, config }))
  api.defaults.adapter = adapter
  return adapter
}

export function renderResource(path: '/catalogo' | '/biblioteca', autenticado = true) {
  if (autenticado) guardarToken('token-ficticio')
  return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ user: autenticado ? usuario : null,
    isAuthenticated: autenticado, isLoading: false, sessionError: null, login: vi.fn(), logout: vi.fn() }}>
    <Routes><Route path="/catalogo" element={<CatalogPage />} /><Route path="/biblioteca" element={<LibraryPage />} />
      <Route path="/login" element={<h1>Login de prueba</h1>} /></Routes>
  </AuthContext.Provider></MemoryRouter>)
}

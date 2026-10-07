import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import api from '../services/api'

vi.mock('../services/auth.service', () => ({ login: vi.fn(), getMe: vi.fn(), register: vi.fn() }))

// Ningún test puede escapar hacia el backend real.
const bloquearHttp = async () => { throw new Error('Petición HTTP no mockeada en un test') }
api.defaults.adapter = bloquearHttp

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); api.defaults.adapter = bloquearHttp })
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); api.defaults.adapter = bloquearHttp })

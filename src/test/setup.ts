import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import api from '../services/api'

vi.mock('../services/auth.service', () => ({ login: vi.fn(), getMe: vi.fn(), register: vi.fn() }))

// Ningún test puede escapar hacia el backend real.
api.defaults.adapter = async () => { throw new Error('Petición HTTP no mockeada en un test') }

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear() })

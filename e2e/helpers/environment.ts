import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
export const apiURL = 'http://127.0.0.1:3001'
export const frontendURL = 'http://127.0.0.1:5174'
export function cargarEntorno(): NodeJS.ProcessEnv {
  try { return parseEnv(readFileSync(new URL('../.env.e2e', import.meta.url), 'utf8')) }
  catch { throw new Error('E2E bloqueado: falta un e2e/.env.e2e válido.') }
}
export function validarEntorno(env: NodeJS.ProcessEnv, baseURL = frontendURL) {
  if (env.VITE_API_URL !== apiURL) throw new Error('E2E bloqueado: VITE_API_URL debe ser http://127.0.0.1:3001.')
  if (env.E2E_FRONTEND_URL !== frontendURL || baseURL !== frontendURL) throw new Error('E2E bloqueado: frontend debe ser http://127.0.0.1:5174.')
  if (env.E2E_RUN_ALLOWED !== 'YES') throw new Error('E2E bloqueado: falta E2E_RUN_ALLOWED=YES en el archivo local.')
}

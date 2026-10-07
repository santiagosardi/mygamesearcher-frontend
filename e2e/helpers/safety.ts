import { apiURL, cargarEntorno, validarEntorno } from './environment'
export default async function comprobarEntornoE2E() {
  validarEntorno(cargarEntorno())
  try {
    const response = await fetch(`${apiURL}/juegos`, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('Respuesta inválida')
    const juegos: unknown = await response.json()
    if (!Array.isArray(juegos) || !juegos.some((juego) => juego?.titulo === 'E2E Juego base')) throw new Error('Seed ausente')
  } catch {
    throw new Error('E2E bloqueado: backend 3001 no disponible o catálogo/seed E2E inválido. No se ejecutarán flujos.')
  }
}

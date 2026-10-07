// Bloqueo deliberado: cambiar el puerto no prueba qué DB utiliza un servidor.
// No existe hoy un arranque/reset E2E ni una comprobación de aislamiento backend.
// Sustituir por un preflight verificable solo después de implementar ese soporte.
export default function comprobarEntornoE2E(): never {
  throw new Error('E2E BLOQUEADO: falta backend aislado con DB mygamesearcher_e2e, arranque/reset protegido y verificación de aislamiento. No se ejecutará ningún flujo. Consultá e2e/README.md.')
}

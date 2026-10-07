import { test as base, expect } from '@playwright/test'
import comprobarEntornoE2E from './safety'
import { cargarEntorno, validarEntorno } from './environment'

// También protege ejecuciones individuales desde UI, independientemente del setup.
export const test = base.extend<{ entornoSeguro: void }>({
  entornoSeguro: [async ({ baseURL }, use) => {
    validarEntorno(cargarEntorno(), baseURL)
    await comprobarEntornoE2E()
    await use()
  }, { auto: true }],
})
export { expect }

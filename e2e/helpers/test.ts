import { test as base, expect } from '@playwright/test'
import comprobarEntornoE2E from './safety'

// También protege ejecuciones individuales desde UI, independientemente del setup.
export const test = base.extend<{ entornoSeguro: void }>({
  entornoSeguro: [async ({ baseURL }, use) => {
    if (baseURL !== 'http://localhost:5174') throw new Error('URL frontend E2E no permitida.')
    comprobarEntornoE2E()
    await use()
  }, { auto: true }],
})
export { expect }

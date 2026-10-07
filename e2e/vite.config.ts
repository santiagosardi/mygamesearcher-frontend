import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import baseConfig from '../vite.config'

export default mergeConfig(baseConfig, {
  // Vite no carga los archivos .env del proyecto habitual en modo E2E.
  envDir: fileURLToPath(new URL('.', import.meta.url)),
})

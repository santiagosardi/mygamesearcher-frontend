import { mergeConfig } from 'vite'
import baseConfig from '../vite.config'
import { cargarEntorno, validarEntorno } from './helpers/environment'
const env = cargarEntorno()
validarEntorno(env)
export default mergeConfig(baseConfig, {
  envDir: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL) },
})

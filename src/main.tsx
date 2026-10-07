import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'


import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/theme.css'
import './styles/global.css'
import App from './App'
import AuthProvider from './auth/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
  </StrictMode>,
)

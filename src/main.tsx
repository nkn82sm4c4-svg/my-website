import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installJsonModelTransport } from './lib/modelTransport'

if (import.meta.env.VITE_MODELS_AS_JSON === '1') installJsonModelTransport()

// Arabic RTL for the whole document (also covers modals rendered into <body>).
document.documentElement.lang = 'ar'
document.documentElement.dir = 'rtl'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

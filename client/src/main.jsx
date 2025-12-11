import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { GodModeProvider } from './context/GodModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GodModeProvider>
      <App />
    </GodModeProvider>
  </StrictMode>,
)

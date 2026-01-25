import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { GodModeProvider } from './context/GodModeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { RealTimeNotificationProvider } from './context/RealTimeNotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GodModeProvider>
      <NotificationProvider>
        <RealTimeNotificationProvider>
            <App />
        </RealTimeNotificationProvider>
      </NotificationProvider>
    </GodModeProvider>
  </StrictMode>,
)

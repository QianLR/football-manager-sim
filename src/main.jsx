import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import LanguageToggle from './i18n/LanguageToggle.jsx'
import RenderedTranslator from './i18n/RenderedTranslator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <RenderedTranslator />
      <LanguageToggle />
      <GameProvider>
        <App />
      </GameProvider>
    </LanguageProvider>
  </StrictMode>,
)

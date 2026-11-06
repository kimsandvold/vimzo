import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { matchPath } from 'react-router-dom'
import App from './App'
import { LAZY_RUTER } from './routes'

/**
 * Last JS-biten for gjeldende URL før React tar over.
 *
 * Uten dette ville den forhåndsrendrede siden først blitt byttet mot
 * «Laster …», og så mot den ekte siden ett nettverkshopp senere. Med
 * forhåndslastingen bytter React den statiske HTML-en direkte mot den ekte
 * komponenten, og besøkende ser ingen forskjell.
 */
function forhandslastRute(): Promise<unknown> {
  const sti = window.location.pathname
  const treff = LAZY_RUTER.find(({ path }) => matchPath(path, sti))
  return treff ? treff.Side.preload().catch(() => undefined) : Promise.resolve()
}

const rot = createRoot(document.getElementById('root')!)

forhandslastRute().then(() => {
  rot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

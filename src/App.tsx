import { Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import theme from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import SkipLink from './components/shared/SkipLink'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Laster from './components/shared/Laster'
import Kontaktknapp from './components/shared/Kontaktknapp'
import ForsideSide from './components/pages/Forside/ForsideSide'
import IkkeFunnetSide from './components/pages/IkkeFunnet/IkkeFunnetSide'
import { LAZY_RUTER } from './routes'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <Ramme>
        <main id="innhold">
          <Suspense fallback={<Laster />}>
            <Routes>
              {/* Forsiden lastes ikke som egen bit – den er den vanligste
                  landingssiden, og skal vises uten ett eneste rundturs-hopp. */}
              <Route path="/" element={<ForsideSide />} />
              {LAZY_RUTER.map(({ path, Side }) => (
                <Route key={path} path={path} element={<Side />} />
              ))}
              <Route path="*" element={<IkkeFunnetSide />} />
            </Routes>
          </Suspense>
        </main>
        </Ramme>
      </BrowserRouter>
    </ThemeProvider>
  )
}

/**
 * Navbar, fot og kontaktknapp rundt innholdet – unntatt på eksempelsider, i
 * /admin og på /min-side, som har sin egen enkle topplinje.
 *
 * Eksempelet på en arrangementsside skal se ut som kundens side, ikke som
 * vår. Med Vimzos meny over og fot under ville det sett ut som en seksjon på
 * vimzo.no, og da beviser det ingenting.
 */
function Ramme({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  if (pathname.endsWith('/eksempel') || pathname.startsWith('/admin') || pathname.startsWith('/min-side'))
    return <>{children}</>
  return (
    <>
      <SkipLink />
      <Navbar />
      {children}
      <Footer />
      <Kontaktknapp />
    </>
  )
}

import { Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
        <SkipLink />
        <Navbar />
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
        <Footer />
        <Kontaktknapp />
      </BrowserRouter>
    </ThemeProvider>
  )
}

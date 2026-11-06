import { lazyPage, type LazyPage } from './lib/lazyPage'

/**
 * Alle sider som lastes som egne JS-biter (code splitting), med ruta de hører
 * til. `App.tsx` lager <Route>-ene fra denne lista, og `main.tsx` bruker den
 * til å laste biten for gjeldende URL FØR React tar over den forhåndsrendrede
 * HTML-en. Da byttes den statiske siden direkte mot den ekte, uten å blinke
 * innom «Laster …».
 *
 * Ny side? Legg den til her – ikke som egen import i App.tsx.
 */
export const LAZY_RUTER: Array<{ path: string; Side: LazyPage }> = [
  { path: '/tjenester', Side: lazyPage(() => import('./components/pages/Tjenester/TjenesterSide')) },
  { path: '/priser', Side: lazyPage(() => import('./components/pages/Priser/PriserSide')) },
  { path: '/arbeid', Side: lazyPage(() => import('./components/pages/Arbeid/ArbeidSide')) },
  { path: '/arbeid/:slug', Side: lazyPage(() => import('./components/pages/Arbeid/CaseSide')) },
  { path: '/guider', Side: lazyPage(() => import('./components/pages/Guider/GuiderSide')) },
  { path: '/guider/:slug', Side: lazyPage(() => import('./components/pages/Guider/GuideSide')) },
  { path: '/logo', Side: lazyPage(() => import('./components/pages/Logo/LogoSide')) },
  { path: '/om', Side: lazyPage(() => import('./components/pages/Om/OmSide')) },
  { path: '/kontakt', Side: lazyPage(() => import('./components/pages/Kontakt/KontaktSide')) },
  { path: '/personvern', Side: lazyPage(() => import('./components/pages/Personvern/PersonvernSide')) },
]

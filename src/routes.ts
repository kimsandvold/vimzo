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
  { path: '/arrangement', Side: lazyPage(() => import('./components/pages/Arrangement/ArrangementSide')) },
  { path: '/arrangement/eksempel', Side: lazyPage(() => import('./components/pages/Arrangement/EksempelSide')) },
  { path: '/logo', Side: lazyPage(() => import('./components/pages/Logo/LogoSide')) },
  // Profilboka som ren side – ingen meny eller fot (se Ramme i App.tsx).
  { path: '/logo/profil', Side: lazyPage(() => import('./components/pages/Logo/ProfilSide')) },
  { path: '/logo/profil/:id', Side: lazyPage(() => import('./components/pages/Logo/ProfilSide')) },
  { path: '/kontakt', Side: lazyPage(() => import('./components/pages/Kontakt/KontaktSide')) },
  // Kundenes Min side og admin: ikke i sitemap, ikke forhåndsrendret, noindex.
  { path: '/min-side', Side: lazyPage(() => import('./components/pages/MinSide/MinSide')) },
  { path: '/admin', Side: lazyPage(() => import('./components/pages/Admin/AdminSide')) },
  { path: '/admin/ny', Side: lazyPage(() => import('./components/pages/Admin/NySak')) },
  { path: '/admin/logo', Side: lazyPage(() => import('./components/pages/Admin/Logobestillinger')) },
  { path: '/admin/sak/:id', Side: lazyPage(() => import('./components/pages/Admin/SakSide')) },
  { path: '/personvern', Side: lazyPage(() => import('./components/pages/Personvern/PersonvernSide')) },
  { path: '/vilkar/logo', Side: lazyPage(() => import('./components/pages/Vilkar/LogoVilkarSide')) },
]

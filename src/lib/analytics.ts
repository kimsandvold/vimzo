/**
 * Google Analytics – bare med samtykke.
 *
 * Ingenting lastes fra Google før den besøkende har trykket «Godta». Det er
 * kravet i ekomloven (2025): informasjonskapsler som ikke er strengt
 * nødvendige, krever aktivt samtykke – og å avvise skal være like lett som å
 * godta. Avviser man, eller lar banneret stå, sendes ingenting.
 *
 * Valget lagres i nettleseren (localStorage), så banneret ikke spør på hver
 * side. Det kan endres når som helst via «Informasjonskapsler» i bunnteksten.
 *
 * Er VITE_GA_ID tom, finnes det ingen analyse og intet banner.
 */

export const GA_ID = import.meta.env.VITE_GA_ID as string | undefined
export const analyseKlar = Boolean(GA_ID)

export type Samtykke = 'ja' | 'nei'

const NOKKEL = 'vimzo-samtykke'
const HENDELSE = 'vimzo-samtykke-endret'

/** Sider uten statistikk: admin, kundeområdet og eksempelsider. */
export const utenAnalyse = (sti: string) =>
  sti.startsWith('/admin') || sti.startsWith('/min-side') || sti.endsWith('/eksempel')

export function lesSamtykke(): Samtykke | null {
  try {
    const v = localStorage.getItem(NOKKEL)
    return v === 'ja' || v === 'nei' ? v : null
  } catch {
    return null
  }
}

export function lagreSamtykke(valg: Samtykke) {
  try {
    localStorage.setItem(NOKKEL, valg)
  } catch {
    // Privat modus – valget gjelder bare denne sidevisningen.
  }
  if (valg === 'ja') startAnalyse()
  else stoppAnalyse()
  window.dispatchEvent(new Event(HENDELSE))
}

/** Be banneret vise seg igjen – fra «Informasjonskapsler» i bunnteksten. */
export function apneSamtykke() {
  try {
    localStorage.removeItem(NOKKEL)
  } catch {
    // ignorer
  }
  window.dispatchEvent(new Event(HENDELSE))
}

export function vedSamtykkeEndring(fn: () => void): () => void {
  window.addEventListener(HENDELSE, fn)
  return () => window.removeEventListener(HENDELSE, fn)
}

type Gtag = (...args: unknown[]) => void
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

let startet = false

/** Googles egen av/på-bryter for målingen: window['ga-disable-<id>']. */
function settAvslag(av: boolean) {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = av
}

/** Last gtag.js og begynn å måle. Kalles bare etter et ja. */
export function startAnalyse() {
  if (!GA_ID || startet || typeof window === 'undefined') return
  // Forhåndsrendringen kjører i en headless nettleser – den skal aldri telles.
  if (navigator.webdriver) return
  startet = true
  // Fjern et eventuelt tidligere «nei» fra Googles side av saken.
  settAvslag(false)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // Sidevisninger sendes for hånd ved hver ruteendring (se `sendSidevisning`),
  // så GA ikke teller den første to ganger.
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

/** Slutt å måle, og slett Googles informasjonskapsler fra dette domenet. */
export function stoppAnalyse() {
  if (!GA_ID) return
  settAvslag(true)
  for (const navn of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (navn === '_ga' || navn.startsWith('_ga_') || navn === '_gid') {
      const domene = location.hostname.replace(/^www\./, '')
      document.cookie = `${navn}=; Max-Age=0; path=/`
      document.cookie = `${navn}=; Max-Age=0; path=/; domain=.${domene}`
    }
  }
}

/** Én sidevisning – kalles ved hver ruteendring i appen. */
export function sendSidevisning(sti: string) {
  if (!startet || !window.gtag || utenAnalyse(sti)) return
  window.gtag('event', 'page_view', {
    page_path: sti,
    page_location: location.href,
    page_title: document.title,
  })
}

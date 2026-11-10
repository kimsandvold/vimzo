/**
 * Saksgangen i /admin: statuser, rekkefølge og hva som lagres for hver sak.
 *
 * En «sak» er en henvendelse som følges fra første kontakt til betalt – og
 * videre som driftskunde. Statusene følger den faktiske gangen i et
 * prosjekt, og hvert steg stempler sin egen dato, slik at du i etterkant ser
 * nøyaktig når tilbudet gikk ut, når det ble godtatt og når det ble betalt.
 */

export type Status =
  | 'ny'
  | 'kontaktet'
  | 'mote'
  | 'tilbud'
  | 'godtatt'
  | 'avvist'
  | 'arbeid'
  | 'levert'
  | 'fakturert'
  | 'betalt'
  | 'lukket'

export interface Statusinfo {
  id: Status
  navn: string
  /** Kort forklaring i statusvelgeren. */
  hint: string
  /** Hva som spørres om når saken flyttes hit. */
  felt?: 'belop' | 'grunn'
  /** Saker som er ferdige – vises ikke blant de aktive. */
  ferdig?: boolean
  tone: 'ny' | 'aktiv' | 'venter' | 'bra' | 'nøytral' | 'stopp'
}

export const STATUSER: readonly Statusinfo[] = [
  { id: 'ny', navn: 'Ny', hint: 'Mottatt, ikke svart ennå', tone: 'ny' },
  { id: 'kontaktet', navn: 'Kontaktet', hint: 'Du har svart eller ringt', tone: 'aktiv' },
  { id: 'mote', navn: 'Møte avtalt', hint: 'Samtalen er satt opp', tone: 'aktiv' },
  { id: 'tilbud', navn: 'Tilbud sendt', hint: 'Venter på svar', felt: 'belop', tone: 'venter' },
  { id: 'godtatt', navn: 'Godtatt', hint: 'Kunden sa ja', tone: 'bra' },
  { id: 'avvist', navn: 'Avvist', hint: 'Kunden sa nei', felt: 'grunn', ferdig: true, tone: 'stopp' },
  { id: 'arbeid', navn: 'Under arbeid', hint: 'Siden lages', tone: 'aktiv' },
  { id: 'levert', navn: 'Levert', hint: 'Siden er på nett', tone: 'bra' },
  { id: 'fakturert', navn: 'Fakturert', hint: 'Faktura er sendt', felt: 'belop', tone: 'venter' },
  { id: 'betalt', navn: 'Betalt', hint: 'Pengene er kommet', ferdig: true, tone: 'bra' },
  { id: 'lukket', navn: 'Ikke aktuell', hint: 'Lukket uten oppdrag', felt: 'grunn', ferdig: true, tone: 'nøytral' },
] as const

export const status = (id: Status): Statusinfo => STATUSER.find((s) => s.id === id) ?? STATUSER[0]

export type Kilde = 'kalkulator' | 'kontakt' | 'manuell'

export const KILDER: Record<Kilde, string> = {
  kalkulator: 'Kalkulatoren',
  kontakt: 'Kontaktskjemaet',
  manuell: 'Lagt inn selv',
}

/** Det kunden sender inn. Skrives av skjemaene – og bare dette. */
export interface NyHenvendelse {
  kilde: Kilde
  navn: string
  bedrift: string
  epost: string
  telefon: string
  melding: string
  /** Oppsummeringen fra kalkulatoren som tekst, eller '' fra kontaktsiden. */
  brief: string
  /** Hva kunden valgte eller landet på: «Bedrift», «Arrangement» … */
  pakke: string
  /** Anslaget fra kalkulatoren. `til: null` betyr «fra». */
  anslag: { fra: number; til: number | null } | null
  /**
   * Id-en til en logo kunden har laget i logoverktøyet og valgt i
   * kalkulatoren, eller ''. Logoen faktureres med nettsiden; i saken kan
   * Vimzo se den og frigi filene til kunden.
   */
  logodesign?: string
}

export interface Hendelse {
  status: Status
  /** Millisekunder siden 1970 – lagres som tall så det kan legges i en liste. */
  tid: number
  belop?: number
  grunn?: string
}

export interface Notat {
  tekst: string
  tid: number
}

export interface Drift {
  /** Kr per måned, eks. mva. */
  manedspris: number
  /** Første måned med drift, som 'ÅÅÅÅ-MM-DD'. */
  fra: string
  /** Siste måned, eller null mens den løper. */
  til: string | null
}

/** En sak slik den ligger i Firestore og vises i /admin. */
export interface Sak extends NyHenvendelse {
  id: string
  opprettet: number
  status: Status
  /** Hver statusendring, eldste først. */
  historikk: Hendelse[]
  notater: Notat[]
  /** 'ÅÅÅÅ-MM-DD' – saken løftes fram når datoen nærmer seg. */
  nesteOppfolging: string | null
  tilbudBelop: number | null
  fakturertBelop: number | null
  drift: Drift | null
  /** Når du sist åpnet saken – meldinger fra kunden etter dette er «nye». */
  sistLest: number | null
  oppdatert: number
}

/** Når en status ble satt sist – fra historikken. */
export function datoFor(sak: Sak, s: Status): number | null {
  for (let i = sak.historikk.length - 1; i >= 0; i--) if (sak.historikk[i].status === s) return sak.historikk[i].tid
  return null
}

/** Sant når driften løper i dag. */
export function driftAktiv(d: Drift | null, idag = new Date().toISOString().slice(0, 10)): d is Drift {
  return !!d && d.fra <= idag && (d.til === null || d.til >= idag)
}

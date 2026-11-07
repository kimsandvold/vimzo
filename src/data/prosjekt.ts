import { datoFor, type Drift, type Sak, type Status } from './saker'

/**
 * Det kunden ser på Min side.
 *
 * Et eget dokument, adskilt fra den interne saken – Firestore beskytter hele
 * dokumenter, ikke enkeltfelter, så notatene dine og grunnen til et avslag
 * kan ikke ligge i samme dokument som kunden får lese. Admin holder det
 * oppdatert automatisk fra saken; kunden kan bare godta tilbudet og skrive
 * meldinger.
 */
export interface Prosjekt {
  id: string
  /** Små bokstaver. Det er denne som avgjør hvem som får lese prosjektet. */
  kundeEpost: string
  tittel: string
  status: Status
  /** Statusendringene, uten beløp og uten interne grunner. */
  tidslinje: { status: Status; tid: number }[]
  /** 'ÅÅÅÅ-MM-DD'. Skrives av admin for hånd, ikke synkronisert fra saken. */
  forventetLevering: string | null
  tilbud: { belop: number; sendt: number | null } | null
  /** Hva tilbudet dekker, med kundens ord. Skrives av admin for hånd. */
  tilbudsbeskrivelse: string
  /** Når kunden godtok tilbudet her inne. Settes av kunden, aldri av admin. */
  tilbudGodtatt: number | null
  faktura: { belop: number; dato: number | null; betalt: number | null } | null
  drift: Drift | null
  /** Når kunden sist skrev en melding – så admin ser at det er noe nytt. */
  sistKundemelding: number | null
  oppdatert: number
}

export interface Melding {
  id: string
  fra: 'kunde' | 'vimzo'
  navn: string
  tekst: string
  tid: number
}

/** Statusnavnene slik kunden ser dem – vennlige, og uten interne grunner. */
export const KUNDESTATUS: Record<Status, string> = {
  ny: 'Mottatt',
  kontaktet: 'Vi har tatt kontakt',
  mote: 'Møte avtalt',
  tilbud: 'Tilbud sendt',
  godtatt: 'Tilbud godtatt',
  avvist: 'Avsluttet',
  arbeid: 'Under arbeid',
  levert: 'Levert',
  fakturert: 'Fakturert',
  betalt: 'Betalt',
  lukket: 'Avsluttet',
}

/** Stegene i fremdriftslinja på Min side. */
export const STEG: { navn: string; statuser: Status[] }[] = [
  { navn: 'Mottatt', statuser: ['ny', 'kontaktet', 'mote'] },
  { navn: 'Tilbud', statuser: ['tilbud', 'godtatt'] },
  { navn: 'Under arbeid', statuser: ['arbeid'] },
  { navn: 'Levert', statuser: ['levert', 'fakturert'] },
  { navn: 'Betalt', statuser: ['betalt'] },
]

/**
 * Feltene admin skriver til prosjektet, utledet fra saken.
 *
 * Med vilje ikke her: `tilbudGodtatt` og `sistKundemelding`, som eies av
 * kunden, og `forventetLevering` og `tilbudsbeskrivelse`, som du skriver for
 * hånd. Ingen av dem skal overskrives når saken synkroniseres.
 */
export function prosjektFra(sak: Sak) {
  const fakturert = datoFor(sak, 'fakturert')
  return {
    kundeEpost: sak.epost.trim().toLowerCase(),
    tittel: sak.bedrift || sak.navn,
    status: sak.status,
    tidslinje: sak.historikk.map((h) => ({ status: h.status, tid: h.tid })),
    tilbud: sak.tilbudBelop !== null ? { belop: sak.tilbudBelop, sendt: datoFor(sak, 'tilbud') } : null,
    faktura:
      sak.fakturertBelop !== null ? { belop: sak.fakturertBelop, dato: fakturert, betalt: datoFor(sak, 'betalt') } : null,
    drift: sak.drift,
  }
}

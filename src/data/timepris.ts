import { kronerTilOre } from '../lib/kroner'
import type { Grunnlag } from '../lib/timepris'

/**
 * Timepriskalkulatoren: satser, standardverdier og bransjeprofiler.
 *
 * Verktøyet svarer på det spørsmålet småbedrifter googler oftest og får
 * dårligst svar på: hva må jeg egentlig ta i timen? Det er et fritt verktøy
 * av samme slag som navnesjekken og logoverktøyet – nyttig i seg selv, og
 * rettet mot nøyaktig det publikummet vi ellers selger nettsider til.
 *
 * Alt som kan endres uten å røre en komponent, ligger her. Satsene står ett
 * sted, og ingen annen fil skriver et satstall.
 */

/* ------------------------------------------------------------------ satser */

export const SATSER_GJELDENDE_FRA = '2026-01-01'

export const SATSER_KILDE = {
  navn: 'Skatteetaten',
  url: 'https://www.skatteetaten.no/satser/',
} as const

/**
 * Feriepenger, i prosent av feriepengegrunnlaget.
 *
 * 10,2 % er lovens minimum ved fire uker og én dag ferie. De fleste har
 * avtale om fem uker, som gir 12 %. Vi bruker 12, fordi for lavt anslag her
 * gir for lav timepris – og det er den farlige retningen å bomme i.
 */
export const FERIEPENGESATS = 12

/** Obligatorisk tjenestepensjon, i prosent av lønn. 2 % er lovens minimum. */
export const OTP_SATS = 2

export interface AgaSone {
  readonly id: string
  readonly navn: string
  readonly sats: number
  readonly hint: string
}

/**
 * Arbeidsgiveravgift. Satsen følger kommunen virksomheten er registrert i.
 *
 * Sone 1 står først fordi det er der flest holder til, og fordi det er den
 * høyeste satsen: bommer vi, bommer vi mot en for høy timepris.
 */
export const AGA_SONER: readonly AgaSone[] = [
  { id: '1', navn: 'Sone 1', sats: 14.1, hint: 'De fleste by- og tettstedskommuner' },
  { id: '1a', navn: 'Sone 1a', sats: 14.1, hint: 'Redusert sats opptil fribeløpet' },
  { id: '2', navn: 'Sone 2', sats: 10.6, hint: '' },
  { id: '3', navn: 'Sone 3', sats: 6.4, hint: '' },
  { id: '4', navn: 'Sone 4', sats: 5.1, hint: '' },
  { id: '4a', navn: 'Sone 4a', sats: 7.9, hint: '' },
  { id: '5', navn: 'Sone 5', sats: 0, hint: 'Ingen arbeidsgiveravgift' },
]

export const finnAgaSone = (id: string): AgaSone => AGA_SONER.find((s) => s.id === id) ?? AGA_SONER[0]

/* ------------------------------------------------------------- kostnadene */

export type KostnadsfeltId = keyof Grunnlag['fasteKostnader']

export interface Kostnadsfelt {
  readonly id: KostnadsfeltId
  readonly navn: string
  readonly hint: string
}

export const KOSTNADSFELT: readonly Kostnadsfelt[] = [
  { id: 'lokale', navn: 'Lokale eller verksted', hint: 'Husleie, strøm, kommunale avgifter' },
  { id: 'forsikring', navn: 'Forsikring', hint: 'Yrkesskade, ansvar, innbo og maskiner' },
  { id: 'verktoy', navn: 'Verktøy og utstyr', hint: 'Det du kjøper og slites opp i løpet av et år' },
  { id: 'transport', navn: 'Bil og transport', hint: 'Drivstoff, service, forsikring, bompenger' },
  { id: 'regnskap', navn: 'Regnskap og programvare', hint: 'Regnskapsfører, fakturasystem, abonnementer' },
  { id: 'kontor', navn: 'Telefon, internett og markedsføring', hint: 'Også nettside, annonser og bilmerking' },
  { id: 'annet', navn: 'Annet', hint: 'Kurs, sertifisering, medlemskap, arbeidsklær' },
]

export const DRIFTSFORMER = [
  { verdi: 'enk' as const, navn: 'Enkeltpersonforetak', hint: 'Du tar ut overskuddet og betaler skatt privat' },
  { verdi: 'as' as const, navn: 'Aksjeselskap', hint: 'Du tar ut lønn – og lønn koster selskapet mer enn beløpet' },
]

export const FAKTURERBAR_FORKLARING =
  'Befaring, tilbudsskriving, innkjøp, kjøring, rydding, regnskap og salg er arbeid du ikke får ' +
  'betalt for. De færreste kommer over 70 %. Er du usikker, er 65 et bedre anslag enn 90.'

export const BUFFER_FORKLARING =
  'Overskudd ut over det som dekker lønn og kostnader. Det er dette som betaler for dårlige år, ' +
  'sykdom uten sykepenger, og nytt utstyr når det gamle ryker.'

/* ------------------------------------------------------- standardgrunnlag */

export const STANDARD: Grunnlag = {
  driftsform: 'enk',
  onsketInntekt: kronerTilOre(600_000),
  agaSone: '1',
  fasteKostnader: { lokale: 0, forsikring: 0, verktoy: 0, transport: 0, regnskap: 0, kontor: 0, annet: 0 },
  arbeidsuker: 46,
  timerPerUke: 40,
  fakturerbarAndel: 65,
  buffer: 15,
  dagensTimepris: null,
}

/**
 * Navnesjekken: er firmanavnet ledig?
 *
 * To offentlige kilder, begge spurt direkte fra nettleseren – ingen server
 * bak, ingen nøkler:
 *
 *   – Enhetsregisteret (data.brreg.no). Åpent API med
 *     `Access-Control-Allow-Origin: *`. To søk: «begynner med» for å finne
 *     samme navn, og det vanlige, slarkete navnesøket for å finne lignende.
 *   – Norids RDAP for .no-domenene (samme oppslag som domenesjekken i
 *     kalkulatoren, se hooks/useDomenesjekk.ts): 404 er ledig, 200 er tatt.
 *
 * Svaret er alltid en pekepinn, ikke en dom. Om et navn kan registreres,
 * avgjør Foretaksregisteret, og varemerker står i et eget register hos
 * Patentstyret. Siden sier begge deler.
 */

const BRREG = 'https://data.brreg.no/enhetsregisteret/api/enheter'
const RDAP = 'https://rdap.norid.no/domain/'

export const MAKS_NAVN = 80

export interface Enhet {
  orgnr: string
  navn: string
  form: string
  sted: string
  /** Konkurs, under avvikling eller slettet – navnet kan da bli ledig. */
  inaktiv: boolean
}

export interface Registersvar {
  /** Samme navn, bare med en annen selskapsform eller tegnsetting. */
  like: Enhet[]
  /** Navn som begynner med det samme. */
  begynnerLikt: Enhet[]
  /** Totalt antall som begynner likt – lista over er bare de første. */
  antallBegynnerLikt: number
  /** Lignende navn fra Brønnøysunds eget navnesøk. */
  lignende: Enhet[]
}

/** Selskapsformene som henger etter navnet og ikke er en del av det. */
const FORMER = /\b(asa|as|a\/s|enk|da|ans|sa|nuf|ba|ks|fli|stiftelse)\.?$/i

/**
 * Navnet slik det sammenlignes: store bokstaver, uten selskapsform, uten
 * tegnsetting, med enkle mellomrom. «Fjord-Bakeriet AS» og «FJORDBAKERIET»
 * er ikke det samme her – det er de heller ikke for registeret – men
 * «Fjordbakeriet AS» og «fjordbakeriet» er.
 */
export function normaliser(navn: string): string {
  let s = navn.trim().replace(/\s+/g, ' ')
  // To runder: «Bakeriet AS ENK» finnes ikke, men «… DA.» gjør.
  for (let i = 0; i < 2; i++) s = s.replace(FORMER, '').trim()
  return s
    .replace(/[^\p{L}\p{N}& ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('nb-NO')
}

interface BrregEnhet {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: { beskrivelse?: string; kode?: string }
  forretningsadresse?: { poststed?: string }
  postadresse?: { poststed?: string }
  konkurs?: boolean
  underAvvikling?: boolean
  underTvangsavviklingEllerTvangsopplosning?: boolean
  slettedato?: string
}

function tilEnhet(e: BrregEnhet): Enhet {
  return {
    orgnr: e.organisasjonsnummer,
    navn: e.navn,
    form: e.organisasjonsform?.beskrivelse ?? e.organisasjonsform?.kode ?? '',
    sted: e.forretningsadresse?.poststed ?? e.postadresse?.poststed ?? '',
    inaktiv: !!(e.konkurs || e.underAvvikling || e.underTvangsavviklingEllerTvangsopplosning || e.slettedato),
  }
}

async function sok(parametre: Record<string, string>, signal?: AbortSignal) {
  const r = await fetch(`${BRREG}?${new URLSearchParams(parametre)}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`Brønnøysund svarte ${r.status}`)
  const d = (await r.json()) as { _embedded?: { enheter?: BrregEnhet[] }; page?: { totalElements?: number } }
  return { enheter: (d._embedded?.enheter ?? []).map(tilEnhet), totalt: d.page?.totalElements ?? 0 }
}

export async function sjekkRegisteret(navn: string, signal?: AbortSignal): Promise<Registersvar> {
  const n = normaliser(navn)
  const [start, slarkete] = await Promise.all([
    sok({ navn: n, navnMetodeForSoek: 'FORTLOEPENDE', size: '30' }, signal),
    sok({ navn: n, size: '10' }, signal),
  ])
  const like = start.enheter.filter((e) => normaliser(e.navn) === n)
  const begynnerLikt = start.enheter.filter((e) => normaliser(e.navn) !== n)
  const sett = new Set(start.enheter.map((e) => e.orgnr))
  return {
    like,
    begynnerLikt: begynnerLikt.slice(0, 4),
    antallBegynnerLikt: Math.max(0, start.totalt - like.length),
    lignende: slarkete.enheter.filter((e) => !sett.has(e.orgnr) && normaliser(e.navn) !== n).slice(0, 4),
  }
}

/* ---------------------------------------------------------------- domene */

const GYLDIG = /^[a-z0-9æøå](?:[a-z0-9æøå-]{0,61}[a-z0-9æøå])?\.no$/

/**
 * De .no-domenene som er naturlige for navnet: i ett ord, med bindestrek
 * mellom ordene, og uten æ, ø og å – mange skriver det slik, og domener med
 * norske bokstaver virker dårlig i e-postadresser.
 */
export function domeneforslag(navn: string): string[] {
  const ord = normaliser(navn)
    .toLocaleLowerCase('nb-NO')
    .replace(/&/g, 'og')
    .split(' ')
    .map((o) => o.replace(/[^a-z0-9æøå]/g, ''))
    .filter(Boolean)
  if (!ord.length) return []
  const ascii = (s: string) => s.replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
  const kandidater = [ord.join(''), ord.join('-'), ascii(ord.join(''))].map((d) => `${d}.no`)
  return [...new Set(kandidater)].filter((d) => GYLDIG.test(d)).slice(0, 3)
}

export type Domenestatus = 'ledig' | 'opptatt' | 'feil'

export async function sjekkDomene(domene: string, signal?: AbortSignal): Promise<Domenestatus> {
  try {
    const r = await fetch(`${RDAP}${encodeURIComponent(domene)}`, { method: 'HEAD', signal })
    if (r.status === 404) return 'ledig'
    if (r.status === 200) return 'opptatt'
    return 'feil'
  } catch (e) {
    if (signal?.aborted) throw e
    return 'feil'
  }
}

/** Lenker til kildene, så kunden kan se selv. */
export const brregLenke = (orgnr: string) => `https://virksomhet.brreg.no/nb/oppslag/enheter/${orgnr}`
export const PATENTSTYRET = 'https://search.patentstyret.no/'

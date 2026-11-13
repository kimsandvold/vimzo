/**
 * Fristkalenderen: hvilke frister gjelder for akkurat denne bedriften?
 *
 * Alt her er rene funksjoner over datoer som tekst («2027-03-15»). Ingen
 * `Date` med klokkeslett slipper ut, så tidssoner kan ikke flytte en frist
 * én dag – noe som ellers skjer akkurat rundt midnatt i en kalenderfil.
 *
 * Kildene er Skatteetaten og Brønnøysundregistrene (sjekket november 2026).
 * Endres en regel, er det her – og testene i `frister.test.ts` skal feile
 * til tallet er sjekket på nytt.
 *
 * Grunnregel: faller en frist på lørdag, søndag eller helligdag, flyttes den
 * til neste virkedag. Der vi IKKE har bekreftet at fristen flyttes, lar vi den
 * stå. En frist som vises for tidlig er ufarlig; en som vises for sent er ikke.
 */

export type Selskapsform = 'enk' | 'as'

/** Hvor ofte bedriften leverer mva-melding. */
export type Mvatermin = 'ingen' | 'tomaaned' | 'aar'

export interface Profil {
  readonly form: Selskapsform
  readonly mva: Mvatermin
  /** Betaler bedriften ut lønn – også til eieren i et AS? */
  readonly lonn: boolean
  /** Dag i måneden lønnen utbetales (1–31). Bare brukt når `lonn` er sann. */
  readonly lonningsdag: number
}

export type Kategori = 'mva' | 'lonn' | 'skatt' | 'arsoppgjor'

export interface Frist {
  /** Stabil id – brukes som UID i kalenderfila, så oppdateringer erstatter gamle hendelser. */
  readonly id: string
  /** Den datoen som faktisk gjelder, etter eventuell flytting. */
  readonly dato: string
  /** Datoen regelen sier, før flytting. Lik `dato` når ingenting er flyttet. */
  readonly regeldato: string
  readonly kategori: Kategori
  readonly tittel: string
  /** Hva som skal gjøres, i én eller to setninger. */
  readonly hva: string
  readonly lenke: string
}

/* ------------------------------------------------------------------ */
/* Datoer                                                              */
/* ------------------------------------------------------------------ */

function tilTekst(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dato(ar: number, maned: number, dag: number): Date {
  return new Date(Date.UTC(ar, maned - 1, dag))
}

function fraTekst(t: string): Date {
  const [a, m, d] = t.split('-').map(Number)
  return dato(a, m, d)
}

function plussDager(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000)
}

/** Siste dag i måneden – for lønningsdag 31 i februar osv. */
function sisteDag(ar: number, maned: number): number {
  return new Date(Date.UTC(ar, maned, 0)).getUTCDate()
}

/** Første påskedag (gregoriansk, «anonym» algoritme). */
export function paskedag(ar: number): string {
  const a = ar % 19
  const b = Math.floor(ar / 100)
  const c = ar % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const maned = Math.floor((h + l - 7 * m + 114) / 31)
  const dag = ((h + l - 7 * m + 114) % 31) + 1
  return tilTekst(dato(ar, maned, dag))
}

const helligdagCache = new Map<number, Set<string>>()

/** Norske helligdager og høytidsdager. Julaften og nyttårsaften er virkedager. */
export function helligdager(ar: number): Set<string> {
  const lagret = helligdagCache.get(ar)
  if (lagret) return lagret

  const pask = fraTekst(paskedag(ar))
  const fraPaske = [-3, -2, 0, 1, 39, 49, 50].map((n) => tilTekst(plussDager(pask, n)))
  const faste = ['01-01', '05-01', '05-17', '12-25', '12-26'].map((md) => `${ar}-${md}`)
  const sett = new Set([...faste, ...fraPaske])
  helligdagCache.set(ar, sett)
  return sett
}

export function erVirkedag(t: string): boolean {
  const d = fraTekst(t)
  const ukedag = d.getUTCDay()
  if (ukedag === 0 || ukedag === 6) return false
  return !helligdager(d.getUTCFullYear()).has(t)
}

/** Datoen selv hvis den er en virkedag, ellers første virkedag etter. */
export function nesteVirkedag(t: string): string {
  let d = fraTekst(t)
  while (!erVirkedag(tilTekst(d))) d = plussDager(d, 1)
  return tilTekst(d)
}

/** Første virkedag strengt ETTER datoen. */
function virkedagEtter(t: string): string {
  return nesteVirkedag(tilTekst(plussDager(fraTekst(t), 1)))
}

/** Datoen selv hvis den er en virkedag, ellers siste virkedag før. */
function forrigeVirkedag(t: string): string {
  let d = fraTekst(t)
  while (!erVirkedag(tilTekst(d))) d = plussDager(d, -1)
  return tilTekst(d)
}

/* ------------------------------------------------------------------ */
/* Reglene                                                             */
/* ------------------------------------------------------------------ */

const MANEDER = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
] as const

const LENKE = {
  mva: 'https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/mva/mva-melding/',
  amelding: 'https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/a-meldingen/',
  forskuddsskatt: 'https://www.skatteetaten.no/bedrift-og-organisasjon/skatt/forskuddsskatt/',
  skattemelding: 'https://www.skatteetaten.no/bedrift-og-organisasjon/skatt/skattemelding-naringsdrivende/',
  aksjonaer: 'https://www.skatteetaten.no/bedrift-og-organisasjon/rapportering-og-bransjer/aksjonarregisteroppgaven/',
  arsregnskap: 'https://www.brreg.no/regnskap/',
} as const

interface Utkast {
  id: string
  regeldato: string
  /** Flyttes fristen til neste virkedag? Bare der det er bekreftet. */
  flyttes: boolean
  kategori: Kategori
  tittel: string
  hva: string
  lenke: string
}

function utkastFor(profil: Profil, ar: number): Utkast[] {
  const ut: Utkast[] = []
  const d = (m: number, dag: number) => tilTekst(dato(ar, m, dag))

  // Mva, alminnelig tomånedlig termin. Fristen gjelder både melding og betaling.
  if (profil.mva === 'tomaaned') {
    const terminer: Array<[number, number, string]> = [
      [2, 10, `november–desember ${ar - 1}`],
      [4, 10, 'januar–februar'],
      [6, 10, 'mars–april'],
      [8, 31, 'mai–juni'],
      [10, 10, 'juli–august'],
      [12, 10, 'september–oktober'],
    ]
    for (const [m, dag, termin] of terminer) {
      ut.push({
        id: `mva-${ar}-${m}`,
        regeldato: d(m, dag),
        flyttes: true,
        kategori: 'mva',
        tittel: 'Mva-melding',
        hva: `Lever mva-meldingen og betal mva for ${termin}.`,
        lenke: LENKE.mva,
      })
    }
  }

  if (profil.mva === 'aar') {
    ut.push({
      id: `mva-ar-${ar}`,
      regeldato: d(3, 10),
      flyttes: true,
      kategori: 'mva',
      tittel: 'Mva-melding for hele året',
      hva: `Lever årsmeldingen for mva og betal mva for ${ar - 1}.`,
      lenke: LENKE.mva,
    })
  }

  if (profil.lonn) {
    // A-melding: den 5. hver måned, for lønn utbetalt måneden før.
    for (let m = 1; m <= 12; m++) {
      const forrige = MANEDER[(m + 10) % 12]
      ut.push({
        id: `amelding-${ar}-${m}`,
        regeldato: d(m, 5),
        flyttes: true,
        kategori: 'lonn',
        tittel: 'A-melding',
        hva: `Send a-meldingen for lønn utbetalt i ${forrige}.`,
        lenke: LENKE.amelding,
      })
    }

    // Arbeidsgiveravgift: annenhver måned, den 15.
    const aga: Array<[number, string]> = [
      [1, `november–desember ${ar - 1}`],
      [3, 'januar–februar'],
      [5, 'mars–april'],
      [7, 'mai–juni'],
      [9, 'juli–august'],
      [11, 'september–oktober'],
    ]
    for (const [m, periode] of aga) {
      ut.push({
        id: `aga-${ar}-${m}`,
        regeldato: d(m, 15),
        flyttes: true,
        kategori: 'lonn',
        tittel: 'Arbeidsgiveravgift',
        hva: `Betal arbeidsgiveravgiften for ${periode}.`,
        lenke: LENKE.amelding,
      })
    }

    // Forskuddstrekk: fra 2026 første virkedag etter at lønnen er utbetalt.
    // Faller lønningsdagen på en fridag, regner vi med at lønnen går ut
    // siste virkedag før – slik de fleste lønnssystemer gjør.
    for (let m = 1; m <= 12; m++) {
      const dag = Math.min(profil.lonningsdag, sisteDag(ar, m))
      const utbetalt = forrigeVirkedag(d(m, dag))
      ut.push({
        id: `trekk-${ar}-${m}`,
        regeldato: virkedagEtter(utbetalt),
        flyttes: false, // allerede en virkedag
        kategori: 'lonn',
        tittel: 'Forskuddstrekk',
        hva: `Betal skattetrekket fra lønnen for ${MANEDER[m - 1]}. Fristen er første virkedag etter lønningsdagen.`,
        lenke: LENKE.amelding,
      })
    }
  }

  if (profil.form === 'enk') {
    for (const m of [3, 6, 9, 12]) {
      ut.push({
        id: `forskudd-${ar}-${m}`,
        regeldato: d(m, 15),
        flyttes: true,
        kategori: 'skatt',
        tittel: 'Forskuddsskatt',
        hva: 'Betal forskuddsskatt. Beløp og KID finner du på skatteetaten.no.',
        lenke: LENKE.forskuddsskatt,
      })
    }
    ut.push({
      id: `skattemelding-${ar}`,
      regeldato: d(5, 31),
      flyttes: true,
      kategori: 'arsoppgjor',
      tittel: 'Skattemelding for næringsdrivende',
      hva: `Lever skattemeldingen med næringsspesifikasjon for ${ar - 1}.`,
      lenke: LENKE.skattemelding,
    })
  }

  if (profil.form === 'as') {
    for (const [m, nr] of [[2, 1], [4, 2]] as const) {
      ut.push({
        id: `forskudd-${ar}-${m}`,
        regeldato: d(m, 15),
        flyttes: true,
        kategori: 'skatt',
        tittel: 'Forskuddsskatt for selskapet',
        hva: `Betal termin ${nr} av 2 av forskuddsskatten for ${ar - 1}.`,
        lenke: LENKE.forskuddsskatt,
      })
    }
    ut.push(
      {
        id: `aksjonaer-${ar}`,
        regeldato: d(1, 31),
        flyttes: true,
        kategori: 'arsoppgjor',
        tittel: 'Aksjonærregisteroppgaven',
        hva: `Lever aksjonærregisteroppgaven for ${ar - 1}.`,
        lenke: LENKE.aksjonaer,
      },
      {
        id: `skattemelding-${ar}`,
        regeldato: d(5, 31),
        flyttes: true,
        kategori: 'arsoppgjor',
        tittel: 'Skattemelding for selskapet',
        hva: `Lever skattemeldingen med næringsspesifikasjon for ${ar - 1}.`,
        lenke: LENKE.skattemelding,
      },
      {
        id: `generalforsamling-${ar}`,
        regeldato: d(6, 30),
        flyttes: false,
        kategori: 'arsoppgjor',
        tittel: 'Ordinær generalforsamling',
        hva: `Hold generalforsamlingen og fastsett årsregnskapet for ${ar - 1}.`,
        lenke: LENKE.arsregnskap,
      },
      {
        // Ikke bekreftet at denne flyttes ved helg – derfor står den.
        id: `arsregnskap-${ar}`,
        regeldato: d(7, 31),
        flyttes: false,
        kategori: 'arsoppgjor',
        tittel: 'Årsregnskap til Brønnøysund',
        hva: `Send årsregnskapet for ${ar - 1} til Regnskapsregisteret.`,
        lenke: LENKE.arsregnskap,
      },
    )
  }

  return ut
}

/**
 * Alle frister for profilen fra og med `fra` til og med `til` (begge «ÅÅÅÅ-MM-DD»),
 * sortert etter dato.
 */
export function fristerFor(profil: Profil, fra: string, til: string): Frist[] {
  const forsteAr = Number(fra.slice(0, 4))
  const sisteAr = Number(til.slice(0, 4))
  const alle: Frist[] = []

  for (let ar = forsteAr; ar <= sisteAr; ar++) {
    for (const u of utkastFor(profil, ar)) {
      const faktisk = u.flyttes ? nesteVirkedag(u.regeldato) : u.regeldato
      if (faktisk < fra || faktisk > til) continue
      alle.push({
        id: u.id,
        dato: faktisk,
        regeldato: u.regeldato,
        kategori: u.kategori,
        tittel: u.tittel,
        hva: u.hva,
        lenke: u.lenke,
      })
    }
  }

  return alle.sort((a, b) => (a.dato === b.dato ? a.id.localeCompare(b.id) : a.dato < b.dato ? -1 : 1))
}

/** Antall hele dager fra `fra` til `til`. Negativt hvis `til` er passert. */
export function dagerTil(fra: string, til: string): number {
  return Math.round((fraTekst(til).getTime() - fraTekst(fra).getTime()) / 86_400_000)
}

/** «ÅÅÅÅ-MM-DD» for i dag, i norsk tid. */
export function iDag(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(new Date())
}

/** Ett år frem: fra i dag til samme dato neste år. */
export function ettArFrem(fra: string): string {
  return `${Number(fra.slice(0, 4)) + 1}${fra.slice(4)}`
}

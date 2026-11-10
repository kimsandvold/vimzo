import {
  BRANSJETEMA,
  FONTER,
  TEKSTFONT,
  fontstabel,
  PALETTER,
  SKRIFTSTILER,
  STILER,
  SYMBOLER,
  type Beholder,
  type Familie,
  type Oppsett,
  type Palett,
  type Skriftstil,
  type Symbol,
} from './merker'
import type { Ikon } from './ikoner'
import { abstraktSerie, type Abstrakt } from './abstrakt'

/**
 * Motoren bak logoverktøyet: én datamodell for en logo, mål og plassering
 * regnet ut fra den, og generatoren som lager forslagene.
 *
 * En logo er ikke et bilde her, men en beskrivelse – symbol, skrift, farger,
 * oppsett. Da kan den samme beskrivelsen tegnes positiv, negativ, som ikon,
 * på et visittkort og på en bil uten at noe tegnes på nytt.
 */

/**
 * «monogram» er et symbol laget av initialene, «ikon» et vektorikon fra
 * Iconify som ligger i `design.ikon`. Alt annet er et av våre egne symboler.
 */
export type MerkeId = Symbol['id'] | 'monogram' | 'ikon' | 'abstrakt'

export interface Design {
  merke: MerkeId
  beholder: Beholder
  oppsett: Oppsett
  skrift: Skriftstil['id']
  palett: Palett['id']
  /** Om merket står i primær- eller aksentfargen. */
  merkefarge: 'primaer' | 'aksent'
  /** Avstanden mellom merke og navn, som faktor. 1 = standard. */
  avstand: number
  /** Merkets størrelse i forhold til navnet, som faktor. 1 = standard. */
  merkestorrelse: number
  /** Ekstra sperring oppå skriftstilens egen, i em. */
  sperring: number
  slagord: boolean
  /** Bokstavform: som stilen sier, som skrevet, store eller små. */
  bokstaver: Bokstaver
  /** Slagordet: sperrede versaler, vanlig tekst, eller i logoskriften. */
  slagstil: 'versal' | 'vanlig' | 'skrift'
  /** Det genererte merket, når `merke` er «abstrakt». Bare frø og familie. */
  abstrakt?: Abstrakt
  /** Ikonet, når `merke` er «ikon». Lagret som former, ikke som lenke. */
  ikon?: Ikon
}

export type Bokstaver = 'stil' | 'skrevet' | 'store' | 'sma'

export interface Innhold {
  navn: string
  slagord: string
}

/** Fargene én tegning skal ha. Positiv, negativ og ensfarget er bare tre slike. */
export interface Fargesett {
  merke: string
  /** Fargen på symbolet når det står i en beholder. */
  iBeholder: string
  tekst: string
  slagord: string
  /** Fargene et abstrakt merke tegnes med: primær, aksent, mørk – kontrastsjekket. */
  flerfarge: [string, string, string]
}

export const finnPalett = (id: string) => PALETTER.find((p) => p.id === id) ?? PALETTER[0]
export const finnSkrift = (id: string) => SKRIFTSTILER.find((s) => s.id === id) ?? SKRIFTSTILER[0]
export const finnSymbol = (id: string) => SYMBOLER.find((s) => s.id === id)

/** WCAG-kontrast mellom to hex-farger. */
export function kontrast(a: string, b: string): number {
  const lys = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [x, y] = [lys(a), lys(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** Den av kandidatene som står tydeligst mot bakgrunnen. */
const tydeligst = (bak: string, kandidater: string[]) =>
  kandidater.reduce((best, k) => (kontrast(k, bak) > kontrast(best, bak) ? k : best), kandidater[0])

/**
 * Fargene for én variant – med kontrasten sjekket, ikke antatt.
 *
 * En palett der aksent og mørk er like (som «Signal»), ga før et tomt,
 * mørkt felt der ikonet skulle stå: symbolet var tegnet, men i samme farge
 * som flisen. Nå velges fargene ut fra målt kontrast: merket skal skille seg
 * fra bakgrunnen (minst 1,6:1), og symbolet fra merket det står i (3:1).
 * Holder ikke ønsket farge, tas den tydeligste av de andre i paletten.
 */
export function fargesett(d: Design, variant: 'positiv' | 'negativ' | 'svart' | 'hvit'): Fargesett {
  const p = finnPalett(d.palett)
  const onsket = d.merkefarge === 'aksent' ? p.aksent : p.primaer
  const iFlis = (flis: string, kandidater: string[]) =>
    kandidater.find((k) => kontrast(k, flis) >= 3) ?? tydeligst(flis, kandidater)

  if (variant === 'positiv') {
    const bak = '#FFFFFF'
    const merke = kontrast(onsket, bak) >= (d.beholder === 'ingen' ? 3 : 1.6) ? onsket : p.primaer
    return {
      merke,
      iBeholder: iFlis(merke, ['#FFFFFF', p.lys, p.mork]),
      tekst: p.mork,
      slagord: blandMot(p.mork, '#FFFFFF', 0.42),
      flerfarge: [p.primaer, kontrast(p.aksent, bak) >= 1.6 ? p.aksent : blandMot(p.primaer, '#FFFFFF', 0.45), p.mork],
    }
  }
  if (variant === 'negativ') {
    const bak = p.primaer
    const flis = [p.aksent, '#FFFFFF', p.mork].find((k) => kontrast(k, bak) >= 1.6) ?? '#FFFFFF'
    return {
      merke: d.beholder === 'ingen' ? '#FFFFFF' : flis,
      iBeholder: iFlis(flis, [p.primaer, p.mork, '#FFFFFF']),
      tekst: '#FFFFFF',
      slagord: 'rgba(255,255,255,0.72)',
      flerfarge: [
        '#FFFFFF',
        kontrast(p.aksent, bak) >= 1.6 ? p.aksent : blandMot(bak, '#FFFFFF', 0.55),
        blandMot(bak, '#FFFFFF', 0.75),
      ],
    }
  }
  if (variant === 'svart')
    return {
      merke: '#111111',
      iBeholder: '#FFFFFF',
      tekst: '#111111',
      slagord: '#111111',
      flerfarge: ['#111111', '#111111', '#111111'],
    }
  return {
    merke: '#FFFFFF',
    iBeholder: '#111111',
    tekst: '#FFFFFF',
    slagord: '#FFFFFF',
    flerfarge: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
  }
}

/** Bland to hex-farger. Brukes til slagordets dempede tone. */
function blandMot(a: string, b: string, t: number) {
  const x = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = x(a)
  const [r2, g2, b2] = x(b)
  const m = (u: number, v: number) =>
    Math.round(u + (v - u) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`
}

/* ------------------------------------------------------------------- måling */

let lerret: CanvasRenderingContext2D | null = null

/**
 * Bredden på en tekst i en gitt skrift, målt med den ekte fonten.
 *
 * Den gamle versjonen gjettet (antall tegn × 0,56), og da fikk «Hansen Rør»
 * og «Willy's Bilverksted AS» like mye luft rundt seg som om de var like
 * lange. Canvas måler med fontens egne bredder og kjerning, så viewBox sitter
 * tett uansett navn. Sperringen legges på for hånd, fordi `letterSpacing`
 * på canvas ikke finnes i alle nettlesere ennå.
 */
export function malTekst(tekst: string, stil: Skriftstil, grad: number, ekstraSperring = 0): number {
  if (typeof document === 'undefined') return tekst.length * grad * 0.56
  lerret ??= document.createElement('canvas').getContext('2d')
  if (!lerret) return tekst.length * grad * 0.56
  lerret.font = `${stil.vekt} ${grad}px ${fontstabel(stil.font)}`
  const sperring = (stil.sperring + ekstraSperring) * grad
  // Sperringen kommer etter hvert tegn, også det siste – den luften tar vi bort
  // igjen, ellers står ordbildet skjevt når det sentreres.
  return lerret.measureText(tekst).width + sperring * Math.max(0, [...tekst].length - 1)
}

export function initialer(navn: string): string {
  const ord = navn
    .replace(/\b(AS|ASA|DA|ANS|ENK|SA)\b/gi, '')
    .trim()
    .split(/[\s\-&]+/)
    .filter(Boolean)
  if (ord.length === 0) return 'V'
  if (ord.length === 1) return ord[0].slice(0, 2).toUpperCase()
  return (ord[0][0] + ord[1][0]).toUpperCase()
}

/* ---------------------------------------------------------------- utlegging */

export interface Utlegg {
  bredde: number
  hoyde: number
  merke: { x: number; y: number; storrelse: number } | null
  navn: {
    x: number
    y: number
    grad: number
    anker: 'start' | 'middle'
  } | null
  slagord: {
    x: number
    y: number
    grad: number
    anker: 'start' | 'middle'
  } | null
}

/**
 * Plassering av merke, navn og slagord.
 *
 * Alt regnes fra skriftgraden, ikke fra faste piksler. Da holder proporsjonene
 * seg når logoen skaleres, og viewBox slutter nøyaktig der logoen slutter –
 * den nedlastede filen får ingen tilfeldig luft rundt seg.
 *
 * Merket står litt over versalhøyden, ikke midt på tekstboksen: det er den
 * optiske midten øyet leser, og et merke som står matematisk midt på ser ut
 * til å henge for lavt.
 */
export function legUt(d: Design, innhold: Innhold): Utlegg {
  const stil = finnSkrift(d.skrift)
  const navn = visningsnavn(innhold.navn, stil, d.bokstaver)
  const visSlagord = d.slagord && innhold.slagord.trim() !== '' && d.oppsett !== 'kun-merke'
  const G = 40
  const navnBredde = malTekst(navn, stil, G, d.sperring)
  const slag = slagordstil(d, innhold.slagord)
  const slagGrad = G * slag.grad
  const slagBredde = visSlagord ? malTekst(slag.tekst, slag.stil, slagGrad) : 0

  const M = (d.oppsett === 'over' ? G * 1.9 : G * 1.45) * d.merkestorrelse
  const rom = G * 0.5 * d.avstand
  const kapHoyde = G * FONTER[stil.font].kap

  if (d.oppsett === 'kun-merke') {
    return {
      bredde: M,
      hoyde: M,
      merke: { x: 0, y: 0, storrelse: M },
      navn: null,
      slagord: null,
    }
  }

  if (d.oppsett === 'ordbilde') {
    const bredde = Math.max(navnBredde, slagBredde)
    const hoyde = kapHoyde + (visSlagord ? G * 0.55 + slagGrad * 0.72 : 0)
    return {
      bredde,
      hoyde,
      merke: null,
      navn: { x: bredde / 2, y: kapHoyde, grad: G, anker: 'middle' },
      slagord: visSlagord ? { x: bredde / 2, y: hoyde, grad: slagGrad, anker: 'middle' } : null,
    }
  }

  if (d.oppsett === 'over') {
    const bredde = Math.max(M, navnBredde, slagBredde)
    const navnY = M + rom * 1.1 + kapHoyde
    const hoyde = navnY + (visSlagord ? G * 0.5 + slagGrad * 0.72 : 0)
    return {
      bredde,
      hoyde,
      merke: { x: (bredde - M) / 2, y: 0, storrelse: M },
      navn: { x: bredde / 2, y: navnY, grad: G, anker: 'middle' },
      slagord: visSlagord ? { x: bredde / 2, y: hoyde, grad: slagGrad, anker: 'middle' } : null,
    }
  }

  // Side om side: tekstblokken sentreres optisk mot merket.
  const tekstHoyde = kapHoyde + (visSlagord ? G * 0.42 + slagGrad * 0.72 : 0)
  const hoyde = Math.max(M, tekstHoyde)
  const topp = (hoyde - tekstHoyde) / 2
  const x = M + rom
  return {
    bredde: x + Math.max(navnBredde, slagBredde),
    hoyde,
    merke: { x: 0, y: (hoyde - M) / 2, storrelse: M },
    navn: { x, y: topp + kapHoyde, grad: G, anker: 'start' },
    slagord: visSlagord ? { x, y: topp + tekstHoyde, grad: slagGrad, anker: 'start' } : null,
  }
}

/**
 * Navnet slik det står i logoen.
 *
 * «ola hansen rør» skrevet raskt i et felt er ikke slik bedriften vil se ut,
 * så ord i bare små bokstaver får stor forbokstav. Ord med en stor bokstav
 * et sted («AS», «iTek») lar vi være – der har kunden ment noe. Vil han ha
 * det nøyaktig som skrevet, velger han det i editoren.
 */
/**
 * Slagordet som en del av stilen. Tre behandlinger, fordi det er noe av det
 * første som skiller logoforslag fra hverandre: små sperrede versaler
 * (det klassiske), vanlig tekst (det vennlige), eller i logoens egen skrift.
 */
export function slagordstil(d: Design, slagord: string) {
  const logo = finnSkrift(d.skrift)
  const t = slagord.trim()
  if (d.slagstil === 'vanlig')
    return {
      stil: { id: 'sv', navn: '', font: TEKSTFONT, vekt: 500, sperring: 0, versaler: false } as Skriftstil,
      tekst: t,
      grad: 0.36,
    }
  if (d.slagstil === 'skrift')
    return {
      stil: { ...logo, sperring: logo.versaler ? 0.08 : 0, vekt: Math.min(logo.vekt, 600) } as Skriftstil,
      tekst: logo.versaler ? t.toLocaleUpperCase('nb-NO') : t,
      grad: 0.36,
    }
  return {
    stil: { id: 'sx', navn: '', font: TEKSTFONT, vekt: 500, sperring: 0.14, versaler: true } as Skriftstil,
    tekst: t.toLocaleUpperCase('nb-NO'),
    grad: 0.3,
  }
}

export function visningsnavn(navn: string, stil: Skriftstil, bokstaver: Bokstaver = 'stil') {
  const n = navn.trim().replace(/\s+/g, ' ') || 'Ditt firma'
  if (bokstaver === 'skrevet') return n
  if (bokstaver === 'sma') return n.toLocaleLowerCase('nb-NO')
  if (bokstaver === 'store' || stil.versaler) return n.toLocaleUpperCase('nb-NO')
  return n
    .split(' ')
    .map((o) =>
      o === o.toLocaleLowerCase('nb-NO') && /\p{L}/u.test(o) && !['og', 'i', 'på', '&'].includes(o)
        ? o[0].toLocaleUpperCase('nb-NO') + o.slice(1)
        : o,
    )
    .map((o, i) => (i === 0 ? o[0].toLocaleUpperCase('nb-NO') + o.slice(1) : o))
    .join(' ')
}

/* ---------------------------------------------------------------- generator */

/** En enkel, deterministisk tilfeldighet – samme frø gir samme forslag. */
function rng(frø: number) {
  let s = frø >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 10000) / 10000
  }
}

function stokk<T>(liste: readonly T[], r: () => number): T[] {
  const a = [...liste]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const STANDARD: Design = {
  merke: 'hus',
  beholder: 'ingen',
  oppsett: 'side',
  skrift: 'manrope',
  palett: 'fjord',
  merkefarge: 'primaer',
  avstand: 1,
  merkestorrelse: 1,
  sperring: 0,
  slagord: true,
  bokstaver: 'stil',
  slagstil: 'versal',
}

/**
 * Forslagene.
 *
 * Tolv logoer som er forskjellige nok til at valget betyr noe, men alle
 * innenfor det kunden har sagt han liker. Symbolene som passer bransjen
 * kommer først; monogrammet er alltid med, fordi det er det som oftest
 * blir valgt av bedrifter som heter etter eieren.
 *
 * Variasjonen roteres med ulike steg for hver egenskap, så to naboforslag
 * aldri deler både symbol, skrift og farge.
 */
export function lagForslag(
  {
    bransje,
    stiler,
    familier,
    ikoner = [],
  }: { bransje: string; stiler: readonly string[]; familier: readonly Familie[]; ikoner?: readonly Ikon[] },
  frø: number,
  antall = 12,
): Design[] {
  const r = rng(frø * 7919 + 17)
  const tema = BRANSJETEMA[bransje] ?? 'alle'
  const valgteStiler = STILER.filter((s) => stiler.includes(s.id))
  const aktive = valgteStiler.length ? valgteStiler : [STILER[0], STILER[1]]

  // Merkene i den rekkefølgen de skal brukes: bransjens ikoner først, så
  // monogrammet, så våre egne symboler som passer, så resten.
  type Valg = { merke: MerkeId; ikon?: Ikon }
  const passende = stokk(
    SYMBOLER.filter((s) => s.passer.includes(tema)),
    r,
  ).map((s): Valg => ({ merke: s.id }))
  const merker: Valg[] = [
    ...stokk(ikoner, r).map((ikon): Valg => ({ merke: 'ikon', ikon })),
    { merke: 'monogram' },
    ...passende,
    ...stokk(
      SYMBOLER.filter((s) => !s.passer.includes(tema)),
      r,
    ).map((s): Valg => ({ merke: s.id })),
  ]
  // Med ikoner: to av tre forslag får et bransjeikon, det tredje et
  // monogram eller en av våre former. Uten ikoner: bare våre egne.
  const andre = merker.filter((m) => m.merke !== 'ikon')
  const ikonvalg = merker.filter((m) => m.merke === 'ikon')
  // Blandingen i de tolv: om lag halvparten genererte abstrakte merker, en
  // tredjedel bransjesymboler og resten monogram eller rene ordbilder. Det
  // er de abstrakte som gir førsteinntrykket av at noe er tegnet.
  const abstrakte = abstraktSerie(frø)
  const monster = ['a', 's', 'a', 's', 'a', 'm', 'a', 's', 'a', 's', 'a', 'o'] as const
  const merkeFor = (i: number): Valg & { abstrakt?: Abstrakt } => {
    const t = monster[i % monster.length]
    // Abstrakt nr. n i serien, ikke nr. i: de første seks er seks ulike familier.
    if (t === 'a') return { merke: 'abstrakt', abstrakt: abstrakte[monster.slice(0, i).filter((x) => x === 'a').length] }
    if (t === 's' && ikonvalg.length) return ikonvalg[Math.floor(i / 2) % ikonvalg.length]
    if (t === 's') return andre[Math.floor(i / 2) % Math.min(andre.length, 5)]
    return { merke: 'monogram' }
  }

  const paletter = stokk(
    PALETTER.filter((p) => familier.length === 0 || familier.includes(p.familie)),
    r,
  )
  const palettliste = paletter.length ? paletter : [...PALETTER]

  return Array.from({ length: antall }, (_, i) => {
    const stil = aktive[i % aktive.length]
    const oppsett = stil.oppsett[Math.floor(i / aktive.length) % stil.oppsett.length]
    const valg = merkeFor(i)
    const ordbilde = monster[i % monster.length] === 'o'
    return {
      ...STANDARD,
      merke: valg.merke,
      ikon: valg.ikon,
      abstrakt: valg.abstrakt,
      skrift: stil.skrift[(i * 2 + Math.floor(i / 3)) % stil.skrift.length],
      beholder: stil.beholdere[(i + Math.floor(i / 2)) % stil.beholdere.length],
      oppsett: ordbilde ? 'ordbilde' : oppsett,
      palett: palettliste[(i * 5) % palettliste.length].id,
      merkefarge: i % 5 === 3 ? 'aksent' : 'primaer',
      // Hvert fjerde forslag uten slagord – et rent ordbilde er også et svar.
      slagord: i % 4 !== 3,
      slagstil: (['versal', 'vanlig', 'skrift'] as const)[i % 3],
    }
  })
}

/** Et filnavn uten æøå og mellomrom. */
export function filnavn(navn: string) {
  return (
    navn
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'o')
      .replace(/å/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'logo'
  )
}

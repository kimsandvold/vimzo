/**
 * Byggesteinene i logoverktøyet: symboler, paletter, skriftstiler og stiler.
 *
 * Alt er kuratert, ingenting er fritt. Et verktøy som lar deg velge hvilken
 * som helst farge og hvilken som helst skrift, lager stygge logoer – det er
 * valgene vi har tatt FOR brukeren som gjør resultatet profesjonelt. Han
 * velger mellom ting som allerede fungerer sammen.
 */

/* ----------------------------------------------------------------- symboler */

/**
 * Symbolene. Tegnet i et 48×48-rutenett med fyll, ikke strek: et fylt merke
 * holder seg lesbart ned til favikon-størrelse, og det trykkes rent på bil,
 * skilt og arbeidstøy.
 *
 * `passer` er bransjene merket gir mening for. Det styrer bare hvilke som
 * kommer først i forslagene – alle kan velges til alle.
 */
export interface Symbol {
  id: string
  navn: string
  baner: readonly string[]
  evenodd?: boolean
  passer: readonly Tema[]
}

export type Tema = 'bygg' | 'vann' | 'energi' | 'natur' | 'omsorg' | 'bevegelse' | 'mat' | 'alle'

export const SYMBOLER: readonly Symbol[] = [
  {
    id: 'hus',
    navn: 'Hus',
    passer: ['bygg'],
    baner: ['M24 4 4 20v24h14V32h12v12h14V20z'],
  },
  {
    id: 'bue',
    navn: 'Bue',
    passer: ['bygg', 'alle'],
    baner: ['M4 44V24a20 20 0 0 1 40 0v20H34V24a10 10 0 0 0-20 0v20z'],
  },
  {
    id: 'trinn',
    navn: 'Trinn',
    passer: ['bygg', 'bevegelse', 'alle'],
    baner: ['M4 30h11v14H4z', 'M18.5 18h11v26h-11z', 'M33 4h11v40H33z'],
  },
  {
    id: 'hjorne',
    navn: 'Hjørne',
    passer: ['bygg', 'alle'],
    baner: ['M4 4h40v20A20 20 0 0 0 24 44H4z'],
  },
  {
    id: 'fjell',
    navn: 'Fjell',
    passer: ['bygg', 'natur'],
    baner: ['M2 42 17 14l9.5 17.5L33 21l13 21z'],
  },
  {
    id: 'drape',
    navn: 'Dråpe',
    passer: ['vann', 'omsorg'],
    baner: ['M24 3c9 11 15 19 15 26a15 15 0 0 1-30 0c0-7 6-15 15-26z'],
  },
  {
    id: 'bolge',
    navn: 'Bølge',
    passer: ['vann', 'bevegelse'],
    baner: [
      'M4 16c6-6 14-6 20 0s14 6 20 0v9c-6 6-14 6-20 0s-14-6-20 0z',
      'M4 31c6-6 14-6 20 0s14 6 20 0v9c-6 6-14 6-20 0s-14-6-20 0z',
    ],
  },
  {
    id: 'ring',
    navn: 'Ring',
    passer: ['vann', 'omsorg', 'alle'],
    evenodd: true,
    baner: ['M24 4a20 20 0 1 0 0 40 20 20 0 1 0 0-40zm0 10a10 10 0 1 1 0 20 10 10 0 1 1 0-20z'],
  },
  {
    id: 'lyn',
    navn: 'Lyn',
    passer: ['energi'],
    baner: ['M28 2 8 27h13l-3 19 22-28H27z'],
  },
  {
    id: 'gnist',
    navn: 'Gnist',
    passer: ['energi', 'omsorg', 'alle'],
    baner: ['M24 2c1.8 12 10 20.2 22 22-12 1.8-20.2 10-22 22-1.8-12-10-20.2-22-22 12-1.8 20.2-10 22-22z'],
  },
  {
    id: 'pil',
    navn: 'Pil',
    passer: ['bevegelse', 'energi'],
    baner: ['M3 8h11l16 16-16 16H3l16-16z', 'M18 8h11l16 16-16 16H18l16-16z'],
  },
  {
    id: 'blad',
    navn: 'Blad',
    passer: ['natur', 'omsorg'],
    baner: ['M8 40C8 19 20 8 41 8c0 21-12 32-33 32z'],
  },
  {
    id: 'klover',
    navn: 'Kløver',
    passer: ['natur', 'omsorg', 'alle'],
    baner: [
      'M22 22H3A19 19 0 0 1 22 3z',
      'M26 22V3a19 19 0 0 1 19 19z',
      'M26 26h19a19 19 0 0 1-19 19z',
      'M22 26v19A19 19 0 0 1 3 26z',
    ],
  },
  {
    id: 'sol',
    navn: 'Horisont',
    passer: ['mat', 'natur', 'alle'],
    baner: ['M4 22a20 20 0 0 1 40 0z', 'M4 27h40a20 20 0 0 1-40 0z'],
  },
  {
    id: 'rute',
    navn: 'Rute',
    passer: ['alle'],
    baner: ['M24 2 46 24 24 46 2 24z'],
  },
] as const

/** Bransje-id (fra kalkulatoren) → tema. Ukjente får «alle». */
export const BRANSJETEMA: Record<string, Tema> = {
  rorlegger: 'vann',
  snekker: 'bygg',
  elektriker: 'energi',
  maler: 'bygg',
  murer: 'bygg',
  anlegg: 'natur',
  bilverksted: 'bevegelse',
  renhold: 'vann',
  transport: 'bevegelse',
  frisor: 'omsorg',
  fotpleie: 'omsorg',
  trening: 'energi',
  servering: 'mat',
  annet: 'alle',
}

/* ------------------------------------------------------------------ paletter */

/**
 * En palett er fire farger med hver sin jobb – ikke fire tilfeldige.
 *
 *   primær    merket og knappene. Hvit tekst skal kunne stå på den.
 *   aksent    detaljer: en strek, et ikon, en etikett. Aldri store flater.
 *   mørk      tekst og negativ bakgrunn.
 *   lys       rolige flater: kort, bakgrunner, baksiden av visittkortet.
 */
export interface Palett {
  id: string
  navn: string
  familie: Familie
  primaer: string
  aksent: string
  mork: string
  lys: string
}

export type Familie = 'blaa' | 'gronn' | 'rod' | 'oransje' | 'lilla' | 'noytral'

export const FAMILIER: readonly { id: Familie; navn: string; hex: string }[] = [
  { id: 'blaa', navn: 'Blå', hex: '#1F4E79' },
  { id: 'gronn', navn: 'Grønn', hex: '#1F6A4C' },
  { id: 'rod', navn: 'Rød', hex: '#9B2C3A' },
  { id: 'oransje', navn: 'Oransje', hex: '#B4532A' },
  { id: 'lilla', navn: 'Lilla', hex: '#5B3A7A' },
  { id: 'noytral', navn: 'Nøytral', hex: '#2B2B2E' },
]

export const PALETTER: readonly Palett[] = [
  {
    id: 'fjord',
    navn: 'Fjord',
    familie: 'blaa',
    primaer: '#1F4E79',
    aksent: '#5FA8D3',
    mork: '#0F2233',
    lys: '#EEF4F8',
  },
  {
    id: 'kyst',
    navn: 'Kyst',
    familie: 'blaa',
    primaer: '#0F6E8C',
    aksent: '#F2B134',
    mork: '#0B2A33',
    lys: '#EDF6F8',
  },
  {
    id: 'natt',
    navn: 'Natt',
    familie: 'blaa',
    primaer: '#1E2A4A',
    aksent: '#C9A45C',
    mork: '#111827',
    lys: '#F3F2EE',
  },
  {
    id: 'furu',
    navn: 'Furu',
    familie: 'gronn',
    primaer: '#1F6A4C',
    aksent: '#A8C686',
    mork: '#0F2A1F',
    lys: '#EFF5EF',
  },
  {
    id: 'mose',
    navn: 'Mose',
    familie: 'gronn',
    primaer: '#4B5D2A',
    aksent: '#D9A441',
    mork: '#22281A',
    lys: '#F4F3EA',
  },
  {
    id: 'salvie',
    navn: 'Salvie',
    familie: 'gronn',
    primaer: '#3E6B5E',
    aksent: '#E8B4A0',
    mork: '#1C2E29',
    lys: '#F2F6F3',
  },
  {
    id: 'vin',
    navn: 'Vin',
    familie: 'rod',
    primaer: '#7A2335',
    aksent: '#E3B7A0',
    mork: '#2A0F15',
    lys: '#F8F1EF',
  },
  {
    id: 'signal',
    navn: 'Signal',
    familie: 'rod',
    primaer: '#B3261E',
    aksent: '#1F1F1F',
    mork: '#1F1F1F',
    lys: '#F7F4F2',
  },
  {
    id: 'terrakotta',
    navn: 'Terrakotta',
    familie: 'oransje',
    primaer: '#A8452B',
    aksent: '#E9C46A',
    mork: '#2E1A12',
    lys: '#F8F2EC',
  },
  {
    id: 'rav',
    navn: 'Rav',
    familie: 'oransje',
    primaer: '#9A5B18',
    aksent: '#2F4858',
    mork: '#2A1C0C',
    lys: '#F8F3EA',
  },
  {
    id: 'plomme',
    navn: 'Plomme',
    familie: 'lilla',
    primaer: '#5B3A7A',
    aksent: '#E7A977',
    mork: '#22152F',
    lys: '#F5F1F8',
  },
  {
    id: 'lyng',
    navn: 'Lyng',
    familie: 'lilla',
    primaer: '#7A3E65',
    aksent: '#9CC5A1',
    mork: '#2B1624',
    lys: '#F8F0F4',
  },
  {
    id: 'grafitt',
    navn: 'Grafitt',
    familie: 'noytral',
    primaer: '#2B2B2E',
    aksent: '#D97A3A',
    mork: '#161618',
    lys: '#F4F4F2',
  },
  {
    id: 'messing',
    navn: 'Kull og messing',
    familie: 'noytral',
    primaer: '#1C1C1C',
    aksent: '#B08D57',
    mork: '#111111',
    lys: '#F5F2EC',
  },
] as const

/* -------------------------------------------------------------- skriftstiler */

/**
 * Skriftene. Tolv åpne (OFL) skrifter, selvhostet i public/fonts/logo/ og
 * lastet bare på logosidene – resten av nettstedet merker ingenting.
 *
 * Utvalget er gjort for logoer, ikke for brødtekst: hver skrift har en
 * tydelig personlighet og holder seg i stor grad. `kap` er versalhøyden som
 * andel av grad, så merket kan sentreres optisk mot akkurat denne skriften.
 */
export interface Font {
  familie: string
  filer: Record<number, string>
  kap: number
  reserve: string
}

export const FONTER = {
  manrope: {
    familie: 'Logo Manrope',
    filer: { 500: 'manrope-500', 700: 'manrope-700' },
    kap: 0.72,
    reserve: 'Helvetica, Arial, sans-serif',
  },
  sora: {
    familie: 'Logo Sora',
    filer: { 600: 'sora-600' },
    kap: 0.7,
    reserve: 'Helvetica, Arial, sans-serif',
  },
  outfit: {
    familie: 'Logo Outfit',
    filer: { 500: 'outfit-500', 700: 'outfit-700' },
    kap: 0.7,
    reserve: 'Helvetica, Arial, sans-serif',
  },
  archivo: {
    familie: 'Logo Archivo',
    filer: { 900: 'archivo-900' },
    kap: 0.72,
    reserve: 'Impact, Arial Black, sans-serif',
  },
  bebas: {
    familie: 'Logo Bebas Neue',
    filer: { 400: 'bebas-neue-400' },
    kap: 0.7,
    reserve: 'Impact, sans-serif',
  },
  fraunces: {
    familie: 'Logo Fraunces',
    filer: { 600: 'fraunces-600' },
    kap: 0.7,
    reserve: 'Georgia, serif',
  },
  playfair: {
    familie: 'Logo Playfair',
    filer: { 700: 'playfair-display-700' },
    kap: 0.71,
    reserve: 'Georgia, serif',
  },
  dmserif: {
    familie: 'Logo DM Serif',
    filer: { 400: 'dm-serif-display-400' },
    kap: 0.7,
    reserve: 'Georgia, serif',
  },
  cormorant: {
    familie: 'Logo Cormorant',
    filer: { 500: 'cormorant-garamond-500', 600: 'cormorant-garamond-600' },
    kap: 0.63,
    reserve: 'Garamond, Georgia, serif',
  },
  nunito: {
    familie: 'Logo Nunito',
    filer: { 800: 'nunito-800' },
    kap: 0.71,
    reserve: 'Arial Rounded MT Bold, Arial, sans-serif',
  },
  space: {
    familie: 'Logo Space Grotesk',
    filer: { 600: 'space-grotesk-600' },
    kap: 0.7,
    reserve: 'Helvetica, Arial, sans-serif',
  },
  jetbrains: {
    familie: 'Logo JetBrains Mono',
    filer: { 600: 'jetbrains-mono-600' },
    kap: 0.73,
    reserve: 'Menlo, monospace',
  },
} as const satisfies Record<string, Font>

export type FontId = keyof typeof FONTER

export const fontstabel = (id: FontId) => `'${FONTER[id].familie}', ${FONTER[id].reserve}`

/**
 * En skriftstil er en skrift med vekt, sperring og bokstavform – satt
 * sammen for øyet, ikke regnet ut. Det er de små forskjellene her som
 * skiller en tegnet logo fra et navn skrevet i en skrift.
 *
 * `sperring` er i em. Stor på versaler, stram på gemener.
 */
export interface Skriftstil {
  id: string
  navn: string
  font: FontId
  vekt: number
  sperring: number
  versaler: boolean
}

export const SKRIFTSTILER: readonly Skriftstil[] = [
  {
    id: 'manrope',
    navn: 'Manrope',
    font: 'manrope',
    vekt: 700,
    sperring: -0.03,
    versaler: false,
  },
  {
    id: 'sora',
    navn: 'Sora',
    font: 'sora',
    vekt: 600,
    sperring: -0.035,
    versaler: false,
  },
  {
    id: 'outfit',
    navn: 'Outfit',
    font: 'outfit',
    vekt: 500,
    sperring: -0.015,
    versaler: false,
  },
  {
    id: 'archivo',
    navn: 'Archivo Black',
    font: 'archivo',
    vekt: 900,
    sperring: 0.01,
    versaler: true,
  },
  {
    id: 'bebas',
    navn: 'Bebas Neue',
    font: 'bebas',
    vekt: 400,
    sperring: 0.05,
    versaler: true,
  },
  {
    id: 'outfit-fet',
    navn: 'Outfit fet',
    font: 'outfit',
    vekt: 700,
    sperring: -0.025,
    versaler: false,
  },
  {
    id: 'fraunces',
    navn: 'Fraunces',
    font: 'fraunces',
    vekt: 600,
    sperring: -0.02,
    versaler: false,
  },
  {
    id: 'playfair',
    navn: 'Playfair',
    font: 'playfair',
    vekt: 700,
    sperring: -0.01,
    versaler: false,
  },
  {
    id: 'manrope-versal',
    navn: 'Manrope versaler',
    font: 'manrope',
    vekt: 700,
    sperring: 0.18,
    versaler: true,
  },
  {
    id: 'cormorant-versal',
    navn: 'Cormorant versaler',
    font: 'cormorant',
    vekt: 500,
    sperring: 0.24,
    versaler: true,
  },
  {
    id: 'dmserif',
    navn: 'DM Serif',
    font: 'dmserif',
    vekt: 400,
    sperring: -0.01,
    versaler: false,
  },
  {
    id: 'cormorant',
    navn: 'Cormorant',
    font: 'cormorant',
    vekt: 600,
    sperring: 0,
    versaler: false,
  },
  {
    id: 'nunito',
    navn: 'Nunito',
    font: 'nunito',
    vekt: 800,
    sperring: -0.015,
    versaler: false,
  },
  {
    id: 'space',
    navn: 'Space Grotesk',
    font: 'space',
    vekt: 600,
    sperring: -0.025,
    versaler: false,
  },
  {
    id: 'jetbrains',
    navn: 'JetBrains Mono',
    font: 'jetbrains',
    vekt: 600,
    sperring: -0.03,
    versaler: false,
  },
] as const

/** Slagord og løpende tekst i profilen: én nøytral grotesk ved siden av alt. */
export const TEKSTFONT: FontId = 'manrope'

/* ------------------------------------------------------------------- stiler */

/**
 * Stilene kunden velger mellom i steg to. Hver peker på skriftstilene,
 * merkeformene og oppsettene som hører hjemme i den – så «Elegant» aldri
 * foreslår tunge versaler i en sirkel.
 */
export interface Stil {
  id: string
  navn: string
  beskrivelse: string
  skrift: readonly string[]
  beholdere: readonly Beholder[]
  oppsett: readonly Oppsett[]
  /** Paletten stilkortet vises i – så kortene ikke er seks grå bokser. */
  palett: string
}

export type Beholder = 'ingen' | 'flis' | 'sirkel'
export type Oppsett = 'side' | 'over' | 'kun-merke' | 'ordbilde'

export const STILER: readonly Stil[] = [
  {
    id: 'moderne',
    navn: 'Moderne',
    beskrivelse: 'Rent og presist',
    skrift: ['manrope', 'sora', 'outfit'],
    beholdere: ['ingen', 'flis'],
    oppsett: ['side', 'side', 'over'],
    palett: 'fjord',
  },
  {
    id: 'kraftig',
    navn: 'Kraftig',
    beskrivelse: 'Synlig på lang avstand',
    skrift: ['archivo', 'bebas', 'outfit-fet'],
    beholdere: ['flis', 'ingen'],
    oppsett: ['side', 'over', 'ordbilde'],
    palett: 'signal',
  },
  {
    id: 'klassisk',
    navn: 'Klassisk',
    beskrivelse: 'Solid og tidløs',
    skrift: ['playfair', 'manrope-versal', 'fraunces'],
    beholdere: ['sirkel', 'ingen'],
    oppsett: ['over', 'side'],
    palett: 'natt',
  },
  {
    id: 'elegant',
    navn: 'Elegant',
    beskrivelse: 'Lett og luftig',
    skrift: ['cormorant-versal', 'dmserif', 'cormorant'],
    beholdere: ['ingen'],
    oppsett: ['over', 'ordbilde', 'side'],
    palett: 'salvie',
  },
  {
    id: 'vennlig',
    navn: 'Vennlig',
    beskrivelse: 'Varm og imøtekommende',
    skrift: ['nunito', 'fraunces', 'outfit'],
    beholdere: ['sirkel', 'flis'],
    oppsett: ['side', 'over'],
    palett: 'terrakotta',
  },
  {
    id: 'teknisk',
    navn: 'Teknisk',
    beskrivelse: 'Nøyaktig og saklig',
    skrift: ['space', 'jetbrains', 'sora'],
    beholdere: ['flis', 'ingen'],
    oppsett: ['side', 'ordbilde'],
    palett: 'grafitt',
  },
] as const

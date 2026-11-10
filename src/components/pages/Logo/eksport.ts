import { createElement } from 'react'
import type { Font as OtFont, Glyph as OtGlyph, PathCommand as OtPathCommand } from 'opentype.js'
import LogoSvg, { type Variant } from './LogoSvg'
import { FOTOMALER } from './fotomaler'
import { FONTER, TEKSTFONT, type FontId } from './merker'
import {
  filnavn,
  finnPalett,
  finnSkrift,
  kontrast,
  slagordstil,
  visningsnavn,
  type Design,
  type Innhold,
} from './motor'
import { vimzoSvg } from './vimzomerke'
import type { ProduktId } from './kjop'
import { NETTSIDE } from './lagring'
import { rensForTrykk, somSvg, tall, type Fargekart, type Rensevalg, type Rentresultat } from './rentsvg'
import { lagIco, lerretTilBlob, pngMedMetadata, woffTilSfnt } from './binaer'
import { lagAse } from './ase'
import { beskjaer, mockupDesign, mockupJpg, mockupVariant, tegnMockup } from './mockupbilder'

/**
 * Filene kunden får når bestillingen er lagt inn – eller når logoen er
 * frigitt med en nettside: én ZIP, laget i nettleseren av den samme
 * logobeskrivelsen som verktøyet viser, og uten vannmerke.
 *
 * Pakken (LES-MEG.txt i ZIP-en forklarer den for kunden):
 *
 *   1-hvit-bakgrunn/            full farge på hvitt
 *   2-mork-bakgrunn-to-farger/  to farger på mørk flate
 *   3-fullfarge-transparent/    full farge uten bakgrunn
 *   logo/<oppsett>/             liggende, stående, kun symbol, kun navn ×
 *                               fullfarge, svart, hvit, to farger på mørk –
 *                               SVG og PDF (trykk), PNG (transparent), JPG
 *   gravering/                  én farge, én sammensatt bane
 *   farger/  skrift/  web/      koder, skriftfiler, favikon og delingsbilde
 *   digitalt/  visuell-profil/  bare med profil
 *
 * Alle vektorfiler går gjennom rentsvg.ts: tekst som baner, ingen overlapp,
 * ingen strek eller gjennomsiktighet. Biblioteker (jszip, jspdf, svg2pdf,
 * opentype, paper) lastes først her, så ingen andre sider betaler for dem.
 */

/* ------------------------------------------------------------------ fonter */

const fontminne = new Map<string, Promise<OtFont>>()

function fontFor(familie: string, vekt: number): { id: FontId; fil: string; vekt: number } | null {
  const id = (Object.keys(FONTER) as FontId[]).find((f) => familie.includes(FONTER[f].familie))
  if (!id) return null
  const filer = FONTER[id].filer as Record<number, string>
  const vekter = Object.keys(filer).map(Number)
  const naermest = vekter.reduce((a, b) => (Math.abs(b - vekt) < Math.abs(a - vekt) ? b : a), vekter[0])
  return { id, fil: filer[naermest], vekt: naermest }
}

async function lastFont(fil: string): Promise<OtFont> {
  if (!fontminne.has(fil)) {
    fontminne.set(
      fil,
      (async () => {
        const [{ parse }, svar] = await Promise.all([import('opentype.js'), fetch(`/fonts/logo/${fil}.woff`)])
        return parse(await svar.arrayBuffer())
      })(),
    )
  }
  return fontminne.get(fil)!
}

/**
 * Tekst som baner, plassert slik nettleseren plasserte den på skjermen.
 *
 * Glyfene (formene) kommer fra fontfila via opentype.js, men plasseringen
 * måles med canvas i den samme nettleseren som tegnet logoen: for hver
 * glyf måles bredden av teksten fram til og med den, og glyfen settes der
 * den slutter minus sin egen bredde. Da følger kjerning og ligaturer
 * nøyaktig det kunden så – opentype.js sin egen GPOS-kjerning bommer på
 * enkelte par (DM Serif, Sora), og forming kaster på noen GSUB-oppslag
 * (Archivo, Nunito, Outfit). Er skriften ikke lastet i dokumentet, brukes
 * opentype.js sin kjerning som reserve.
 *
 * Med sperring slår nettleseren av ligaturer, så da gjør vi det også.
 */
async function tekstbane(
  tekst: string,
  familie: string,
  vekt: number,
  grad: number,
  x: number,
  y: number,
  sperring: number,
  anker: string,
): Promise<string | null> {
  const f = fontFor(familie, vekt)
  if (!f || !tekst) return null
  const font = await lastFont(f.fil)
  const tegn = [...tekst]
  // Glyfene, med hvor mange tegn hver dekker (en ligatur som «ffi» dekker tre).
  // Ligaturene settes inn her, ikke med `stringToGlyphs`: den kjører alltid
  // «ccmp», og der kaster opentype.js på oppslag den ikke støtter.
  const indekser = tegn.map((t) => font.charToGlyphIndex(t))
  const glyfer: { glyf: OtGlyph; antall: number }[] = []
  const ligaturer = sperring ? [] : ligaturerFor(font)
  for (let i = 0; i < indekser.length; ) {
    const treff = ligaturer
      .filter((l) => l.sub.length > 1 && l.sub.every((g, k) => indekser[i + k] === g))
      .sort((a, b) => b.sub.length - a.sub.length)[0]
    glyfer.push({ glyf: font.glyphs.get(treff ? treff.by : indekser[i]), antall: treff ? treff.sub.length : 1 })
    i += treff ? treff.sub.length : 1
  }

  const skala = grad / font.unitsPerEm
  const fontstreng = `${f.vekt} ${grad}px '${FONTER[f.id].familie}'`
  const maler = typeof document !== 'undefined' && document.fonts?.check(fontstreng) ? lerret() : null
  if (maler) maler.font = fontstreng
  const mal = (n: number) => maler!.measureText(tegn.slice(0, n).join('')).width

  const plass: number[] = []
  let brukt = 0
  let bredde = 0
  glyfer.forEach(({ glyf, antall }, i) => {
    const egen = (glyf.advanceWidth ?? 0) * skala
    if (maler) {
      brukt += antall
      plass.push(mal(brukt) - egen + sperring * (brukt - antall))
      bredde = mal(brukt) + sperring * (brukt - 1)
    } else {
      plass.push(bredde)
      bredde += egen
      if (i < glyfer.length - 1) {
        let kjerning = 0
        try {
          kjerning = font.getKerningValue(glyf, glyfer[i + 1].glyf)
        } catch {
          // Ingen kjerning for paret.
        }
        bredde += (Number.isFinite(kjerning) ? kjerning : 0) * skala + sperring * antall
      }
    }
  })
  // Som nettleseren: ved midtstilling regnes sperringen etter siste tegn med
  // i bredden. (LogoSvg dytter teksten tilbake med `dx` for å veie opp.)
  const start = anker === 'middle' ? x - (bredde + sperring) / 2 : x
  const d = glyfer.map(({ glyf }, i) => banedata(glyf.getPath(start + plass[i], y, grad).commands)).join('')
  return d && !/NaN|Infinity/.test(d) ? d : null
}

/** Standardligaturene (liga) i fonten, som par av glyfindekser. */
const ligaturminne = new WeakMap<OtFont, { sub: number[]; by: number }[]>()
function ligaturerFor(font: OtFont) {
  if (!ligaturminne.has(font)) {
    let liste: { sub: number[]; by: number }[] = []
    for (const skript of ['latn', 'DFLT']) {
      try {
        // getLigatures finnes i opentype.js, men mangler i typene.
        const sub = font.substitution as unknown as { getLigatures(f: string, s: string, l: string): typeof liste }
        liste = sub.getLigatures('liga', skript, 'dflt') ?? []
      } catch {
        liste = []
      }
      if (liste.length) break
    }
    ligaturminne.set(font, liste.filter((l) => Array.isArray(l.sub) && typeof l.by === 'number'))
  }
  return ligaturminne.get(font)!
}

let malelerret: CanvasRenderingContext2D | null = null
const lerret = () => (malelerret ??= document.createElement('canvas').getContext('2d'))!

/** Banedata fra opentype-kommandoer, to desimaler. */
function banedata(kommandoer: OtPathCommand[]): string {
  const n = (v: number) => tall(v)
  return kommandoer
    .map((k) =>
      k.type === 'M' || k.type === 'L'
        ? `${k.type}${n(k.x)} ${n(k.y)}`
        : k.type === 'Q'
          ? `Q${n(k.x1)} ${n(k.y1)} ${n(k.x)} ${n(k.y)}`
          : k.type === 'C'
            ? `C${n(k.x1)} ${n(k.y1)} ${n(k.x2)} ${n(k.y2)} ${n(k.x)} ${n(k.y)}`
            : 'Z',
    )
    .join('')
}

/* ---------------------------------------------------------------- metadata */

/**
 * Hvem filene er for, og hvor de kommer fra. Vimzo står som laget av,
 * kunden som rettighetshaver – vilkårene gir kunden bruksretten – og
 * bestillingsnummeret gjør at enhver fil kan spores tilbake til ordren.
 * En logo som er frigitt med en nettside, har ingen egen ordre; der står
 * det at den inngår i nettsideprosjektet.
 */
export interface Metadata {
  ordreId: string
  bedrift: string
  dato: string
}

/** «Bestilling abc123», eller nettsideprosjektet når logoen fulgte med en nettside. */
const referanse = (m: Metadata) =>
  m.ordreId === NETTSIDE ? 'Inngår i nettsideprosjekt hos Vimzo' : `Bestilling ${m.ordreId}`

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const VILKAR_URL = 'vimzo.no/vilkar/logo'
const SKAPER = 'Vimzo (vimzo.no)'
const PROGRAM = 'Vimzo logoverktøy'

function medSvgMetadata(svg: string, m: Metadata, variant: string): string {
  const tittel = `${m.bedrift} – logo (${variant})`
  const meta =
    `<title>${esc(tittel)}</title>` +
    `<desc>${esc(`Logo for ${m.bedrift}. ${referanse(m)}. Laget med ${PROGRAM} – vimzo.no.`)}</desc>` +
    '<metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
    '<rdf:Description rdf:about="">' +
    `<dc:title>${esc(tittel)}</dc:title>` +
    `<dc:creator>${SKAPER}</dc:creator>` +
    `<dc:rights>${esc(`Bruksrett: ${m.bedrift}. Se ${VILKAR_URL}`)}</dc:rights>` +
    `<dc:date>${m.dato}</dc:date>` +
    `<dc:identifier>${esc(m.ordreId)}</dc:identifier>` +
    '<dc:source>https://vimzo.no/logo</dc:source>' +
    '<dc:format>image/svg+xml</dc:format>' +
    '</rdf:Description></rdf:RDF></metadata>'
  const kommentar = `<!-- ${esc(`Laget med ${PROGRAM} – vimzo.no · ${referanse(m)} · ${m.dato.slice(0, 10)}`)} -->\n`
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + kommentar + svg.replace(/(<svg[^>]*>)/, `$1${meta}`)
}

async function medPngMetadata(png: Blob, m: Metadata, variant: string): Promise<Blob> {
  return pngMedMetadata(png, [
    ['Title', `${m.bedrift} – logo (${variant})`],
    ['Author', SKAPER],
    ['Software', PROGRAM],
    ['Copyright', `Bruksrett: ${m.bedrift}. Se ${VILKAR_URL}`],
    ['Description', `Logo for ${m.bedrift}. ${referanse(m)}.`],
    ['Source', 'https://vimzo.no/logo'],
    ['Creation Time', m.dato],
  ])
}

/* --------------------------------------------------------------------- svg */

/**
 * Logoen som SVG, med teksten gjort om til baner og rollene merket
 * (`data-rolle`: merke, navn, slagord). Med `streng` kastes det hvis en
 * skrift ikke kan lastes – en trykkfil uten navnet er verre enn ingen fil.
 */
async function tegnKilde(
  design: Design,
  innhold: Innhold,
  variant: Variant,
  kunMerke: boolean,
  streng: boolean,
): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const markup = renderToStaticMarkup(createElement(LogoSvg, { design, innhold, variant, kunMerke }))
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const svg = doc.documentElement
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.removeAttribute('style')
  svg.removeAttribute('role')
  svg.removeAttribute('aria-label')
  const [, , b, h] = (svg.getAttribute('viewBox') ?? '0 0 100 100').split(' ').map(Number)
  svg.setAttribute('width', String(b))
  svg.setAttribute('height', String(h))

  // Rollene: merket er gruppen øverst, tekstene på toppnivå er navn og slagord.
  for (const g of [...svg.children].filter((e) => e.tagName === 'g')) g.setAttribute('data-rolle', 'merke')
  ;[...svg.children]
    .filter((e) => e.tagName === 'text')
    .forEach((t, i) => t.setAttribute('data-rolle', i === 0 ? 'navn' : 'slagord'))

  for (const t of [...svg.querySelectorAll('text')]) {
    const tall_ = (a: string) => Number(t.getAttribute(a) ?? 0)
    const d = await tekstbane(
      t.textContent ?? '',
      t.getAttribute('font-family') ?? '',
      tall_('font-weight') || 400,
      tall_('font-size'),
      tall_('x') + tall_('dx'),
      tall_('y'),
      tall_('letter-spacing'),
      t.getAttribute('text-anchor') ?? 'start',
    )
    if (!d) {
      if (streng) throw new Error(`Skriften til «${t.textContent}» kunne ikke lastes`)
      continue
    }
    const bane = doc.createElementNS('http://www.w3.org/2000/svg', 'path')
    bane.setAttribute('d', d)
    bane.setAttribute('fill', t.getAttribute('fill') ?? '#000')
    const rolle = t.getAttribute('data-rolle')
    if (rolle) bane.setAttribute('data-rolle', rolle)
    t.replaceWith(bane)
  }
  return new XMLSerializer().serializeToString(svg)
}

/** Logoen som frittstående SVG, med all tekst gjort om til baner. */
export async function logoSvg(
  design: Design,
  innhold: Innhold,
  variant: Variant = 'positiv',
  kunMerke = false,
): Promise<string> {
  return (await tegnKilde(design, innhold, variant, kunMerke, false)).replace(/\sdata-rolle="[^"]*"/g, '')
}

function maal(svg: string) {
  const m = svg.match(/viewBox="([^"]+)"/)
  const [, , b, h] = (m?.[1] ?? '0 0 100 100').split(/[\s,]+/).map(Number)
  return { b, h }
}

/** Det som står inni en SVG, og viewBox-en, til å legge den inn i en annen. */
function innmat(svg: string) {
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100').split(/[\s,]+/).map(Number)
  const indre = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return { vb, indre }
}

/** Logoen sentrert på en flate `b` × `h`, med lengste side `andel` av flaten. */
function paFlate(svg: string, b: number, h: number, bak: string | null, andel: number, rund = false) {
  const { vb, indre } = innmat(svg)
  const s = Math.min((b * andel) / vb[2], (h * andel) / vb[3])
  const bg = bak
    ? rund
      ? `<circle cx="${b / 2}" cy="${h / 2}" r="${Math.min(b, h) / 2}" fill="${bak}"/>`
      : `<rect width="${b}" height="${h}" fill="${bak}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${b}" height="${h}" viewBox="0 0 ${b} ${h}">${bg}<g transform="translate(${tall((b - vb[2] * s) / 2)} ${tall((h - vb[3] * s) / 2)}) scale(${s}) translate(${-vb[0]} ${-vb[1]})">${indre}</g></svg>`
}

/* ------------------------------------------------------------ bilder (png) */

async function tilBilde(svg: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  return img
}

/**
 * Et bilde tegnet fra vektoren i målstørrelsen – aldri skalert opp fra et
 * mindre bilde. Lengste side blir nøyaktig `side`. `luft` er luften rundt
 * logoen som andel av lengste side, lik i alle størrelser; flater med egen
 * bakgrunn sendes med `luft` 0. Med `bak` fylles flaten først (JPG).
 */
async function raster(
  svg: string,
  side: number,
  { luft = 0, bak, type = 'image/png', kvalitet }: { luft?: number; bak?: string; type?: string; kvalitet?: number } = {},
): Promise<Blob> {
  const { b, h } = maal(svg)
  const pad = Math.round(side * luft)
  const skala = (side - pad * 2) / Math.max(b, h)
  const w = b >= h ? side - pad * 2 : Math.round(b * skala)
  const hh = b >= h ? Math.round(h * skala) : side - pad * 2
  // Gi SVG-en målstørrelsen, så nettleseren rasteriserer vektoren direkte i den.
  const storrelse = svg
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, '$1')
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, '$1')
    .replace('<svg', `<svg width="${w}" height="${hh}" preserveAspectRatio="none"`)
  const img = await tilBilde(storrelse)
  const c = document.createElement('canvas')
  c.width = w + pad * 2
  c.height = hh + pad * 2
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (bak) {
    ctx.fillStyle = bak
    ctx.fillRect(0, 0, c.width, c.height)
  }
  ctx.drawImage(img, pad, pad, w, hh)
  return lerretTilBlob(c, type, kvalitet)
}

/** Luften rundt logoen i transparente PNG-er: 6 % av lengste side. */
const LUFT = 0.06

/* ------------------------------------------------------------------- farger */

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
function cmyk(h: string) {
  const [r, g, b] = rgb(h).map((v) => v / 255)
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return [0, 0, 0, 100]
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100))
}
const luminans = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => v / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function bland(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Fargene med roller, i den rekkefølgen de presenteres overalt. */
function fargeliste(design: Design) {
  const p = finnPalett(design.palett)
  return [
    { navn: 'Primær', id: 'primaer', rolle: 'Hovedfargen – logoen, flater og overskrifter', hex: p.primaer },
    { navn: 'Aksent', id: 'aksent', rolle: 'Detaljer, knapper og markeringer – brukes sparsomt', hex: p.aksent },
    { navn: 'Mørk', id: 'mork', rolle: 'Tekst og mørke flater', hex: p.mork },
    { navn: 'Lys', id: 'lys', rolle: 'Bakgrunner og rolige flater', hex: p.lys },
  ].map((f) => ({ ...f, hex: f.hex.toUpperCase(), rgb: rgb(f.hex), cmyk: cmyk(f.hex) }))
}

const CMYK_MERKNAD =
  'CMYK er en omtrentlig omregning fra RGB, uten fargeprofil. Be trykkeriet om prøvetrykk før store opplag. ' +
  'Pantone er ikke angitt – trykkeriet kan finne nærmeste Pantone fra HEX-koden.'

/** Den mørke flaten to-fargeversjonen står på: primærfargen, eller den mørke om primæren er for lys for hvitt. */
const morkFlate = (design: Design) => {
  const p = finnPalett(design.palett)
  return kontrast('#FFFFFF', p.primaer) >= 3 ? p.primaer.toUpperCase() : p.mork.toUpperCase()
}

/**
 * To farger på mørk flate: hvitt og én aksent.
 *
 * Fargene i den negative logoen sorteres etter lyshet. Det som ligger nær
 * flaten, blir flaten (et utsparet hull). Den lyseste av resten blir hvit,
 * alle andre slås sammen til aksenten. Blir det bare én farge igjen (en
 * helt hvit logo), får merket aksenten – eller slagordet, når det ikke er
 * noe merke. Deterministisk: samme logo gir alltid samme fil.
 */
function toFargerKart(design: Design): Fargekart {
  const p = finnPalett(design.palett)
  const bak = morkFlate(design)
  const aksent = (
    [p.aksent, p.primaer, p.lys, p.mork].find((k) => kontrast(k, bak) >= 1.6 && kontrast(k, '#FFFFFF') >= 1.25) ??
    bland(bak, '#FFFFFF', 0.5)
  ).toUpperCase()
  return (former) => {
    const nærFlaten = (f: string) => Math.abs(luminans(f) - luminans(bak)) < 0.08
    const lyseste = former
      .map((f) => f.fill)
      .filter((f) => !nærFlaten(f))
      .sort((a, b) => luminans(b) - luminans(a) || a.localeCompare(b))[0]
    let ut = former.map((f) => (nærFlaten(f.fill) ? bak : f.fill === lyseste ? '#FFFFFF' : aksent))
    if (new Set(ut.filter((c) => c !== bak)).size === 1) {
      const harMerke = former.some((f) => f.rolle === 'merke')
      const harTekst = former.some((f) => f.rolle !== 'merke')
      const fremhev = harMerke && harTekst ? 'merke' : !harMerke && former.some((f) => f.rolle === 'slagord') ? 'slagord' : null
      if (fremhev) ut = ut.map((c, i) => (c === bak ? c : former[i].rolle === fremhev ? aksent : '#FFFFFF'))
    }
    return ut
  }
}

/* ------------------------------------------------------------ versjonene */

export type Utforming = 'liggende' | 'staende' | 'kun-symbol' | 'kun-navn'
export type Fargevei = 'fullfarge' | 'svart' | 'hvit' | 'to-farger-pa-mork' | 'hvit-bakgrunn'

const UTFORMINGER: { id: Utforming; navn: string; mm: number }[] = [
  { id: 'liggende', navn: 'liggende', mm: 100 },
  { id: 'staende', navn: 'stående', mm: 60 },
  { id: 'kun-symbol', navn: 'kun symbol', mm: 30 },
  { id: 'kun-navn', navn: 'kun navn', mm: 100 },
]
const FARGEVEIER: { id: Exclude<Fargevei, 'hvit-bakgrunn'>; navn: string }[] = [
  { id: 'fullfarge', navn: 'fullfarge' },
  { id: 'svart', navn: 'svart' },
  { id: 'hvit', navn: 'hvit' },
  { id: 'to-farger-pa-mork', navn: 'to farger på mørk' },
]

function utformet(design: Design, u: Utforming | 'valgt'): { design: Design; kunMerke: boolean } {
  if (u === 'kun-symbol') return { design, kunMerke: true }
  if (u === 'valgt') return { design, kunMerke: design.oppsett === 'kun-merke' }
  const oppsett = u === 'liggende' ? 'side' : u === 'staende' ? 'over' : 'ordbilde'
  return { design: { ...design, oppsett }, kunMerke: false }
}

/** Hvilken LogoSvg-variant og hvilke regler hver fargevei bygger på. */
function oppskrift(design: Design, f: Fargevei): { variant: Variant; valg: Rensevalg; jpgBak: string } {
  const mork = morkFlate(design)
  const bakgrunn = (farge: string) => ({ farge, luft: 0.12 })
  switch (f) {
    case 'fullfarge':
      return { variant: 'positiv', valg: {}, jpgBak: '#FFFFFF' }
    case 'hvit-bakgrunn':
      return { variant: 'positiv', valg: { bakgrunn: bakgrunn('#FFFFFF') }, jpgBak: '#FFFFFF' }
    case 'svart':
      // Ekte ensfarget: alt som ikke er svart (hvitt symbol i svart flis) blir hull.
      return {
        variant: 'svart',
        valg: { fargekart: (fs) => fs.map((x) => (luminans(x.fill) < 0.5 ? '#000000' : null)) },
        jpgBak: '#FFFFFF',
      }
    case 'hvit':
      return {
        variant: 'hvit',
        valg: { fargekart: (fs) => fs.map((x) => (luminans(x.fill) >= 0.5 ? '#FFFFFF' : null)) },
        jpgBak: mork,
      }
    case 'to-farger-pa-mork':
      return { variant: 'negativ', valg: { bakgrunn: bakgrunn(mork), fargekart: toFargerKart(design) }, jpgBak: mork }
  }
}

interface Versjon {
  rent: Rentresultat
  /** Trykkfilen: rene flater, mål i mm. Uten metadata. */
  trykk: string
  /** Det PNG og JPG tegnes fra: lagvis der det går, så kantene ikke får skjøter. */
  bilde: string
  mm: number
  /** Har egen bakgrunnsflate – da får bildene ingen ekstra luft rundt. */
  bak: boolean
}

async function lagVersjon(design: Design, innhold: Innhold, u: Utforming | 'valgt', f: Fargevei, mm: number): Promise<Versjon> {
  const { design: d, kunMerke } = utformet(design, u)
  const o = oppskrift(design, f)
  const kilde = await tegnKilde(d, innhold, o.variant, kunMerke, true)
  const rent = await rensForTrykk(kilde, o.valg)
  return { rent, trykk: somSvg(rent, rent.deler, mm), bilde: somSvg(rent, rent.lag ?? rent.deler), mm, bak: Boolean(o.valg.bakgrunn) }
}

/* --------------------------------------------------------------------- pdf */

let pdfLast: Promise<typeof import('jspdf')> | null = null
const lastPdf = () => (pdfLast ??= Promise.all([import('jspdf'), import('svg2pdf.js')]).then(([j]) => j))

/**
 * En vektor-PDF med én logo, siden skåret tett rundt motivet. svg2pdf
 * tegner banene som PDF-baner – ingen bilder, ingen skrift.
 */
async function vektorPdf(v: Versjon, m: Metadata, variant: string, holder: HTMLElement): Promise<Blob> {
  const { jsPDF } = await lastPdf()
  const b = v.mm
  const h = Number(tall((v.mm * v.rent.h) / v.rent.b))
  const doc = new jsPDF({ orientation: b >= h ? 'landscape' : 'portrait', unit: 'mm', format: [b, h] })
  pdfEgenskaper(doc, m, `${m.bedrift} – logo (${variant})`, `Logo for ${m.bedrift}, ${variant}. ${referanse(m)}.`)
  const el = new DOMParser().parseFromString(v.trykk, 'image/svg+xml').documentElement as unknown as SVGElement
  holder.appendChild(el)
  try {
    await doc.svg(el, { x: 0, y: 0, width: b, height: h })
  } finally {
    el.remove()
  }
  return doc.output('blob')
}

function pdfEgenskaper(doc: import('jspdf').jsPDF, m: Metadata, tittel: string, emne: string) {
  doc.setDocumentProperties({
    title: tittel,
    subject: `${emne} Bruksrett: ${m.bedrift}. Se ${VILKAR_URL}`,
    author: SKAPER,
    keywords: `logo, ${m.bedrift}, ${referanse(m)}, Vimzo, vimzo.no`,
    creator: `${PROGRAM} – vimzo.no`,
  })
  doc.setLanguage('nb-NO' as Parameters<typeof doc.setLanguage>[0])
  doc.setCreationDate(new Date(m.dato))
}

/** Profilboka: A4 liggende, vektor der det går, Vimzo nederst på hvert ark. */
async function profilPdf(design: Design, innhold: Innhold, m: Metadata): Promise<Blob> {
  const { jsPDF } = await lastPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdfEgenskaper(doc, m, `${m.bedrift} – visuell profil`, `Visuell profil for ${m.bedrift}: logo, farger, skrift og bruk. ${referanse(m)}.`)
  const W = 297
  const H = 210
  const p = finnPalett(design.palett)
  const s = finnSkrift(design.skrift)
  const navn = visningsnavn(innhold.navn, s, design.bokstaver)
  const rent = { ...design, slagord: false }
  const ikon = { ...design, beholder: 'ingen' as const }
  let side = 0

  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden'
  document.body.appendChild(holder)

  const rgbAv = (h: string) => rgb(h) as [number, number, number]
  const fyll = (h: string) => doc.setFillColor(...rgbAv(h))
  const tekstfarge = (h: string) => doc.setTextColor(...rgbAv(h))

  /** Tegn en SVG-streng inn i en boks, sentrert og med sideforholdet bevart. */
  async function tegn(svg: string, x: number, y: number, b: number, h: number) {
    const m = maal(svg)
    const s2 = Math.min(b / m.b, h / m.h)
    const el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement as unknown as SVGElement
    holder.appendChild(el)
    await doc.svg(el, { x: x + (b - m.b * s2) / 2, y: y + (h - m.h * s2) / 2, width: m.b * s2, height: m.h * s2 })
    el.remove()
  }

  function etikett(t: string, lys = false) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setCharSpace(0.6)
    tekstfarge(lys ? '#FFFFFF' : '#6E6E76')
    doc.text(t.toUpperCase(), 16, 18)
    doc.setCharSpace(0)
  }

  async function fot(lys = false) {
    side++
    await tegn(vimzoSvg(64), 16, H - 14, 5, 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    tekstfarge(lys ? '#FFFFFF' : '#6E6E76')
    doc.text('Laget med Vimzo · vimzo.no', 23.5, H - 10.4)
    doc.text(`${navn} · Visuell profil · ${side}`, W - 16, H - 10.4, { align: 'right' })
  }

  async function nyttArk(bak = '#FFFFFF') {
    if (side > 0) doc.addPage()
    fyll(bak)
    doc.rect(0, 0, W, H, 'F')
  }

  try {
    // Omslag
    await nyttArk(p.primaer)
    await tegn(await logoSvg(design, innhold, 'negativ'), 60, 50, W - 120, 90)
    await fot(true)

    // Logo og frisone
    await nyttArk()
    etikett('01 · Logo')
    const hoved = await logoSvg(design, innhold)
    await tegn(hoved, 78, 52, W - 156, 92)
    doc.setLineDashPattern([2, 1.5], 0)
    doc.setDrawColor(...rgbAv('#005CC8'))
    doc.setLineWidth(0.3)
    doc.rect(62, 40, W - 124, 116)
    doc.setLineDashPattern([], 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    tekstfarge('#6E6E76')
    doc.text('Fri plass rundt logoen: minst høyden på symbolet (x).', 16, H - 24)
    await fot()

    // Bruk: varianten på flaten den er laget for, merket med bruken.
    await nyttArk()
    etikett('01 · Logo i bruk')
    const ruter: [string, string, string][] = [
      ['Nettside og dokumenter', '#FFFFFF', await logoSvg({ ...rent, oppsett: 'side' }, innhold)],
      ['Skilt og bil', p.primaer, await logoSvg(rent, innhold, 'negativ')],
      ['Sosiale medier', p.primaer, await logoSvg(ikon, innhold, 'hvit', true)],
      ['Gravering og stempel', '#FFFFFF', await logoSvg(rent, innhold, 'svart')],
    ]
    const rb = (W - 32 - 6) / 2
    const rh = (H - 52 - 6) / 2
    for (const [i, [n, bak, svg]] of ruter.entries()) {
      const x = 16 + (i % 2) * (rb + 6)
      const y = 26 + Math.floor(i / 2) * (rh + 6)
      fyll(bak)
      doc.setDrawColor(...rgbAv('#E8E8ED'))
      doc.roundedRect(x, y, rb, rh, 3, 3, bak === '#FFFFFF' ? 'FD' : 'F')
      const ikonrute = n === 'Sosiale medier'
      await tegn(svg, x + rb * (ikonrute ? 0.4 : 0.18), y + rh * 0.24, rb * (ikonrute ? 0.2 : 0.64), rh * 0.5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      tekstfarge(bak === '#FFFFFF' ? '#1D1D1F' : '#FFFFFF')
      doc.text(n, x + 5, y + rh - 5)
    }
    await fot()

    // Farger
    await nyttArk()
    etikett('02 · Farger')
    const blokker: [string, string, number, number, number, number][] = [
      ['Primær', p.primaer, 16, 26, 130, 130],
      ['Aksent', p.aksent, 152, 26, 61, 62],
      ['Mørk', p.mork, 219, 26, 62, 62],
      ['Lys', p.lys, 152, 94, 129, 62],
    ]
    for (const [n, h, x, y, b, hh] of blokker) {
      fyll(h)
      doc.setDrawColor(...rgbAv('#E8E8ED'))
      doc.roundedRect(x, y, b, hh, 3, 3, h === p.lys ? 'FD' : 'F')
      const [r, g, bl] = rgb(h)
      tekstfarge(0.299 * r + 0.587 * g + 0.114 * bl < 150 ? '#FFFFFF' : '#1D1D1F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(n, x + 5, y + hh - 17)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text([h.toUpperCase(), `RGB ${rgb(h).join(' ')}`, `CMYK ${cmyk(h).join(' ')}`], x + 5, y + hh - 12)
    }
    const andeler: [number, string][] = [
      [0.6, p.lys],
      [0.3, p.primaer],
      [0.1, p.aksent],
    ]
    let ax = 16
    for (const [a, h] of andeler) {
      fyll(h)
      doc.rect(ax, 164, (W - 32) * a, 8, 'F')
      ax += (W - 32) * a
    }
    doc.setFontSize(7)
    tekstfarge('#6E6E76')
    doc.text('Fordeling i bruk: 60 / 30 / 10', 16, 179)
    await fot()

    // Skrift
    await nyttArk(p.lys)
    etikett('03 · Skrift')
    const ff = FONTER[s.font].familie
    const aa = await tekstbane('Aa', ff, s.vekt, 110, 0, 110, 0, 'start')
    if (aa)
      await tegn(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 120"><path d="${aa}" fill="${p.mork}"/></svg>`,
        16,
        30,
        120,
        96,
      )
    const linjer: [string, string, number, number][] = [
      ['ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ', ff, s.vekt, 7],
      ['abcdefghijklmnopqrstuvwxyzæøå', ff, s.vekt, 7],
      ['0123456789', ff, s.vekt, 7],
    ]
    let ly = 40
    for (const [t, fam, v, g] of linjer) {
      const d = await tekstbane(t, fam, v, g * 10, 0, g * 10, 0, 'start')
      if (d)
        await tegn(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g * 10 * t.length * 0.62} ${g * 12}"><path d="${d}" fill="${p.mork}"/></svg>`,
          150,
          ly,
          131,
          12,
        )
      ly += 16
    }
    const tf = FONTER[TEKSTFONT].familie
    const hierarki: [string, string, number, number][] = [
      ['Overskrift', ff, s.vekt, 16],
      ['Underoverskrift', tf, 700, 10],
      ['Brødtekst står i tekstskriften – rolig og lesbar.', tf, 500, 5],
    ]
    ly = 104
    for (const [t, fam, v, g] of hierarki) {
      const d = await tekstbane(t, fam, v, g * 10, 0, g * 10, 0, 'start')
      if (d)
        await tegn(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g * 10 * t.length * 0.6} ${g * 13}"><path d="${d}" fill="${p.mork}"/></svg>`,
          150,
          ly,
          131,
          g * 1.3,
        )
      ly += g * 1.3 + 6
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    tekstfarge('#6E6E76')
    doc.text(`Logoskrift: ${ff.replace('Logo ', '')} ${s.vekt} · Tekstskrift: ${tf.replace('Logo ', '')}`, 16, H - 24)
    await fot()

    // I bruk
    await nyttArk()
    etikett('04 · I bruk')
    const plasser: [number, number, number, number][] = [
      [16, 26, 130, 77],
      [152, 26, 129, 77],
      [16, 109, 130, 77],
      [152, 109, 129, 77],
    ]
    for (const [i, [x, y, b, hh]] of plasser.entries()) {
      const bilde = await mockupData(design, innhold, i, b / hh).catch(() => null)
      if (bilde) doc.addImage(bilde, 'JPEG', x, y, b, hh, undefined, 'MEDIUM')
    }
    await fot()

    // Digitalt: forsidebilde, innlegg, profilbilde og e-postsignatur.
    await nyttArk(p.lys)
    etikett('05 · Digitalt')
    fyll(p.primaer)
    doc.roundedRect(16, 26, W - 32, 62, 3, 3, 'F')
    await tegn(await logoSvg(rent, innhold, 'negativ'), 90, 38, W - 180, 38)
    doc.roundedRect(16, 94, 84, 84, 3, 3, 'F')
    await tegn(await logoSvg(ikon, innhold, 'hvit', true), 24, 102, 14, 14)
    const slag = await tekstbane(innhold.slagord.trim() || navn, FONTER[s.font].familie, s.vekt, 60, 0, 60, 0, 'start')
    if (slag)
      await tegn(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.max(400, (innhold.slagord.trim() || navn).length * 34)} 80"><path d="${slag}" fill="#FFFFFF"/></svg>`,
        24,
        150,
        68,
        18,
      )
    fyll('#FFFFFF')
    doc.roundedRect(106, 94, 84, 84, 3, 3, 'F')
    fyll(p.primaer)
    doc.circle(148, 136, 26, 'F')
    await tegn(await logoSvg(ikon, innhold, 'hvit', true), 136, 124, 24, 24)
    fyll('#FFFFFF')
    doc.roundedRect(196, 94, 85, 84, 3, 3, 'F')
    await tegn(await logoSvg(rent, innhold), 204, 108, 50, 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    tekstfarge('#1D1D1F')
    doc.text('Ditt navn', 204, 134)
    doc.setFont('helvetica', 'normal')
    tekstfarge('#55565C')
    doc.text([`Tittel · ${navn}`, 'Telefon · nettside'], 204, 140)
    doc.setFontSize(7)
    tekstfarge('#6E6E76')
    doc.text(
      [
        'Forsidebilde: Facebook 1640 × 624, LinkedIn 1584 × 396 · Innlegg 1080 × 1080',
        'Profilbilde 1080 × 1080 · E-postsignatur – filene ligger i mappen digitalt/',
      ],
      16,
      186,
    )
    await fot()

    // Om denne profilen
    await nyttArk()
    await tegn(vimzoSvg(256), W / 2 - 12, 62, 24, 24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    tekstfarge('#1D1D1F')
    doc.text('Om denne profilen', W / 2, 104, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    tekstfarge('#55565C')
    doc.text(
      [
        `Den visuelle profilen til ${navn} er laget med Vimzo.`,
        'Trenger du en nettside som passer til den, hjelper vi gjerne.',
        '',
        'vimzo.no',
      ],
      W / 2,
      114,
      { align: 'center' },
    )
    await fot()

    return doc.output('blob')
  } finally {
    holder.remove()
  }
}

/** En fotomal som JPEG-data til profilboka – samme tegning som i mockups/, mindre. */
async function mockupData(design: Design, innhold: Innhold, indeks: number, forhold: number): Promise<string | null> {
  const mal = FOTOMALER[indeks]
  if (!mal) return null
  const { design: d, kunMerke } = mockupDesign(mal, design)
  const c = await tegnMockup(mal, await logoSvg(d, innhold, mockupVariant(mal), kunMerke), 1400)
  // Cellen har sitt eget sideforhold: beskjær rundt malens utsnitt i stedet for å strekke.
  return beskjaer(mal, c, forhold).toDataURL('image/jpeg', 0.86)
}

/* --------------------------------------------------------------------- zip */

type Fil = string | Blob | Uint8Array<ArrayBuffer>

/**
 * Hele pakken som en ZIP. Kalles bare etter at bestillingen er lagt inn –
 * aldri før – eller for en logo som er frigitt med en nettside (`ordreId`
 * er da `NETTSIDE`). Kan kalles igjen fra kvitteringen.
 */
export async function lagPakke(
  design: Design,
  innhold: Innhold,
  produkt: ProduktId,
  ordreId: string,
): Promise<{ blob: Blob; filnavn: string }> {
  const { default: JSZipKlasse } = await import('jszip')
  const zip = new JSZipKlasse()
  const navn = filnavn(innhold.navn)
  const m: Metadata = { ordreId, bedrift: innhold.navn.trim() || 'Ditt firma', dato: new Date().toISOString() }
  const legg = (sti: string, data: Fil) =>
    zip.file(sti, data, { compression: /\.(png|jpe?g|woff2?)$/.test(sti) ? 'STORE' : 'DEFLATE' })

  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden'
  document.body.appendChild(holder)

  /** SVG, PDF, PNG-ene og eventuelt JPG for én versjon. */
  const lagre = async (mappe: string, fil: string, variant: string, v: Versjon, png: number[], jpgBak?: string) => {
    legg(`${mappe}/${fil}.svg`, medSvgMetadata(v.trykk, m, variant))
    legg(`${mappe}/${fil}.pdf`, await vektorPdf(v, m, variant, holder))
    const luft = v.bak ? 0 : LUFT
    for (const side of png) legg(`${mappe}/${fil}-${side}.png`, await medPngMetadata(await raster(v.bilde, side, { luft }), m, variant))
    if (jpgBak)
      legg(
        `${mappe}/${fil}-2048.jpg`,
        await raster(v.bilde, 2048, { luft, bak: jpgBak, type: 'image/jpeg', kvalitet: 0.92 }),
      )
  }

  try {
    // De tre hovedversjonene øverst: kundens logo slik den ble valgt.
    const hoved: [string, string, Fargevei][] = [
      ['1-hvit-bakgrunn', 'hvit bakgrunn', 'hvit-bakgrunn'],
      ['2-mork-bakgrunn-to-farger', 'mørk bakgrunn, to farger', 'to-farger-pa-mork'],
      ['3-fullfarge-transparent', 'fullfarge, transparent', 'fullfarge'],
    ]
    for (const [mappe, variant, fv] of hoved) {
      const v = await lagVersjon(design, innhold, 'valgt', fv, 100)
      await lagre(mappe, `${navn}-${mappe.slice(2)}`, variant, v, [512, 1024, 2048, 4096])
    }

    // Alle oppsett i alle fargeveier.
    for (const u of UTFORMINGER) {
      for (const f of FARGEVEIER) {
        const v = await lagVersjon(design, innhold, u.id, f.id, u.mm)
        await lagre(`logo/${u.id}`, `${navn}-${u.id}-${f.id}`, `${u.navn}, ${f.navn}`, v, [512, 1024, 2048], oppskrift(design, f.id).jpgBak)
      }
    }

    // Gravering: én farge, én bane. Slagordet er tatt ut – så liten tekst
    // blir for fin til laser og folie.
    for (const u of UTFORMINGER) {
      const v = await lagVersjon({ ...design, slagord: false }, innhold, u.id, 'svart', u.mm)
      const en = v.rent.deler.find((d) => d.fill === '#000000')
      if (!en) continue
      const gravering: Versjon = { ...v, trykk: somSvg(v.rent, [en], u.mm), bilde: somSvg(v.rent, [en]) }
      legg(`gravering/${navn}-${u.id}-gravering.svg`, medSvgMetadata(gravering.trykk, m, `${u.navn}, gravering`))
      legg(`gravering/${navn}-${u.id}-gravering.pdf`, await vektorPdf(gravering, m, `${u.navn}, gravering`, holder))
    }

    farger(legg, design, m)
    await skrift(legg, design, innhold)
    await web(legg, design, innhold, m)

    if (produkt === 'profil') {
      await digitalt(legg, design, innhold, m)
      legg('visuell-profil/visuell-profil.pdf', await profilPdf(design, innhold, m))
      for (const mal of FOTOMALER) {
        const { design: d, kunMerke } = mockupDesign(mal, design)
        const svg = await logoSvg(d, innhold, mockupVariant(mal), kunMerke)
        legg(`visuell-profil/mockups/${navn}-${mal.id}.jpg`, await mockupJpg(mal, svg, 2400, 0.88))
      }
    }
    legg('LES-MEG.txt', lesMeg(design, innhold, m, produkt))
  } finally {
    holder.remove()
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    comment: `Laget med Vimzo – vimzo.no · ${referanse(m)}`,
  })
  return { blob, filnavn: `${navn}-${produkt === 'profil' ? 'logo-og-profil' : 'logo'}.zip` }
}

/** Lag og last ned pakken. */
export async function lastNedPakke(design: Design, innhold: Innhold, produkt: ProduktId, ordreId: string): Promise<void> {
  const { blob, filnavn: fil } = await lagPakke(design, innhold, produkt, ordreId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fil
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

type Legg = (sti: string, data: Fil) => void

/* ------------------------------------------------------------ farger/ */

function farger(legg: Legg, design: Design, m: Metadata) {
  const p = finnPalett(design.palett)
  const liste = fargeliste(design)
  legg(
    'farger/farger.txt',
    [
      `Farger – ${m.bedrift} (palett «${p.navn}»)`,
      '',
      ...liste.flatMap((f) => [
        `${f.navn.padEnd(7)} ${f.hex}   RGB ${f.rgb.join(' ')}   CMYK ${f.cmyk.join(' ')}`,
        `        ${f.rolle}`,
      ]),
      '',
      CMYK_MERKNAD,
      '',
      'Fordeling i bruk: omtrent 60 % lys, 30 % primær, 10 % aksent.',
      '',
      'Laget med Vimzo – vimzo.no',
    ].join('\n'),
  )
  legg(
    'farger/farger.json',
    JSON.stringify(
      {
        bedrift: m.bedrift,
        palett: p.navn,
        farger: liste.map((f) => ({
          navn: f.navn,
          rolle: f.rolle,
          hex: f.hex,
          rgb: { r: f.rgb[0], g: f.rgb[1], b: f.rgb[2] },
          cmyk: { c: f.cmyk[0], m: f.cmyk[1], y: f.cmyk[2], k: f.cmyk[3] },
        })),
        merknad: CMYK_MERKNAD,
        referanse: referanse(m),
        laget: `${PROGRAM} – vimzo.no`,
      },
      null,
      2,
    ) + '\n',
  )
  legg(
    'farger/farger.css',
    [
      `/* Farger – ${m.bedrift}. Laget med Vimzo – vimzo.no */`,
      ':root {',
      ...liste.flatMap((f) => [`  --farge-${f.id}: ${f.hex};`, `  --farge-${f.id}-rgb: ${f.rgb.join(' ')};`]),
      '}',
      '',
      '/* Bruk: color: var(--farge-primaer); background: rgb(var(--farge-primaer-rgb) / 0.1); */',
      '',
    ].join('\n'),
  )
  legg('farger/vimzo-farger.ase', lagAse(`${m.bedrift} – Vimzo`, liste.map((f) => ({ navn: f.navn, hex: f.hex }))))
}

/* ------------------------------------------------------------ skrift/ */

/** Navnet på Google Fonts for hver skrift vi bruker. */
const GOOGLE: Record<FontId, string> = {
  manrope: 'Manrope',
  sora: 'Sora',
  outfit: 'Outfit',
  archivo: 'Archivo',
  bebas: 'Bebas Neue',
  fraunces: 'Fraunces',
  playfair: 'Playfair Display',
  dmserif: 'DM Serif Display',
  cormorant: 'Cormorant Garamond',
  nunito: 'Nunito',
  space: 'Space Grotesk',
  jetbrains: 'JetBrains Mono',
}

/** Skriftene logoen og profilen faktisk bruker – fil for fil, med vekt og rolle. */
function brukteSkrifter(design: Design, innhold: Innhold) {
  const s = finnSkrift(design.skrift)
  const ut = new Map<string, { id: FontId; vekt: number; fil: string; roller: string[] }>()
  const legg = (id: FontId, vekt: number, rolle: string) => {
    const filer = FONTER[id].filer as Record<number, string>
    const vekter = Object.keys(filer).map(Number)
    const v = vekter.reduce((a, b) => (Math.abs(b - vekt) < Math.abs(a - vekt) ? b : a), vekter[0])
    const fil = filer[v]
    const fra = ut.get(fil)
    if (fra) fra.roller.push(rolle)
    else ut.set(fil, { id, vekt: v, fil, roller: [rolle] })
  }
  legg(s.font, s.vekt, 'logo')
  if (design.slagord && innhold.slagord.trim()) {
    const sl = slagordstil(design, innhold.slagord).stil
    legg(sl.font, sl.vekt, 'slagord')
  }
  legg(TEKSTFONT, 500, 'brødtekst')
  legg(TEKSTFONT, 700, 'underoverskrifter')
  return [...ut.values()]
}

async function skrift(legg: Legg, design: Design, innhold: Innhold) {
  const brukt = brukteSkrifter(design, innhold)
  const lisenser = new Set<string>()
  for (const f of brukt) {
    const slug = f.fil.replace(/-\d+$/, '')
    const mappe = `skrift/${GOOGLE[f.id].replace(/ /g, '-')}`
    const [woff, woff2] = await Promise.all(
      ['woff', 'woff2'].map((e) =>
        fetch(`/fonts/logo/${f.fil}.${e}`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(f.fil)))),
      ),
    )
    const sfnt = await woffTilSfnt(woff)
    legg(`${mappe}/${f.fil}.${sfnt.endelse}`, sfnt.data)
    legg(`${mappe}/${f.fil}.woff2`, new Uint8Array(woff2))
    if (!lisenser.has(mappe)) {
      lisenser.add(mappe)
      const r = await fetch(`/fonts/logo/LICENSE-${slug}.txt`)
      if (r.ok) legg(`${mappe}/OFL.txt`, await r.text())
    }
  }
  legg(
    'skrift/skrift.txt',
    [
      'Skrift',
      '',
      ...brukt.flatMap((f) => [
        `${GOOGLE[f.id]} ${f.vekt} – ${f.roller.join(', ')}`,
        `  Filer:  ${GOOGLE[f.id].replace(/ /g, '-')}/${f.fil}.ttf (installer på maskinen) og .woff2 (nettside)`,
        `  Hele familien, gratis: https://fonts.google.com/specimen/${GOOGLE[f.id].replace(/ /g, '+')}`,
        '',
      ]),
      'Filene her er latin-utvalget (med æ, ø og å) av vektene logoen bruker. Trenger du flere vekter eller',
      'tegn, last ned hele familien fra Google Fonts.',
      '',
      'Alle skriftene er lisensiert under SIL Open Font License 1.1 (OFL.txt ligger ved hver skrift). Du kan',
      'bruke dem fritt, også kommersielt, installere dem og sende dem videre til trykkeri eller webutvikler.',
      '',
      'I logofilene er teksten gjort om til baner – logoen trenger ingen av skriftene for å vises riktig.',
      '',
      'Laget med Vimzo – vimzo.no',
    ].join('\n'),
  )
}

/* ------------------------------------------------------------ web/ */

async function web(legg: Legg, design: Design, innhold: Innhold, m: Metadata) {
  const p = finnPalett(design.palett)
  // Favikonet: symbolet i en beholder – et merke uten flate forsvinner i 16 px.
  const favDesign: Design = { ...design, beholder: design.beholder === 'ingen' ? 'flis' : design.beholder }
  const fav = await rensForTrykk(await tegnKilde(favDesign, innhold, 'positiv', true, true))
  legg('web/favicon.svg', medSvgMetadata(somSvg(fav, fav.deler), m, 'favikon'))
  const favBilde = somSvg(fav, fav.lag ?? fav.deler)
  const ico = await Promise.all([16, 32, 48].map(async (side) => ({ side, png: await raster(favBilde, side) })))
  legg('web/favicon.ico', new Uint8Array(await (await lagIco(ico)).arrayBuffer()))

  // Ikonene til hjemskjermen: hvitt symbol på primærfargen, helt dekkende –
  // iOS fyller gjennomsiktighet med svart.
  const hvitt = await logoSvg({ ...design, beholder: 'ingen' }, innhold, 'hvit', true)
  for (const [fil, side] of [
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
  ] as const)
    legg(`web/${fil}`, await medPngMetadata(await raster(paFlate(hvitt, side, side, p.primaer, 0.56), side), m, 'ikon'))

  const negativ = await logoSvg(design, innhold, 'negativ')
  legg(
    'web/og-image-1200x630.png',
    await medPngMetadata(await raster(paFlate(negativ, 1200, 630, p.primaer, 0.6), 1200), m, 'delingsbilde'),
  )
  legg(
    'web/site.webmanifest',
    JSON.stringify(
      {
        name: m.bedrift,
        short_name: m.bedrift.slice(0, 12),
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        theme_color: p.primaer.toUpperCase(),
        background_color: '#FFFFFF',
        display: 'standalone',
      },
      null,
      2,
    ) + '\n',
  )
  legg(
    'web/sett-inn-i-head.html',
    [
      `<!-- Favikon og delingsbilde for ${esc(m.bedrift)}. Legg filene i web/ i roten av nettstedet,`,
      '     og linjene under i <head>. Laget med Vimzo – vimzo.no -->',
      '<link rel="icon" href="/favicon.ico" sizes="48x48">',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
      `<meta name="theme-color" content="${p.primaer.toUpperCase()}">`,
      '<meta property="og:image" content="https://DITT-DOMENE.no/og-image-1200x630.png">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '',
    ].join('\n'),
  )
}

/* ------------------------------------------------------------ digitalt/ */

/** Riktige størrelser til sosiale medier, og en e-postsignatur. */
async function digitalt(legg: Legg, design: Design, innhold: Innhold, m: Metadata) {
  const p = finnPalett(design.palett)
  const s = finnSkrift(design.skrift)
  const navn = visningsnavn(innhold.navn, s, design.bokstaver)
  const negativ = await logoSvg({ ...design, slagord: false }, innhold, 'negativ')
  const merke = await logoSvg({ ...design, beholder: 'ingen' }, innhold, 'hvit', true)
  const lagre = async (fil: string, svg: string, side: number, variant: string) =>
    legg(`digitalt/${fil}`, await medPngMetadata(await raster(svg, side), m, variant))

  await lagre('avatar-1080.png', paFlate(merke, 1080, 1080, p.primaer, 0.52), 1080, 'profilbilde')
  await lagre('facebook-cover-1640x624.png', paFlate(negativ, 1640, 624, p.primaer, 0.42), 1640, 'forsidebilde Facebook')
  await lagre('linkedin-banner-1584x396.png', paFlate(negativ, 1584, 396, p.primaer, 0.42), 1584, 'banner LinkedIn')

  // Innlegg: merket øverst, slagordet stort i logoskriften nederst.
  const tekst = innhold.slagord.trim() || navn
  const t = await tekstbane(tekst, FONTER[s.font].familie, s.vekt, 92, 90, 940, 0, 'start')
  const { vb, indre } = innmat(merke)
  const msk = 130 / Math.max(vb[2], vb[3])
  const post = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="${p.primaer}"/><g transform="translate(90 90) scale(${msk}) translate(${-vb[0]} ${-vb[1]})">${indre}</g>${t ? `<path d="${t}" fill="#FFFFFF"/>` : ''}</svg>`
  await lagre('instagram-post-1080.png', post, 1080, 'innlegg')

  // E-postsignatur: en tabell med logoen som innebygd PNG – det e-postklienter tåler.
  const logoPng = await raster(await logoSvg({ ...design, slagord: false }, innhold), 320)
  const data = await new Promise<string>((ok) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.readAsDataURL(logoPng)
  })
  legg(
    'digitalt/epostsignatur.html',
    `<!doctype html><html lang="nb"><head><meta charset="utf-8"><title>E-postsignatur – ${esc(m.bedrift)}</title><meta name="generator" content="${PROGRAM} – vimzo.no"></head><body>
<!-- Åpne filen i en nettleser, merk tabellen og lim den inn i signaturfeltet i e-postprogrammet. Laget med Vimzo – vimzo.no · ${esc(referanse(m))} -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333">
<tr><td style="padding-right:16px;border-right:2px solid ${p.primaer}"><img src="${data}" width="160" alt="${esc(m.bedrift)}"></td>
<td style="padding-left:16px;line-height:1.5"><strong style="color:${p.mork}">Ditt navn</strong><br>Tittel · ${esc(navn)}<br>Telefon · <a href="https://example.no" style="color:${p.primaer}">nettside</a></td></tr>
</table></body></html>
`,
  )
}

/* ------------------------------------------------------------ LES-MEG */

function lesMeg(design: Design, innhold: Innhold, m: Metadata, produkt: ProduktId) {
  const navn = filnavn(innhold.navn)
  const profil = produkt === 'profil'
  const skrifter = brukteSkrifter(design, innhold)
  return [
    `Logo for ${m.bedrift}`,
    `${referanse(m)} · ${m.dato.slice(0, 10)}`,
    '',
    'DE TRE DU OFTEST TRENGER',
    '  1-hvit-bakgrunn/            Full farge på hvit bakgrunn – dokumenter, tilbud, nettsider.',
    '  2-mork-bakgrunn-to-farger/  To farger på mørk flate – skilt, bil, arbeidstøy.',
    '  3-fullfarge-transparent/    Full farge uten bakgrunn – legg den på det du vil.',
    '  Hver har SVG og PDF (vektor, til trykk) og PNG i 512, 1024, 2048 og 4096 piksler.',
    '',
    'ALT ANNET',
    '  logo/liggende/  logo/staende/  logo/kun-symbol/  logo/kun-navn/',
    '              Hvert oppsett i fire fargeversjoner: fullfarge, svart, hvit (til mørke flater)',
    '              og to-farger-pa-mork. Hver i SVG, PDF, PNG (512, 1024, 2048, transparent) og',
    '              JPG (2048, med bakgrunn – til Word og PowerPoint).',
    '  gravering/  Én farge (ren svart) og én sammenhengende bane – laser, folieskjæring, preging,',
    '              stempel. Slagordet er tatt ut; så liten tekst blir for fin til å graveres.',
    '  farger/     farger.txt, farger.json, farger.css og vimzo-farger.ase (importer i Adobe/Affinity).',
    '  skrift/     Skriftfilene (TTF til maskinen, WOFF2 til nettsiden) med lisens og nedlastingslenker.',
    '  web/        favicon.ico og favicon.svg, ikoner til iPhone og Android, site.webmanifest,',
    '              delingsbilde (og-image) og sett-inn-i-head.html med linjene til nettsiden.',
    profil ? '  digitalt/   Profilbilde, forsidebilder til Facebook og LinkedIn, innlegg og e-postsignatur.' : '',
    profil ? '  visuell-profil/  Profilboka (visuell-profil.pdf) og mockups/ i høy oppløsning.' : '',
    '',
    'HVILKEN FIL TIL HVEM',
    `  Trykkeri (visittkort, brosjyre):  PDF eller SVG i fullfarge, f.eks. logo/liggende/${navn}-liggende-fullfarge.pdf`,
    '  Skiltlager, folie, gravør:        gravering/ (eller svart-versjonen i logo/)',
    '  Bil og arbeidstøy:                2-mork-bakgrunn-to-farger/ eller hvit-versjonen i logo/',
    '  Nettside og webutvikler:          SVG eller PNG, og alt i web/ og farger/farger.css',
    '  Word og PowerPoint:               PNG (transparent) eller JPG',
    '',
    '  Vektorfilene er SVG og PDF. De åpnes i Adobe Illustrator, Affinity Designer og Inkscape, og alle',
    '  trykkerier tar imot dem. EPS og AI er ikke med – ber noen om det, kan de åpne PDF-en i Illustrator',
    '  og lagre den som AI eller EPS selv. SVG og PDF har mål i millimeter; vektor kan skaleres fritt.',
    '',
    'FARGER',
    ...fargeliste(design).map((f) => `  ${f.navn.padEnd(7)} ${f.hex}   RGB ${f.rgb.join(' ')}   CMYK ${f.cmyk.join(' ')}`),
    '  CMYK er en omtrentlig omregning – be trykkeriet om prøvetrykk. Pantone er ikke angitt.',
    '',
    'SKRIFT',
    ...skrifter.map((f) => `  ${GOOGLE[f.id]} ${f.vekt} – ${f.roller.join(', ')}`),
    '  Se skrift/skrift.txt. I logofilene er teksten gjort om til baner, så skriften trengs ikke for å vise logoen.',
    '',
    'FRI PLASS OG STØRRELSE',
    '  Hold fri plass rundt logoen minst like stor som høyden på symbolet (x). Ikke strekk, roter eller',
    '  farg om logoen, og ikke legg den på et urolig bilde – bruk hvit eller to-farger-versjonen.',
    '  Minste størrelse: liggende logo 25 mm / 120 px bred, symbolet alene 8 mm / 24 px.',
    '',
    `Bruksretten tilhører ${m.bedrift}. Vilkår: https://${VILKAR_URL}`,
    m.ordreId === NETTSIDE ? 'Logoen er levert som en del av nettsideprosjektet ditt hos Vimzo.' : `Oppgi bestillingsnummer ${m.ordreId} hvis du kontakter oss.`,
    '',
    'Laget med Vimzo – vimzo.no',
    '',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n')
}

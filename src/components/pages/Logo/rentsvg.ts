/**
 * Trykkferdig SVG, laget med boolske operasjoner (paper.js).
 *
 * Det et trykkeri, en folieskjærer eller en gravør forventer av en vektorfil,
 * og som en SVG rett fra nettleseren ikke er:
 *
 *   – bare fylte baner: ingen tekst, strek, gjennomsiktighet, masker,
 *     klipp, filtre eller gradienter
 *   – ingen farger oppå hverandre: hver flate får skåret bort det som ligger
 *     over den, og like farger slås sammen til én bane – ellers står det en
 *     hårfin skjøt der to like flater møtes, og en plotter skjærer to ganger
 *   – kurver beholdt som kurver (aldri brutt opp i småstreker), koordinater
 *     med to desimaler og viewBox tett rundt motivet
 *
 * Inn kommer en SVG der teksten alt er gjort om til baner, og der hver form
 * har `data-rolle` (merke, navn eller slagord). Rollen trengs når farger
 * skal slås sammen – i to-fargeversjonen er det merket som får aksenten.
 */

export type Rolle = 'merke' | 'navn' | 'slagord'

export interface Kildeform {
  /** Fyllfargen som #RRGGBB – gjennomsiktighet er alt flatet ut mot bakgrunnen. */
  fill: string
  rolle: Rolle
}

/**
 * Fargen hver form skal ha i filen, i samme rekkefølge som formene.
 * `null` betyr utsparing: formen skjæres bort fra det som ligger under, og
 * blir et hull. Slik blir et hvitt symbol i en svart flis til en ekte
 * ensfarget fil.
 */
export type Fargekart = (former: Kildeform[]) => (string | null)[]

export interface Del {
  fill: string
  d: string
}

export interface Rentresultat {
  /** Flatene, uten overlapp, én bane per farge. Bakgrunnen først. */
  deler: Del[]
  /**
   * De samme formene lagvis, uten utskjæring – til PNG og JPG, der skjøter
   * mellom flater som møtes kant i kant ellers gir en lys hårstrek i
   * kantutjevningen. `null` når filen har utsparinger uten bakgrunn: da er
   * de rene delene eneste riktige tegning.
   */
  lag: Del[] | null
  /** Motivets mål i SVG-enheter. viewBox er alltid `0 0 b h`. */
  b: number
  h: number
}

export interface Rensevalg {
  fargekart?: Fargekart
  /** En flate bak logoen, med luft rundt som andel av motivets lengste side. */
  bakgrunn?: { farge: string; luft: number }
}

/* ------------------------------------------------------------------ farger */

const NAVNGITT: Record<string, string> = { white: '#FFFFFF', black: '#000000' }

const hexTilRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const tilHexKomp = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()

/**
 * Fyllfargen som #RRGGBB. En halvgjennomsiktig farge (slagordet i den
 * negative logoen er hvit med 72 % dekning) blandes ut mot fargen den står
 * på – i en trykkfil finnes det ikke «litt gjennomsiktig».
 */
export function flatFarge(fill: string, bak = '#FFFFFF'): string | null {
  const f = fill.trim().toLowerCase()
  if (!f || f === 'none' || f === 'transparent') return null
  if (NAVNGITT[f]) return NAVNGITT[f]
  if (/^#[0-9a-f]{3}$/.test(f)) return ('#' + [...f.slice(1)].map((c) => c + c).join('')).toUpperCase()
  if (/^#[0-9a-f]{6}$/.test(f)) return f.toUpperCase()
  const m = f.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).map(Number)
    const [br, bg, bb] = hexTilRgb(bak)
    const bland = (x: number, y: number) => x * a + y * (1 - a)
    return '#' + [bland(r, br), bland(g, bg), bland(b, bb)].map(tilHexKomp).join('')
  }
  return null
}

/* ----------------------------------------------------------------- tall */

/** To desimaler, uten «-0» og uten unødvendige nuller. */
export const tall = (n: number) => {
  const r = Math.round(n * 100) / 100
  return String(Object.is(r, -0) ? 0 : r)
}

/* ------------------------------------------------------------------- rens */

type Bane = paper.PathItem & {
  area: number
  resolveCrossings(): Bane
  reorient(nonZero: boolean, clockwise: boolean): Bane
}

const FORMER = ['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline']

const hentPapir = async () => (await import('paper/dist/paper-core')).default
let papirlast: ReturnType<typeof hentPapir> | null = null
const lastPapir = () => (papirlast ??= hentPapir())

/** Arvet egenskap: formens egen, ellers nærmeste forelders. */
function arvet(el: Element, navn: string): string | null {
  for (let e: Element | null = el; e && e.nodeType === 1; e = e.parentElement) {
    const v = e.getAttribute(navn)
    if (v != null) return v
  }
  return null
}

export async function rensForTrykk(kilde: string, valg: Rensevalg = {}): Promise<Rentresultat> {
  const paper = await lastPapir()
  const scope = new paper.PaperScope()
  scope.setup(new scope.Size(1, 1))
  const doc = new DOMParser().parseFromString(kilde, 'image/svg+xml')
  const NS = 'http://www.w3.org/2000/svg'
  const flatBak = valg.bakgrunn?.farge ?? '#FFFFFF'

  // Én form om gangen, med forfedrenes transformasjoner rundt seg. Da vet vi
  // nøyaktig hvilken form som er hvilken – paper.js beholder ikke attributter.
  type Rå = { form: paper.PathItem; kilde: Kildeform }
  const raa: Rå[] = []
  for (const el of [...doc.documentElement.querySelectorAll(FORMER.join(','))]) {
    const fill = flatFarge(arvet(el, 'fill') ?? '#000000', flatBak)
    if (!fill) continue
    const rolle = (arvet(el, 'data-rolle') as Rolle | null) ?? 'navn'
    const regel = arvet(el, 'fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero'
    const transformer: string[] = []
    for (let e = el.parentElement; e && e !== doc.documentElement; e = e.parentElement) {
      const t = e.getAttribute('transform')
      if (t) transformer.unshift(t)
    }
    const kopi = el.cloneNode(true) as Element
    for (const a of ['fill', 'fill-rule', 'data-rolle', 'id', 'class', 'style']) kopi.removeAttribute(a)
    let indre = new XMLSerializer().serializeToString(kopi)
    for (const t of [...transformer].reverse()) indre = `<g transform="${t}">${indre}</g>`
    const item = scope.project.importSVG(`<svg xmlns="${NS}">${indre}</svg>`, {
      expandShapes: true,
      insert: false,
    }) as paper.Item
    const funnet = [item, ...item.getItems({ recursive: true })].find(
      (it) => it instanceof scope.Path || it instanceof scope.CompoundPath,
    ) as paper.PathItem | undefined
    if (!funnet) continue
    const form = funnet.clone({ insert: false }) as paper.PathItem
    form.matrix = new scope.Matrix()
    form.transform(funnet.globalMatrix)
    form.fillRule = regel
    // Gjør formen «nonzero»-riktig: selvkryssinger løses opp og retningene
    // snus, så formen ser lik ut uansett hvilken fyllregel som leser den.
    // (resolveCrossings og reorient finnes i paper.js, men mangler i typene.)
    const ren = (form as Bane).resolveCrossings()
    ren.reorient(regel === 'nonzero', true)
    if (Math.abs(ren.area) < 1e-6) continue
    raa.push({ form: ren, kilde: { fill, rolle } })
  }
  if (!raa.length) throw new Error('Logoen har ingen former')

  const kart = valg.fargekart ? valg.fargekart(raa.map((r) => r.kilde)) : raa.map((r) => r.kilde.fill)
  const former = raa.map((r, i) => ({ form: r.form, farge: kart[i] }))

  // Motivets grenser – bare det som faktisk tegnes, ikke utsparingene.
  let grenser: paper.Rectangle | null = null
  for (const f of former) if (f.farge) grenser = grenser ? grenser.unite(f.form.bounds) : f.form.bounds
  if (!grenser) throw new Error('Logoen har ingen synlige former')

  if (valg.bakgrunn) {
    const luft = Math.max(grenser.width, grenser.height) * valg.bakgrunn.luft
    const flate = new scope.Path.Rectangle({ rectangle: grenser.expand(luft * 2), insert: false })
    flate.reorient(true, true)
    former.unshift({ form: flate, farge: valg.bakgrunn.farge.toUpperCase() })
    grenser = flate.bounds
  }

  // Lagvis (til PNG): bare gyldig når alle utsparinger har en flate under seg.
  const harHull = former.some((f) => f.farge === null)
  const lagvis = harHull && !valg.bakgrunn ? null : former.map((f) => ({ form: f.form, farge: f.farge ?? flatBak }))

  // Rene flater: hver form minus alt i andre farger som ligger over den.
  const perFarge = new Map<string, paper.PathItem>()
  former.forEach((f, i) => {
    if (!f.farge) return
    let rest: paper.PathItem = f.form
    for (const over of former.slice(i + 1)) {
      if (over.farge === f.farge || !rest.bounds.intersects(over.form.bounds)) continue
      rest = rest.subtract(over.form, { insert: false })
    }
    if (Math.abs((rest as Bane).area) < 1e-6) return
    const for_ = perFarge.get(f.farge)
    perFarge.set(f.farge, for_ ? for_.unite(rest, { insert: false }) : rest)
  })

  const ramme = grenser as paper.Rectangle
  const ox = ramme.x
  const oy = ramme.y
  const bane = (p: paper.PathItem) => baneData(p, ox, oy, scope)
  return {
    deler: [...perFarge].map(([fill, p]) => ({ fill, d: bane(p) })).filter((x) => x.d),
    lag: lagvis ? lagvis.map((l) => ({ fill: l.farge, d: bane(l.form) })).filter((x) => x.d) : null,
    b: Number(tall(ramme.width)),
    h: Number(tall(ramme.height)),
  }
}

/**
 * Banedata i absolutte koordinater, flyttet så motivet starter i 0,0.
 * Rette stykker blir L, buede C – kurvene beholdes som kurver.
 */
function baneData(item: paper.PathItem, ox: number, oy: number, scope: paper.PaperScope): string {
  const stier = (item instanceof scope.CompoundPath ? item.children : [item]) as paper.Path[]
  const P = (p: paper.Point) => `${tall(p.x - ox)} ${tall(p.y - oy)}`
  let d = ''
  for (const s of stier) {
    if (!s.segments?.length || Math.abs(s.area) < 1e-6) continue
    d += `M${P(s.segments[0].point)}`
    const kurver = s.curves
    kurver.forEach((c, i) => {
      const siste = i === kurver.length - 1 && s.closed
      if (!c.hasHandles()) {
        if (!siste) d += `L${P(c.point2)}`
      } else {
        d += `C${P(c.point1.add(c.handle1))} ${P(c.point2.add(c.handle2))} ${P(c.point2)}`
      }
    })
    if (s.closed) d += 'Z'
  }
  return d
}

/** Delene som en frittstående SVG. Uten `mm` får filen mål i piksler. */
export function somSvg(r: Pick<Rentresultat, 'b' | 'h'>, deler: Del[], mm?: number): string {
  const [w, h] = mm ? [`${tall(mm)}mm`, `${tall((mm * r.h) / r.b)}mm`] : [tall(r.b), tall(r.h)]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${tall(r.b)} ${tall(r.h)}">` +
    deler.map((x, i) => `<path id="flate-${i + 1}" fill="${x.fill}" d="${x.d}"/>`).join('') +
    '</svg>'
  )
}

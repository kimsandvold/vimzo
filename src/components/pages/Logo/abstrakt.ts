/**
 * Abstrakte merker, generert – ikke hentet fra et ikonbibliotek.
 *
 * Hvert merke lages av et frø, så det samme frøet alltid gir det samme
 * merket. Familiene er grepene moderne merker faktisk er bygget av, og hver
 * familie har noen få komposisjoner som er tegnet ferdig – frøet velger
 * komposisjon, dreining og hvor aksenten sitter, aldri tilfeldige former.
 * Det er forskjellen på et merke og et ikon: et ikon er et motiv, et merke
 * er en komposisjon med balanse, rytme og luft.
 *
 * Reglene som gjør dem trykkbare og lesbare på 32 px: alt er fylte flater,
 * ingen gjennomsiktighet, og ingen form overlapper en annen – delene skilles
 * av en fast fuge (FUGE, 3,5 av 64). Da står merket like godt i én farge
 * (gravering, stempel) som i tre, og fugen forsvinner ikke når det blir lite.
 *
 * Fargene er indekser i paletten (0 primær, 1 aksent, 2 mørk), aldri hex.
 */
export type Abstraktform =
  | { t: 'path'; d: string; f: 0 | 1 | 2; e?: boolean; rot?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; f: 0 | 1 | 2; rot?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; f: 0 | 1 | 2; rot?: number }

export const FAMILIER_ABSTRAKT = ['kvadrant', 'skive', 'rosett', 'fasett', 'bue', 'form'] as const
export type AbstraktFamilie = (typeof FAMILIER_ABSTRAKT)[number]

/** Navnene i grensesnittet – til skjermlesere og verktøytips. */
export const ABSTRAKT_NAVN: Record<AbstraktFamilie, string> = {
  kvadrant: 'ruter',
  skive: 'skiver',
  rosett: 'rosett',
  fasett: 'fasetter',
  bue: 'buer',
  form: 'form',
}

export interface Abstrakt {
  fro: number
  familie: AbstraktFamilie
}

type F = 0 | 1 | 2
type Pkt = readonly [number, number]

/** Fugen mellom delene, av 64. Holder seg synlig ned til 32 px (1,75 px). */
const FUGE = 3.5
const C = 32

function rng(fro: number) {
  let s = (fro * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}
const velg = <T>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]
const n2 = (x: number) => Math.round(x * 100) / 100
const P = (x: number, y: number) => `${n2(x)} ${n2(y)}`
const polar = (cx: number, cy: number, r: number, v: number): Pkt => [cx + r * Math.cos(v), cy + r * Math.sin(v)]
const grad = (g: number) => (g * Math.PI) / 180

/**
 * En liten banebygger som flytter alle punkter gjennom `t` – en dreining
 * eller forskyvning. Dreining bevarer buenes retning, så det samme utsnittet
 * kan tegnes én gang og settes inn i alle fire hjørner.
 */
function bane(t: (p: Pkt) => Pkt = (p) => p) {
  let d = ''
  const b = {
    M: (x: number, y: number) => ((d += `M${P(...t([x, y]))}`), b),
    L: (x: number, y: number) => ((d += `L${P(...t([x, y]))}`), b),
    A: (r: number, x: number, y: number, stor = 0, med = 1) => ((d += `A${n2(r)} ${n2(r)} 0 ${stor} ${med} ${P(...t([x, y]))}`), b),
    Z: () => ((d += 'Z'), b),
    get d() {
      return d
    },
  }
  return b
}
/** Dreiing om et punkt. */
const om = (cx: number, cy: number, v: number) => {
  const c = Math.cos(v)
  const s = Math.sin(v)
  return ([x, y]: Pkt): Pkt => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]
}

/** Et ringsegment (annulus-sektor) som fylt flate. */
function bue(cx: number, cy: number, ri: number, ry: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, ry, a0)
  const [x1, y1] = polar(cx, cy, ry, a1)
  const [x2, y2] = polar(cx, cy, ri, a1)
  const [x3, y3] = polar(cx, cy, ri, a0)
  const stor = a1 - a0 > Math.PI ? 1 : 0
  if (ri <= 0) return `M${P(cx, cy)}L${P(x0, y0)}A${n2(ry)} ${n2(ry)} 0 ${stor} 1 ${P(x1, y1)}Z`
  return `M${P(x0, y0)}A${n2(ry)} ${n2(ry)} 0 ${stor} 1 ${P(x1, y1)}L${P(x2, y2)}A${n2(ri)} ${n2(ri)} 0 ${stor} 0 ${P(x3, y3)}Z`
}

/** Et polygon krympet mot tyngdepunktet med en fast avstand – fugen mellom fasetter. */
function fasett(pk: Pkt[], inn: number): string {
  const cx = pk.reduce((s, p) => s + p[0], 0) / pk.length
  const cy = pk.reduce((s, p) => s + p[1], 0) / pk.length
  // Innsirkelradius for jevne figurer: avstanden fra midten til nærmeste kant.
  let r = Infinity
  for (let i = 0; i < pk.length; i++) {
    const [ax, ay] = pk[i]
    const [bx, by] = pk[(i + 1) % pk.length]
    const l = Math.hypot(bx - ax, by - ay)
    r = Math.min(r, Math.abs((bx - ax) * (ay - cy) - (ax - cx) * (by - ay)) / l)
  }
  const k = 1 - inn / r
  return `M${pk.map(([x, y]) => P(cx + (x - cx) * k, cy + (y - cy) * k)).join('L')}Z`
}

/** Kvartsirkel som fyller en rute, med rett vinkel i hjørne h (0 øv, 1 øh, 2 nh, 3 nv). */
function kvart(x: number, y: number, s: number, h: number): string {
  const hj: Pkt[] = [
    [x, y],
    [x + s, y],
    [x + s, y + s],
    [x, y + s],
  ]
  const [p, a, b] = [hj[h], hj[(h + 1) % 4], hj[(h + 3) % 4]]
  return bane().M(...p).L(...a).A(s, ...b).Z().d
}

/** En «dråpe»: kvadrat med tre helt runde hjørner og ett skarpt (h). */
function drape(x: number, y: number, s: number, h: number): string {
  const r = s / 2
  const t = om(x + r, y + r, (h * Math.PI) / 2)
  // Tegnet med skarpt hjørne øverst til venstre, så dreid på plass.
  return bane(t)
    .M(x, y)
    .L(x + r, y)
    .A(r, x + s, y + r)
    .A(r, x + r, y + s)
    .A(r, x, y + r)
    .Z().d
}

/** En linse (vesica) fra a til b, med største bredde w. */
function linse(a: Pkt, b: Pkt, w: number): string {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1])
  const r = (l * l) / 4 / w + w / 4
  return `M${P(...a)}A${n2(r)} ${n2(r)} 0 0 1 ${P(...b)}A${n2(r)} ${n2(r)} 0 0 1 ${P(...a)}Z`
}

/* ------------------------------------------------------------- familiene */

type Resultat = { former: Abstraktform[]; variant: string }
const sti = (d: string, f: F, e?: boolean): Abstraktform => ({ t: 'path', d, f, ...(e ? { e } : {}) })

/** Bauhaus-ruter: fire kvartsirkler eller kvadrater på et 2 × 2-rutenett. */
function kvadrant(r: () => number): Resultat {
  const s = (50 - FUGE) / 2
  const o = 7
  const ruter: Pkt[] = [
    [o, o],
    [o + s + FUGE, o],
    [o, o + s + FUGE],
    [o + s + FUGE, o + s + FUGE],
  ]
  // Hver komposisjon: hva som står i hver rute (hjørne for kvartsirkel, k = kvadrat, o = sirkel).
  const komposisjoner = {
    delt: [2, 3, 1, 0],
    stjerne: [0, 1, 3, 2],
    vindmolle: [1, 2, 0, 3],
    nokkel: [2, 3, 1, 'k'],
    blad: [2, 'k', 'k', 0],
    port: [2, 3, 'k', 'k'],
    prikk: ['o', 3, 1, 'o'],
  } as const
  const variant = velg(r, Object.keys(komposisjoner) as (keyof typeof komposisjoner)[])
  const aksent = Math.floor(r() * 4)
  const dreining = velg(r, [0, 90, 180, 270] as const)
  const former = komposisjoner[variant].map((v, i): Abstraktform => {
    const [x, y] = ruter[i]
    const f: F = i === aksent ? 1 : 0
    if (v === 'k') return { t: 'rect', x, y, w: s, h: s, rx: s * 0.12, f, rot: dreining || undefined }
    if (v === 'o') return { t: 'circle', cx: x + s / 2, cy: y + s / 2, r: s / 2, f, rot: dreining || undefined }
    return { ...sti(kvart(x, y, s, v), f), rot: dreining || undefined }
  })
  return { former, variant }
}

/** En sirkel skåret i skiver – fart, horisont, solnedgang. */
function skive(r: () => number): Resultat {
  const variant = velg(r, ['forskjovet', 'gradert', 'diagonal', 'soloppgang'] as const)
  // Dreid på skrå stikker forskyvningen ut på tvers; da må sirkelen være mindre.
  const R = variant === 'diagonal' ? 23 : 26
  // Skiven er sirkelen klippet til et bånd [y0, y1]: tegnet som linje–bue–linje–bue.
  const band = (y0: number, y1: number, dx: number, f: F, rot?: number): Abstraktform => {
    const xa = (y: number) => Math.sqrt(Math.max(0, R * R - (y - C) ** 2))
    const a = Math.min(Math.max(y0, C - R + 0.2), C + R - 0.2)
    const b = Math.min(Math.max(y1, C - R + 0.2), C + R - 0.2)
    const d = `M${P(C - xa(a) + dx, a)}L${P(C + xa(a) + dx, a)}A${R} ${R} 0 0 1 ${P(C + xa(b) + dx, b)}L${P(C - xa(b) + dx, b)}A${R} ${R} 0 0 1 ${P(C - xa(a) + dx, a)}Z`
    return { ...sti(d, f), rot }
  }
  if (variant === 'gradert') {
    // Skivene vokser nedover: lett øverst, tung nederst.
    const vekt = [1, 1.5, 2.2, 3.1]
    const sum = vekt.reduce((a, b) => a + b, 0)
    const h = (2 * R - FUGE * 3) / sum
    let y = C - R
    return {
      variant,
      former: vekt.map((v, i) => {
        const b = band(y, y + v * h, 0, i === 3 ? 1 : 0)
        y += v * h + FUGE
        return b
      }),
    }
  }
  if (variant === 'soloppgang') {
    // Halv sol over tre bånd som tynnes ut – og fugene vokser.
    const former = [band(C - R, C - 1, 0, 1)]
    const bånd = [
      [C + 2.5, C + 9.5],
      [C + 13.5, C + 18.5],
      [C + 22.5, C + R],
    ]
    for (const [a, b] of bånd) former.push(band(a, b, 0, 0))
    return { variant, former }
  }
  const n = variant === 'diagonal' ? 4 : 3
  const forskyv = variant === 'diagonal' ? 2.5 : velg(r, [4, 5.5] as const)
  const rot = variant === 'diagonal' ? velg(r, [-45, 45] as const) : undefined
  const h = (2 * R - FUGE * (n - 1)) / n
  return {
    variant,
    former: Array.from({ length: n }, (_, i) =>
      band(C - R + i * (h + FUGE), C - R + i * (h + FUGE) + h, (i - (n - 1) / 2) * forskyv, i === n - 1 ? 1 : 0, rot),
    ),
  }
}

/** Former dreid rundt midten – blomst, vifte, propell. */
function rosett(r: () => number): Resultat {
  const variant = velg(r, ['linse', 'drape', 'vifte'] as const)
  const start = grad(velg(r, [-90, -45, -30, 0] as const))
  const former: Abstraktform[] = []
  if (variant === 'linse') {
    const n = velg(r, [4, 6, 8] as const)
    const w = { 4: 15, 6: 10.5, 8: 7.5 }[n]
    for (let i = 0; i < n; i++) {
      const v = start + (i * 2 * Math.PI) / n
      former.push(sti(linse(polar(C, C, 3, v), polar(C, C, 27, v), w), i === 0 ? 1 : 0))
    }
  } else if (variant === 'drape') {
    // Dråper med den runde enden ut og spissen mot midten.
    const n = velg(r, [5, 6] as const)
    const rc = 18.5
    const rr = n === 5 ? 8 : 7
    const D = rc - 2.5
    const b = Math.asin(rr / D)
    for (let i = 0; i < n; i++) {
      const v = start + (i * 2 * Math.PI) / n
      const t = om(C, C, v)
      const d = bane((p) => t([C + p[0], C + p[1]]))
        .M(2.5, 0)
        .L(rc - rr * Math.sin(b), -rr * Math.cos(b))
        .A(rr, rc - rr * Math.sin(b), rr * Math.cos(b), 1, 1)
        .Z().d
      former.push(sti(d, i === 0 ? 1 : 0))
    }
  } else {
    // Fire halvsirkler med diameteren langs en radius – en vifte.
    for (let i = 0; i < 4; i++) {
      const v = start + (i * Math.PI) / 2
      const a = polar(C, C, 3, v)
      const b = polar(C, C, 26, v)
      const d = bane().M(...a).A(11.5, ...b, 0, 0).Z().d
      former.push(sti(d, i === 0 ? 1 : 0))
    }
  }
  return { variant, former }
}

/** Fasetter: flater som leser som et lite objekt i rommet. */
function fasettfamilie(r: () => number): Resultat {
  const variant = velg(r, ['kube', 'sekskant', 'diamant'] as const)
  const R = 27
  const hj = (i: number, v0 = -90) => polar(C, C, R, grad(v0 + i * 60))
  if (variant === 'kube') {
    const m: Pkt = [C, C]
    const [t, th, nh, b, nv, tv] = [0, 1, 2, 3, 4, 5].map((i) => hj(i))
    const flater: [Pkt[], F][] = [
      [[t, th, m, tv], 1],
      [[tv, m, b, nv], 0],
      [[m, th, nh, b], 2],
    ]
    return { variant, former: flater.map(([pk, f]) => sti(fasett(pk, FUGE / 2), f)) }
  }
  if (variant === 'sekskant') {
    const aksent = Math.floor(r() * 6)
    return {
      variant,
      former: [0, 1, 2, 3, 4, 5].map((i) => sti(fasett([[C, C], hj(i, -60), hj(i + 1, -60)], FUGE / 2), i === aksent ? 1 : 0)),
    }
  }
  // Et kvadrat på spissen, delt i fire.
  const h = 26
  const ruter: Pkt[][] = [
    [
      [C, C - h],
      [C + h / 2, C - h / 2],
      [C, C],
      [C - h / 2, C - h / 2],
    ],
    [
      [C + h / 2, C - h / 2],
      [C + h, C],
      [C + h / 2, C + h / 2],
      [C, C],
    ],
    [
      [C, C],
      [C + h / 2, C + h / 2],
      [C, C + h],
      [C - h / 2, C + h / 2],
    ],
    [
      [C - h / 2, C - h / 2],
      [C, C],
      [C - h / 2, C + h / 2],
      [C - h, C],
    ],
  ]
  const aksent = Math.floor(r() * 4)
  return { variant, former: ruter.map((q, i) => sti(fasett(q, FUGE / 2), i === aksent ? 1 : 0)) }
}

/** Tykke buer: bevegelse, bane, ledd. */
function buefamilie(r: () => number): Resultat {
  const variant = velg(r, ['sveip', 'bane', 'lenke'] as const)
  if (variant === 'sveip') {
    // Ringsegmenter med økende dreining – et bevegelsesspor.
    const spenn = velg(r, [1, 1.25] as const) * Math.PI
    const dreining = velg(r, [0.45, 0.65] as const)
    const b = 7
    return {
      variant,
      former: [0, 1, 2].map((i) => {
        const ry = 27 - i * (b + FUGE)
        const a0 = -Math.PI / 2 + i * dreining
        return sti(bue(C, C, ry - b, ry, a0, a0 + spenn), i === 0 ? 1 : 0)
      }),
    }
  }
  if (variant === 'bane') {
    // En tykk ring med en åpning, og en klode i åpningen.
    const v = grad(velg(r, [-45, -135, 45] as const))
    const apning = grad(40)
    const [kx, ky] = polar(C, C, 19, v)
    return {
      variant,
      former: [sti(bue(C, C, 13.5, 26, v + apning, v - apning + 2 * Math.PI), 0), { t: 'circle', cx: n2(kx), cy: n2(ky), r: 8, f: 1 }],
    }
  }
  // To ledd i hverandre: hver ring brytes der den går under den andre.
  const d = 8.5
  const Rm = 15
  const b = 6.5
  const kryss = Math.atan2(Math.sqrt(Rm * Rm - d * d), d)
  const vindu = (b / 2 + FUGE) / Rm / Math.sin(2 * Math.atan(d / Math.sqrt(Rm * Rm - d * d))) + 0.04
  return {
    variant,
    former: [
      sti(bue(C - d, C, Rm - b / 2, Rm + b / 2, kryss + vindu, kryss - vindu + 2 * Math.PI), 0),
      sti(bue(C + d, C, Rm - b / 2, Rm + b / 2, -Math.PI + kryss + vindu, -Math.PI + kryss - vindu + 2 * Math.PI), 1),
    ],
  }
}

/** Hele former med negativt rom: dråper, blad, en sol over en kolle. */
function form(r: () => number): Resultat {
  const variant = velg(r, ['drapepar', 'blad', 'kolle'] as const)
  if (variant === 'drapepar') {
    const s = (50 - FUGE) / 2
    const o = 7
    const speil = r() < 0.5
    return {
      variant,
      former: speil
        ? [sti(drape(o + s + FUGE, o, s, 3), 0), sti(drape(o, o + s + FUGE, s, 1), 1)]
        : [sti(drape(o, o, s, 2), 0), sti(drape(o + s + FUGE, o + s + FUGE, s, 0), 1)],
    }
  }
  if (variant === 'blad') {
    // Et blad på skrå, delt langs nerven.
    const t = om(C, C, grad(velg(r, [-45, 45] as const)))
    const l = 54
    const w = 30
    const R = (l * l) / 4 / w + w / 4
    const h = FUGE / 2
    // Halvdelene er linsen klippet langs aksen, flyttet en halv fuge ut.
    const halv = (side: 1 | -1) =>
      bane((p) => t([p[0], p[1] + side * h]))
        .M(C - l / 2 + 2, C)
        .A(R, C + l / 2 - 2, C, 0, side === 1 ? 0 : 1)
        .Z().d
    return { variant, former: [sti(halv(-1), 0), sti(halv(1), 1)] }
  }
  // En stor kvartsirkel – en kolle – med en sol i hjørnet over.
  const speil = r() < 0.5
  const t = (p: Pkt): Pkt => (speil ? [64 - p[0], p[1]] : p)
  const [sx, sy] = t([46.5, 17.5])
  return {
    variant,
    former: [
      // Speilingen snur buen, så retningen byttes med den.
      sti(bane(t).M(9, 56).L(49, 56).A(40, 9, 16, 0, speil ? 1 : 0).Z().d, 0),
      { t: 'circle', cx: sx, cy: sy, r: 8, f: 1 },
    ],
  }
}

const FAMILIEFUNKSJON: Record<AbstraktFamilie, (r: () => number) => Resultat> = {
  kvadrant,
  skive,
  rosett,
  fasett: fasettfamilie,
  bue: buefamilie,
  form,
}

/** Merket, med signaturen som brukes til å fjerne nesten-like i en serie. */
export function lagAbstraktMedSignatur({ fro, familie }: Abstrakt): { former: Abstraktform[]; signatur: string } {
  const { former, variant } = FAMILIEFUNKSJON[familie](rng(fro))
  return { former, signatur: `${familie}-${variant}` }
}

export const lagAbstrakt = (a: Abstrakt) => lagAbstraktMedSignatur(a).former

/**
 * Tolv ulike merker fra ett startfrø. Familiene går på rad, så de første seks
 * er seks ulike familier; deretter kommer en annen komposisjon fra de samme.
 * Signaturen er familie + komposisjon – to merker med samme oppbygning,
 * bare dreid eller med aksenten et annet sted, står aldri i samme serie.
 */
export function abstraktSerie(start: number, antall = 12): Abstrakt[] {
  const sett = new Set<string>()
  const ut: Abstrakt[] = []
  const n = FAMILIER_ABSTRAKT.length
  for (let k = 0; ut.length < antall && k < antall * 40; k++) {
    const a: Abstrakt = {
      fro: start * 1009 + k * 13 + 1,
      familie: FAMILIER_ABSTRAKT[(ut.length + start) % n],
    }
    const { signatur } = lagAbstraktMedSignatur(a)
    if (sett.has(signatur)) continue
    sett.add(signatur)
    ut.push(a)
  }
  return ut
}

export function rensAbstrakt(o: unknown): Abstrakt | undefined {
  if (!o || typeof o !== 'object') return undefined
  const x = o as Partial<Abstrakt>
  if (typeof x.fro !== 'number' || !FAMILIER_ABSTRAKT.includes(x.familie as AbstraktFamilie)) return undefined
  return { fro: Math.floor(x.fro), familie: x.familie as AbstraktFamilie }
}

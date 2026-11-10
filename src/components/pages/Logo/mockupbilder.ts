import type { Variant } from './LogoSvg'
import { lerretTilBlob } from './binaer'
import type { Fotomal, Materiale } from './fotomaler'
import type { Design } from './motor'

/**
 * Fotomalene som ferdige bilder – til profilboka og til mappen med
 * mockups i pakken.
 *
 * På skjermen bygges mockupen av lag i CSS (Fotomockup.tsx). Et bilde i en
 * fil må tegnes på canvas, og canvas kan ikke perspektiv: en 2D-matrise
 * gjør bare parallellogrammer. Derfor legges logoen på flaten piksel for
 * piksel her, med den samme homografien CSS-en bruker – hvert målpunkt
 * slås opp baklengs i den flate logoen. Resten er de samme lagene som på
 * skjermen: blanding etter materiale, skygge, høylys.
 *
 * Bildene tegnes større enn basefotoet, så logoen står skarpt selv om
 * fotoet under er mykt. Ingen vannmerke – det er kundens filer.
 */

/**
 * Hvordan logoen oppfører seg på hvert materiale. Samme tall som MATERIALER
 * i Fotomockup.tsx – endres de der, bør de endres her.
 */
const MATERIALER: Record<Materiale, { blanding: 'multiply' | 'normal'; dekning: number; mykhet: number; lys: number; glod?: boolean }> = {
  papir: { blanding: 'multiply', dekning: 0.96, mykhet: 0.3, lys: 0.12 },
  stoff: { blanding: 'multiply', dekning: 0.88, mykhet: 0.8, lys: 0.08 },
  keramikk: { blanding: 'multiply', dekning: 0.94, mykhet: 0.6, lys: 0.35 },
  lakk: { blanding: 'multiply', dekning: 0.97, mykhet: 0.25, lys: 0.4 },
  folie: { blanding: 'normal', dekning: 0.95, mykhet: 0.2, lys: 0.5 },
  glass: { blanding: 'normal', dekning: 0.82, mykhet: 0.6, lys: 0.45 },
  akryl: { blanding: 'normal', dekning: 1, mykhet: 0.12, lys: 0.12, glod: true },
}

/** Varianten malen skal ha – samme valg som Fotomockup gjør. */
export function mockupVariant(mal: Fotomal): Variant {
  return mal.variant === 'auto' ? ((mal.lyshet ?? 0.85) > 0.5 ? 'positiv' : 'hvit') : mal.variant
}

/** Designet slik det står på malen: uten slagord, i malens oppsett. */
export function mockupDesign(mal: Fotomal, design: Design): { design: Design; kunMerke: boolean } {
  return { design: { ...design, slagord: false, oppsett: mal.oppsett ?? design.oppsett }, kunMerke: mal.oppsett === 'kun-merke' }
}

/** Homografien som flytter firkanten `fra` til `til`, som 3×3-matrise (rad for rad). */
function homografi(fra: number[], til: number[]): number[] {
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const [x, y, u, v] = [fra[i * 2], fra[i * 2 + 1], til[i * 2], til[i * 2 + 1]]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  for (let k = 0; k < 8; k++) {
    let maks = k
    for (let r = k + 1; r < 8; r++) if (Math.abs(A[r][k]) > Math.abs(A[maks][k])) maks = r
    ;[A[k], A[maks]] = [A[maks], A[k]]
    for (let r = 0; r < 8; r++) {
      if (r === k) continue
      const f = A[r][k] / A[k][k]
      for (let c = k; c < 9; c++) A[r][c] -= f * A[k][c]
    }
  }
  return [...A.map((rad, i) => rad[8] / rad[i]), 1]
}

async function bilde(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  return img
}

function lerret(b: number, h: number) {
  const c = document.createElement('canvas')
  c.width = b
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { c, ctx }
}

/**
 * Quad-en logoen legges i. På en sylinder (koppen) er quad-en den
 * utbrettede flaten – et rektangel om aksen, like bredt som toppen – og
 * bøyingen gjør resten. Som i Fotomockup.tsx.
 */
function flateQuad(mal: Fotomal): [number, number][] {
  const b = mal.boying
  if (b?.type !== 'sylinder') return mal.quad.map(([x, y]) => [x, y])
  const halv = Math.abs(mal.quad[1][0] - mal.quad[0][0]) / 2
  const [yt, yb] = [mal.quad[0][1], mal.quad[3][1]]
  return [
    [b.aksen - halv, yt],
    [b.aksen + halv, yt],
    [b.aksen + halv, yb],
    [b.aksen - halv, yb],
  ]
}

/**
 * Forskyvningen trykket får av en buet flate, i basefotoets piksler: for
 * hvert punkt (x, y), hvor i den flate logoen hentes fargen fra – lagt til
 * punktet. Samme regning som kartet Fotomockup.tsx gir `feDisplacementMap`,
 * med samme grense (± skala/2), men regnet ut eksakt i stedet for lest fra
 * et 8-biters kart i halv oppløsning.
 */
async function lagForskyvning(mal: Fotomal): Promise<((x: number, y: number) => [number, number]) | null> {
  const b = mal.boying
  if (!b) return null
  if (b.type === 'sylinder') {
    const skala = 160
    const grense = skala / 2
    const [y0, r0] = b.topp
    const [y1, r1] = b.bunn
    const R = (y: number) => r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    const ys = mal.quad.map((q) => q[1])
    const yt = Math.min(...ys)
    const yb = Math.max(...ys)
    const Rref = R((yt + yb) / 2)
    const klem = (v: number) => Math.max(-grense, Math.min(grense, v))
    return (x, y) => {
      const r = R(y)
      const u = (x - b.aksen) / r
      if (Math.abs(u) >= 0.98) return [0, 0]
      const t = Math.min(1, Math.max(0, (y - yt) / (yb - yt || 1)))
      const e = b.ellipse[0] + t * (b.ellipse[1] - b.ellipse[0])
      const th = Math.asin(u)
      return [klem(b.aksen + Rref * th - x), klem(e * r * (1 - Math.cos(th)))]
    }
  }
  // Stoff: fotoets lyshet, kraftig utglattet, som høydekart – nøyaktig som
  // kartet på skjermen (halv oppløsning, ned til en tidel og opp igjen).
  const skala = b.styrke * 2
  const W = Math.round(mal.bredde / 2)
  const H = Math.round(mal.hoyde / 2)
  const img = await bilde(mal.base)
  const liten = lerret(Math.max(1, Math.round(W / 10)), Math.max(1, Math.round(H / 10)))
  liten.ctx.drawImage(img, 0, 0, liten.c.width, liten.c.height)
  const stor = lerret(W, H)
  stor.ctx.drawImage(liten.c, 0, 0, W, H)
  const inn = stor.ctx.getImageData(0, 0, W, H).data
  const lum = (i: number, j: number) => {
    const k = (Math.min(H - 1, Math.max(0, j)) * W + Math.min(W - 1, Math.max(0, i))) * 4
    return 0.3 * inn[k] + 0.59 * inn[k + 1] + 0.11 * inn[k + 2]
  }
  const xs = mal.quad.map((q) => q[0] / 2)
  const ys = mal.quad.map((q) => q[1] / 2)
  let sum = 0
  let n = 0
  for (let j = Math.floor(Math.min(...ys)); j < Math.max(...ys); j++)
    for (let i = Math.floor(Math.min(...xs)); i < Math.max(...xs); i++) {
      sum += lum(i, j)
      n++
    }
  const snitt = n ? sum / n : 128
  return (x, y) => {
    // Bilineært i kartet, som feImage som skaleres opp.
    const fx = x / 2
    const fy = y / 2
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const a = fx - i
    const c = fy - j
    const l = (1 - a) * (1 - c) * lum(i, j) + a * (1 - c) * lum(i + 1, j) + (1 - a) * c * lum(i, j + 1) + a * c * lum(i + 1, j + 1)
    const v = Math.max(0, Math.min(255, 128 + (l - snitt) * 2.2))
    const d = ((v - 128) / 255) * skala
    return [d, d]
  }
}

/**
 * Tegn malen med logoen på. `logoSvg` er logoen i malens variant, med tekst
 * som baner. `langside` er bildets lengste side i piksler.
 *
 * Lagene er de samme som på skjermen: logoen i perspektiv (og bøyd, på kopp
 * og stoff), myknet etter materialet, med fotoets høylys lagt over selve
 * trykket (bare det lyseste, over terskelen), blandet ned i fotoet og
 * klippet til flaten.
 */
export async function tegnMockup(mal: Fotomal, logoSvg: string, langside = 2400): Promise<HTMLCanvasElement> {
  const m = MATERIALER[mal.materiale]
  const S = langside / Math.max(mal.bredde, mal.hoyde)
  const W = Math.round(mal.bredde * S)
  const H = Math.round(mal.hoyde * S)
  const { c, ctx } = lerret(W, H)
  const base = await bilde(mal.base)
  ctx.drawImage(base, 0, 0, W, H)
  const foto = ctx.getImageData(0, 0, W, H).data

  // Den flate logoen, omtrent i den størrelsen den får på bildet – så
  // oppslaget under verken må forstørre eller hoppe over piksler.
  const quad = flateQuad(mal).map(([x, y]) => [x * S, y * S] as const)
  const kant = Math.max(...quad.map(([x, y], i) => Math.hypot(quad[(i + 1) % 4][0] - x, quad[(i + 1) % 4][1] - y)))
  const FB = Math.max(64, Math.ceil(kant * 1.25))
  const FH = Math.max(32, Math.round((FB * mal.flate.hoyde) / mal.flate.bredde))
  const [luftB, luftH] = mal.luft ?? [0.8, 0.8]
  const vb = (logoSvg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100').split(/[\s,]+/).map(Number)
  const s = Math.min((FB * luftB) / vb[2], (FH * luftH) / vb[3])
  const lw = Math.max(1, Math.round(vb[2] * s))
  const lh = Math.max(1, Math.round(vb[3] * s))
  const sized = logoSvg
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, '$1')
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, '$1')
    .replace('<svg', `<svg width="${lw}" height="${lh}"`)
  const logo = await bilde('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized))
  const flat = lerret(FB, FH)
  // Mykheten før perspektivet, som på skjermen (blur på den flate logoen).
  if ('filter' in flat.ctx) flat.ctx.filter = `blur(${(m.mykhet * FB) / 1000}px)`
  flat.ctx.drawImage(logo, Math.round((FB - lw) / 2), Math.round((FH - lh) / 2), lw, lh)
  const kilde = flat.ctx.getImageData(0, 0, FB, FH).data
  const forskyv = await lagForskyvning(mal)

  // Baklengs oppslag: for hvert punkt på bildet, hvor i den flate logoen?
  // Først bøyingen (i fotoets piksler), så perspektivet.
  const h = homografi(quad.flat(), [0, 0, FB, 0, FB, FH, 0, FH])
  const polygon = (Array.isArray(mal.maske) ? mal.maske : mal.quad).map(([x, y]) => [x * S, y * S] as const)
  const alleX = [...quad, ...polygon].map((q) => q[0])
  const alleY = [...quad, ...polygon].map((q) => q[1])
  const marg = forskyv ? 90 * S : 2
  const x0 = Math.max(0, Math.floor(Math.min(...alleX) - marg))
  const x1 = Math.min(W, Math.ceil(Math.max(...alleX) + marg))
  const y0 = Math.max(0, Math.floor(Math.min(...alleY) - marg))
  const y1 = Math.min(H, Math.ceil(Math.max(...alleY) + marg))
  const lag = lerret(W, H)
  const ut = lag.ctx.createImageData(x1 - x0, y1 - y0)
  const d = ut.data
  const px = (x: number, y: number, k: number) => kilde[(y * FB + x) * 4 + k]
  // Høylyset: bare det lyseste i fotoet slipper gjennom, lagt på trykket med «screen».
  const terskel = 0.62
  const kLys = m.lys / (1 - terskel)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let X = x + 0.5
      let Y = y + 0.5
      if (forskyv) {
        const [dx, dy] = forskyv(X / S, Y / S)
        X += dx * S
        Y += dy * S
      }
      const w = h[6] * X + h[7] * Y + h[8]
      const u = (h[0] * X + h[1] * Y + h[2]) / w - 0.5
      const v = (h[3] * X + h[4] * Y + h[5]) / w - 0.5
      if (u < -1 || v < -1 || u > FB || v > FH) continue
      const ux = Math.floor(u)
      const vy = Math.floor(v)
      const fu = u - ux
      const fv = v - vy
      // Bilineært, med forhåndsmultiplisert alfa – ellers får kantene en mørk rand.
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (const [dx, dy, vekt] of [
        [0, 0, (1 - fu) * (1 - fv)],
        [1, 0, fu * (1 - fv)],
        [0, 1, (1 - fu) * fv],
        [1, 1, fu * fv],
      ] as const) {
        const sx = ux + dx
        const sy = vy + dy
        if (sx < 0 || sy < 0 || sx >= FB || sy >= FH || vekt === 0) continue
        const al = (px(sx, sy, 3) / 255) * vekt
        r += px(sx, sy, 0) * al
        g += px(sx, sy, 1) * al
        b += px(sx, sy, 2) * al
        a += al
      }
      if (a <= 0) continue
      const fk = (y * W + x) * 4
      const glans = Math.max(0, Math.min(1, (kLys * (0.3 * foto[fk] + 0.59 * foto[fk + 1] + 0.11 * foto[fk + 2])) / 255 - terskel * kLys))
      const skjerm = (k: number) => 255 - ((255 - k) * (1 - glans))
      const o = ((y - y0) * (x1 - x0) + (x - x0)) * 4
      d[o] = skjerm(r / a)
      d[o + 1] = skjerm(g / a)
      d[o + 2] = skjerm(b / a)
      d[o + 3] = a * 255 * m.dekning
    }
  }
  lag.ctx.putImageData(ut, x0, y0)

  // Klipp til masken (polygon eller bilde) – eller flaten selv.
  if (typeof mal.maske === 'string') {
    const maske = await bilde(mal.maske)
    lag.ctx.globalCompositeOperation = 'destination-in'
    lag.ctx.drawImage(maske, 0, 0, W, H)
  }
  const klipp = () => {
    ctx.beginPath()
    polygon.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.clip()
  }
  const filter = 'filter' in ctx

  ctx.save()
  if (typeof mal.maske !== 'string') klipp()
  if (m.glod && filter) {
    ctx.filter = `blur(${2 * S}px)`
    ctx.globalAlpha = 0.25
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(lag.c, 0, 0)
    ctx.filter = 'none'
    ctx.globalAlpha = 1
  }
  ctx.globalCompositeOperation = m.blanding === 'multiply' ? 'multiply' : 'source-over'
  ctx.drawImage(lag.c, 0, 0)
  ctx.restore()

  if (mal.skygge) {
    const skygge = await bilde(mal.skygge)
    ctx.save()
    klipp()
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(skygge, 0, 0, W, H)
    ctx.restore()
  }
  return c
}

/**
 * Et utsnitt med sideforholdet `forhold` (b/h), lagt rundt malens `utsnitt`
 * – den delen av fotoet som skal vises når bildet må beskjæres – og ellers
 * rundt midten. Til cellene i profilboka.
 */
export function beskjaer(mal: Fotomal, c: HTMLCanvasElement, forhold: number): HTMLCanvasElement {
  const S = c.width / mal.bredde
  const [ux, uy, ub, uh] = (mal.utsnitt ?? [0, 0, mal.bredde, mal.hoyde]).map((v) => v * S)
  // Så stort som mulig, men med hele utsnittet med når det går.
  let b = Math.min(c.width, c.height * forhold)
  let h = b / forhold
  if (b < ub || h < uh) {
    b = Math.min(c.width, Math.max(ub, uh * forhold))
    h = b / forhold
  }
  const x = Math.min(c.width - b, Math.max(0, ux + ub / 2 - b / 2))
  const y = Math.min(c.height - h, Math.max(0, uy + uh / 2 - h / 2))
  const ut = lerret(Math.round(b), Math.round(h))
  ut.ctx.drawImage(c, x, y, b, h, 0, 0, ut.c.width, ut.c.height)
  return ut.c
}

export async function mockupJpg(mal: Fotomal, logoSvg: string, langside = 2400, kvalitet = 0.9): Promise<Blob> {
  return lerretTilBlob(await tegnMockup(mal, logoSvg, langside), 'image/jpeg', kvalitet)
}

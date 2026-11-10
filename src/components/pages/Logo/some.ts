import { FONTER, TEKSTFONT, type FontId } from './merker'
import { filnavn, finnPalett, finnSkrift, visningsnavn, type Design, type Innhold } from './motor'
import { innmat, logoSvg, medPngMetadata, paFlate, raster, tekstbane, type Metadata } from './eksport'
import { tall } from './rentsvg'

/**
 * Bilder til sosiale medier, i kundens profil.
 *
 * To slags bilder:
 *
 *   – Profilsettet: profilbilde, forsidebilde og banner. Bare logoen, i de
 *     målene hver tjeneste vil ha – noe kunden setter opp én gang.
 *   – Innlegg og story: tre maler med kundens egen tekst. Det er disse som
 *     brukes hver uke, og som gjør at en liten bedrift ser like ryddig ut i
 *     feeden som en stor.
 *
 * Alt tegnes som SVG med teksten som baner (samme tekstbane som logofilene),
 * så forhåndsvisningen er nøyaktig det som lastes ned – også skriften.
 */

export interface Format {
  id: string
  navn: string
  /** Hvor det brukes, kort. */
  hvor: string
  b: number
  h: number
}

export const PROFILSETT: readonly Format[] = [
  { id: 'profilbilde', navn: 'Profilbilde', hvor: 'Alle tjenester', b: 1080, h: 1080 },
  { id: 'facebook-forside', navn: 'Forsidebilde', hvor: 'Facebook', b: 1640, h: 624 },
  { id: 'linkedin-banner', navn: 'Banner', hvor: 'LinkedIn', b: 1584, h: 396 },
]

export const INNLEGGSFORMATER: readonly Format[] = [
  { id: 'innlegg', navn: 'Innlegg', hvor: 'Instagram, Facebook, LinkedIn', b: 1080, h: 1350 },
  { id: 'story', navn: 'Story', hvor: 'Instagram, Facebook', b: 1080, h: 1920 },
]

export type MalId = 'flate' | 'lys' | 'sitat'

export const MALER: readonly { id: MalId; navn: string }[] = [
  { id: 'flate', navn: 'Farge' },
  { id: 'lys', navn: 'Lys' },
  { id: 'sitat', navn: 'Sitat' },
]

export interface Innleggstekst {
  overskrift: string
  tekst: string
}

/** Forslag kunden kan starte fra. Teksten kan alltid skrives om. */
export const FORSLAG: readonly ({ navn: string; mal: MalId } & Innleggstekst)[] = [
  { navn: 'Nyhet', mal: 'flate', overskrift: 'Nå åpner vi dørene', tekst: 'Velkommen innom – vi gleder oss til å hilse på deg.' },
  { navn: 'Tilbud', mal: 'flate', overskrift: '20 % på alt i hele mai', tekst: 'Gjelder ut måneden. Bestill på nettsiden vår.' },
  { navn: 'Vi ansetter', mal: 'lys', overskrift: 'Vi søker en ny kollega', tekst: 'Fast stilling. Send en kort søknad innen 1. juni.' },
  { navn: 'Kundeomtale', mal: 'sitat', overskrift: 'Raskt, ryddig og akkurat som avtalt.', tekst: 'Kari, fornøyd kunde' },
  { navn: 'Åpningstider', mal: 'lys', overskrift: 'Nye åpningstider', tekst: 'Mandag–fredag 8–17. Lørdag 10–14.' },
]

export const MAKS_TEKST = { overskrift: 90, tekst: 140 } as const

/* -------------------------------------------------------------- tekst */

const lerret = (() => {
  let c: CanvasRenderingContext2D | null = null
  return () => (c ??= document.createElement('canvas').getContext('2d')!)
})()

/**
 * Del teksten i linjer som får plass i `bredde`. Linjeskift kunden har
 * skrevet selv, beholdes. Et ord som er bredere enn linja, får stå alene –
 * da krymper `settTekst` graden i stedet.
 */
function brytt(tekst: string, font: string, bredde: number): string[] {
  const ctx = lerret()
  ctx.font = font
  const linjer: string[] = []
  for (const avsnitt of tekst.split('\n')) {
    let linje = ''
    for (const ord of avsnitt.split(/\s+/).filter(Boolean)) {
      const prov = linje ? `${linje} ${ord}` : ord
      if (linje && ctx.measureText(prov).width > bredde) {
        linjer.push(linje)
        linje = ord
      } else linje = prov
    }
    if (linje) linjer.push(linje)
  }
  return linjer
}

interface Tekstblokk {
  /** SVG-baner, klare til å legges inn. */
  d: string
  hoyde: number
}

/**
 * Tekst satt i en blokk: brutt i linjer, og krympet til den holder seg
 * innenfor `maksLinjer`. `y` er toppen av blokken.
 */
async function settTekst(
  tekst: string,
  { font, vekt, grad, minGrad, bredde, maksLinjer, linjeavstand, x, y, versaler = false }: {
    font: FontId
    vekt: number
    grad: number
    minGrad: number
    bredde: number
    maksLinjer: number
    linjeavstand: number
    x: number
    y: number
    versaler?: boolean
  },
): Promise<Tekstblokk> {
  const t = (versaler ? tekst.toLocaleUpperCase('nb-NO') : tekst).trim()
  if (!t) return { d: '', hoyde: 0 }
  const familie = FONTER[font].familie
  let g = grad
  let linjer: string[] = []
  for (;;) {
    const fontstreng = `${vekt} ${g}px '${familie}'`
    await document.fonts?.load(fontstreng, t)
    linjer = brytt(t, fontstreng, bredde)
    const ctx = lerret()
    ctx.font = fontstreng
    const forBred = linjer.some((l) => ctx.measureText(l).width > bredde)
    if ((linjer.length <= maksLinjer && !forBred) || g <= minGrad) break
    g = Math.max(minGrad, Math.round(g * 0.92))
  }
  linjer = linjer.slice(0, maksLinjer)
  const steg = g * linjeavstand
  // Grunnlinja ligger omtrent 0,8 grad under toppen av versalene.
  const baner = await Promise.all(
    linjer.map((l, i) => tekstbane(l, familie, vekt, g, x, y + g * 0.8 + i * steg, 0, 'start')),
  )
  return { d: baner.filter(Boolean).join(''), hoyde: g * 0.8 + (linjer.length - 1) * steg + g * 0.22 }
}

/**
 * En SVG (logoen) skalert inn i en boks. `x` er venstre kant (eller høyre,
 * med `feste`), `y` toppen – eller bunnen, med `fraBunn`.
 */
function plasser(
  svg: string,
  x: number,
  y: number,
  maksB: number,
  maksH: number,
  { feste = 'venstre', fraBunn = false }: { feste?: 'venstre' | 'hoyre'; fraBunn?: boolean } = {},
) {
  const { vb, indre } = innmat(svg)
  const s = Math.min(maksB / vb[2], maksH / vb[3])
  const tx = feste === 'hoyre' ? x - vb[2] * s : x
  const ty = fraBunn ? y - vb[3] * s : y
  return `<g transform="translate(${tall(tx)} ${tall(ty)}) scale(${+s.toFixed(5)}) translate(${-vb[0]} ${-vb[1]})">${indre}</g>`
}

const omslutt = (b: number, h: number, indre: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${b}" height="${h}" viewBox="0 0 ${b} ${h}">${indre}</svg>`

/* ------------------------------------------------------------- bildene */

/** Profilsettet: logoen alene, i målene tjenesten vil ha. */
export async function profilbilde(design: Design, innhold: Innhold, f: Format): Promise<string> {
  const p = finnPalett(design.palett)
  if (f.id === 'profilbilde') {
    // Symbolet, hvitt på primærfargen. Navnet blir uleselig i en liten sirkel.
    const merke = await logoSvg({ ...design, beholder: 'ingen' }, innhold, 'hvit', true)
    return paFlate(merke, f.b, f.h, p.primaer, 0.52)
  }
  const negativ = await logoSvg({ ...design, slagord: false }, innhold, 'negativ')
  // Forsidebildene beskjæres ulikt på mobil og PC; logoen holdes i midten.
  return paFlate(negativ, f.b, f.h, p.primaer, f.id === 'linkedin-banner' ? 0.36 : 0.4)
}

/** Et innlegg eller en story med kundens tekst, i én av malene. */
export async function innlegg(
  design: Design,
  innhold: Innhold,
  f: Format,
  mal: MalId,
  tekst: Innleggstekst,
): Promise<string> {
  const p = finnPalett(design.palett)
  const s = finnSkrift(design.skrift)
  const { b, h } = f
  const story = h / b > 1.5
  const m = Math.round(b * 0.09)
  // I en story dekker profilbildet og knappene toppen og bunnen.
  const topp = story ? Math.round(h * 0.11) : m
  const bunn = h - (story ? Math.round(h * 0.12) : m)
  const bredde = b - m * 2
  const navn = visningsnavn(innhold.navn, s, design.bokstaver)
  const overskrift = { font: s.font, vekt: s.vekt, versaler: s.versaler, bredde, x: m, linjeavstand: 1.1 }
  const brod = { font: TEKSTFONT, vekt: 500, bredde: bredde * 0.92, x: m, linjeavstand: 1.4, maksLinjer: 4 }

  if (mal === 'flate') {
    const merke = await logoSvg({ ...design, beholder: 'ingen' }, innhold, 'hvit', true)
    const symbol = plasser(merke, m, topp, b * 0.12, b * 0.12)
    const fotGrad = Math.round(b * 0.026)
    const fot = await settTekst(navn, { font: TEKSTFONT, vekt: 600, grad: fotGrad, minGrad: fotGrad, bredde, maksLinjer: 1, linjeavstand: 1, x: m, y: bunn - fotGrad })
    // Stablet nedenfra: fot, så brødtekst, så overskrift.
    const under = await settTekst(tekst.tekst, { ...brod, grad: Math.round(b * 0.036), minGrad: Math.round(b * 0.028), y: 0 })
    const underY = bunn - fotGrad - b * 0.07 - under.hoyde
    const over = await settTekst(tekst.overskrift, { ...overskrift, grad: Math.round(b * (story ? 0.12 : 0.1)), minGrad: Math.round(b * 0.055), maksLinjer: story ? 6 : 4, y: 0 })
    const overY = (under.d ? underY - b * 0.035 : bunn - fotGrad - b * 0.07) - over.hoyde
    return omslutt(
      b,
      h,
      `<rect width="${b}" height="${h}" fill="${p.primaer}"/>${symbol}` +
        `<path d="${over.d}" fill="#FFFFFF" transform="translate(0 ${tall(overY)})"/>` +
        `<path d="${under.d}" fill="#FFFFFF" fill-opacity="0.82" transform="translate(0 ${tall(underY)})"/>` +
        `<path d="${fot.d}" fill="#FFFFFF" fill-opacity="0.7"/>`,
    )
  }

  if (mal === 'lys') {
    const logo = await logoSvg({ ...design, slagord: false }, innhold, 'positiv')
    const fast = plasser(logo, m, bunn, b * 0.42, b * 0.085, { fraBunn: true })
    const strek = `<rect x="${m}" y="${topp}" width="${Math.round(b * 0.09)}" height="${Math.round(b * 0.012)}" rx="${Math.round(b * 0.006)}" fill="${p.aksent}"/>`
    const over = await settTekst(tekst.overskrift, { ...overskrift, grad: Math.round(b * (story ? 0.12 : 0.11)), minGrad: Math.round(b * 0.055), maksLinjer: story ? 7 : 5, y: topp + b * 0.075 })
    const under = await settTekst(tekst.tekst, { ...brod, grad: Math.round(b * 0.036), minGrad: Math.round(b * 0.028), y: topp + b * 0.075 + over.hoyde + b * 0.04 })
    return omslutt(
      b,
      h,
      `<rect width="${b}" height="${h}" fill="${p.lys}"/>${strek}` +
        `<path d="${over.d}" fill="${p.mork}"/>` +
        `<path d="${under.d}" fill="${p.mork}" fill-opacity="0.72"/>` +
        fast,
    )
  }

  // Sitat: store anførselstegn i aksentfargen, sitatet i logoskriften.
  const logo = await logoSvg({ ...design, slagord: false }, innhold, 'positiv')
  const fast = plasser(logo, b - m, bunn, b * 0.34, b * 0.07, { feste: 'hoyre', fraBunn: true })
  // Sitatet står midt mellom toppen og logoen – det er det eneste på flaten.
  const tegnGrad = Math.round(b * 0.3)
  const sitatGrad = Math.round(b * (story ? 0.09 : 0.08))
  const sitatValg = { ...overskrift, versaler: false, grad: sitatGrad, minGrad: Math.round(b * 0.048), maksLinjer: story ? 8 : 6 }
  const hvemValg = { ...brod, vekt: 600, grad: Math.round(b * 0.034), minGrad: Math.round(b * 0.028), maksLinjer: 2 }
  const hvemTekst = tekst.tekst.trim() ? `— ${tekst.tekst.trim()}` : ''
  // Første runde måler, andre plasserer.
  const mal1 = await settTekst(tekst.overskrift, { ...sitatValg, y: 0 })
  const mal2 = await settTekst(hvemTekst, { ...hvemValg, y: 0 })
  const blokk = tegnGrad * 0.5 + mal1.hoyde + (mal2.d ? b * 0.05 + mal2.hoyde : 0)
  const start = Math.max(topp, topp + (bunn - b * 0.12 - topp - blokk) / 2)
  const tegn = await tekstbane('“', FONTER[s.font].familie, s.vekt, tegnGrad, m - tegnGrad * 0.04, start + tegnGrad * 0.72, 0, 'start')
  const sitatY = start + tegnGrad * 0.5
  const sitat = await settTekst(tekst.overskrift, { ...sitatValg, y: sitatY })
  const hvem = await settTekst(hvemTekst, { ...hvemValg, y: sitatY + sitat.hoyde + b * 0.05 })
  return omslutt(
    b,
    h,
    `<rect width="${b}" height="${h}" fill="#FFFFFF"/>` +
      (tegn ? `<path d="${tegn}" fill="${p.aksent}"/>` : '') +
      `<path d="${sitat.d}" fill="${p.mork}"/>` +
      `<path d="${hvem.d}" fill="${p.primaer}"/>` +
      fast,
  )
}

/* ---------------------------------------------------------- nedlasting */

export async function somPng(svg: string, f: Format, m: Metadata, variant: string): Promise<Blob> {
  return medPngMetadata(await raster(svg, Math.max(f.b, f.h)), m, variant)
}

export const bildefilnavn = (innhold: Innhold, ...deler: string[]) =>
  `${filnavn(innhold.navn)}-${deler.join('-')}.png`

export function lastNed(blob: Blob, fil: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fil
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Profilsettet og alle tre malene i begge formater, som én ZIP. */
export async function lastNedAlt(design: Design, innhold: Innhold, tekst: Innleggstekst, m: Metadata) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const f of PROFILSETT)
    zip.file(`profil/${bildefilnavn(innhold, f.id)}`, await somPng(await profilbilde(design, innhold, f), f, m, f.navn), { compression: 'STORE' })
  for (const f of INNLEGGSFORMATER)
    for (const mal of MALER)
      zip.file(
        `${f.id}/${bildefilnavn(innhold, f.id, mal.id)}`,
        await somPng(await innlegg(design, innhold, f, mal.id, tekst), f, m, `${f.navn}, ${mal.navn}`),
        { compression: 'STORE' },
      )
  lastNed(await zip.generateAsync({ type: 'blob' }), `${filnavn(innhold.navn)}-sosiale-medier.zip`)
}

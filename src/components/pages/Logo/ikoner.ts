import { useEffect, useState } from 'react'

/**
 * Ikonene fra Iconify – det samme slags biblioteket Looka og Brandmark
 * bruker: tusenvis av tegnede vektorikoner, gratis og uten nøkkel.
 *
 * Bare sett med åpne lisenser som ikke krever kreditering i logoen:
 * Phosphor (MIT), Mingcute (Apache-2.0) og Material Design Icons
 * (Apache-2.0). Og bare de fylte variantene – et fylt ikon holder seg ned
 * til favikon og trykkes rent på bil og arbeidstøy, og fylte ikoner fra
 * ulike sett ser ut som de hører sammen.
 *
 * Ikonet lagres som rene former i designet, ikke som en lenke. En bestilling
 * fra i dag skal kunne tegnes likt om fem år, med eller uten Iconify.
 */
const API = 'https://api.iconify.design'
const SETT = ['ph', 'mingcute', 'mdi'] as const

export type Form =
  | { t: 'path'; d: string; e?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number }

export interface Ikon {
  id: string
  b: number
  h: number
  former: Form[]
}

/** Startikoner per bransje – plukket for hånd, så de første forslagene treffer. */
export const BRANSJEIKONER: Record<string, readonly string[]> = {
  // Ikke toalett: faglig riktig, men ikke det førsteinntrykket en rørlegger vil gi.
  rorlegger: ['ph:drop-fill', 'ph:pipe-wrench-fill', 'ph:pipe-fill', 'ph:wrench-fill', 'ph:shower-fill'],
  snekker: ['ph:hammer-fill', 'ph:house-line-fill', 'ph:ruler-fill', 'ph:tree-evergreen-fill', 'ph:saw-blade-fill'],
  elektriker: ['ph:lightning-fill', 'ph:plug-fill', 'ph:lightbulb-fill', 'ph:battery-charging-fill', 'ph:power-fill'],
  maler: [
    'ph:paint-roller-fill',
    'ph:paint-brush-fill',
    'ph:palette-fill',
    'ph:drop-half-fill',
    'ph:paint-bucket-fill',
  ],
  murer: ['ph:wall-fill', 'ph:house-fill', 'ph:buildings-fill', 'ph:cube-fill', 'ph:stack-fill'],
  anlegg: ['ph:tree-fill', 'ph:leaf-fill', 'ph:plant-fill', 'ph:flower-fill', 'ph:mountains-fill'],
  bilverksted: ['ph:car-fill', 'ph:wrench-fill', 'ph:gear-fill', 'ph:tire-fill', 'ph:engine-fill'],
  renhold: ['ph:broom-fill', 'ph:sparkle-fill', 'ph:drop-fill', 'ph:house-fill', 'ph:spray-bottle-fill'],
  transport: ['ph:truck-fill', 'ph:package-fill', 'ph:van-fill', 'ph:map-pin-fill', 'ph:arrow-fat-right-fill'],
  frisor: ['ph:scissors-fill', 'mdi:comb', 'mdi:hair-dryer', 'ph:sparkle-fill', 'ph:flower-lotus-fill'],
  fotpleie: ['ph:flower-lotus-fill', 'ph:footprints-fill', 'ph:drop-fill', 'ph:leaf-fill', 'ph:heart-fill'],
  trening: [
    'ph:barbell-fill',
    'ph:heartbeat-fill',
    'ph:person-simple-run-fill',
    'ph:lightning-fill',
    'ph:mountains-fill',
  ],
  servering: ['ph:coffee-fill', 'ph:fork-knife-fill', 'ph:cooking-pot-fill', 'ph:wine-fill', 'ph:bread-fill'],
  annet: ['ph:star-fill', 'ph:compass-fill', 'ph:shield-fill', 'ph:sparkle-fill', 'ph:circle-half-fill'],
}

const minne = new Map<string, Ikon>()

/** Hent ikoner etter id («ph:drop-fill»), gruppert per sett i én forespørsel hver. */
export async function hentIkoner(ider: readonly string[]): Promise<Ikon[]> {
  const mangler = ider.filter((id) => !minne.has(id))
  const perSett = new Map<string, string[]>()
  for (const id of mangler) {
    const [sett, navn] = id.split(':')
    if (!SETT.includes(sett as (typeof SETT)[number]) || !navn) continue
    perSett.set(sett, [...(perSett.get(sett) ?? []), navn])
  }
  await Promise.all(
    [...perSett].map(async ([sett, navn]) => {
      const svar = await fetch(`${API}/${sett}.json?icons=${navn.map(encodeURIComponent).join(',')}`)
      if (!svar.ok) return
      const data = (await svar.json()) as {
        width?: number
        height?: number
        icons?: Record<string, { body: string; width?: number; height?: number }>
      }
      for (const [n, ikon] of Object.entries(data.icons ?? {})) {
        const former = tolk(ikon.body)
        if (former.length)
          minne.set(`${sett}:${n}`, {
            id: `${sett}:${n}`,
            b: ikon.width ?? data.width ?? 24,
            h: ikon.height ?? data.height ?? 24,
            former,
          })
      }
    }),
  )
  return ider.map((id) => minne.get(id)).filter((x): x is Ikon => Boolean(x))
}

/** Søk – bare i de åpne settene, og bare fylte ikoner. */
export async function sokIkoner(sporring: string): Promise<Ikon[]> {
  const q = sporring.trim()
  if (q.length < 2) return []
  const svar = await fetch(`${API}/search?query=${encodeURIComponent(q)}&limit=96&prefixes=${SETT.join(',')}`)
  if (!svar.ok) return []
  const { icons = [] } = (await svar.json()) as { icons?: string[] }
  const fylte = icons.filter((id) => {
    const [sett, navn] = id.split(':')
    if (sett === 'ph' || sett === 'mingcute') return navn.endsWith('-fill')
    return !/(outline|-off|-remove|-minus|-plus|-check|-alert)/.test(navn)
  })
  return hentIkoner(fylte.slice(0, 24))
}

/**
 * Gjør Iconify-markup om til rene former – aldri `innerHTML`.
 *
 * Bare path, circle, rect og ellipse med geometriske attributter overlever.
 * Former som arver `fill="none"` (Mingcute har en usynlig ramme i hvert
 * ikon) hoppes over, ellers ville de blitt malt som en firkant.
 */
function tolk(body: string): Form[] {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`, 'image/svg+xml')
  const ut: Form[] = []
  const tall = (el: Element, a: string) => Number(el.getAttribute(a) ?? 0)
  const gaa = (el: Element, arvetFyll: string | null) => {
    const fyll = el.getAttribute('fill') ?? arvetFyll
    const usynlig = fyll === 'none' || el.getAttribute('opacity') === '0'
    const tag = el.tagName.toLowerCase()
    if (tag === 'g') return [...el.children].forEach((c) => gaa(c, fyll))
    if (usynlig) return
    const e = (el.getAttribute('fill-rule') ?? el.closest('[fill-rule]')?.getAttribute('fill-rule')) === 'evenodd'
    if (tag === 'path') {
      const d = el.getAttribute('d') ?? ''
      if (/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-eE]+$/.test(d)) ut.push({ t: 'path', d, e })
    } else if (tag === 'circle') ut.push({ t: 'circle', cx: tall(el, 'cx'), cy: tall(el, 'cy'), r: tall(el, 'r') })
    else if (tag === 'rect')
      ut.push({
        t: 'rect',
        x: tall(el, 'x'),
        y: tall(el, 'y'),
        w: tall(el, 'width'),
        h: tall(el, 'height'),
        rx: tall(el, 'rx') || undefined,
      })
    else if (tag === 'ellipse')
      ut.push({ t: 'ellipse', cx: tall(el, 'cx'), cy: tall(el, 'cy'), rx: tall(el, 'rx'), ry: tall(el, 'ry') })
  }
  ;[...doc.documentElement.children].forEach((c) => gaa(c, null))
  return ut
}

/** Det som kommer fra en lenke eller lagring, sjekkes på nytt før det tegnes. */
export function rensIkon(o: unknown): Ikon | undefined {
  if (!o || typeof o !== 'object') return undefined
  const x = o as Partial<Ikon>
  if (typeof x.id !== 'string' || typeof x.b !== 'number' || typeof x.h !== 'number' || !Array.isArray(x.former))
    return undefined
  const former = x.former.filter((f): f is Form => {
    if (!f || typeof f !== 'object') return false
    const g = f as Form
    if (g.t === 'path') return typeof g.d === 'string' && /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-eE]+$/.test(g.d)
    return ['circle', 'rect', 'ellipse'].includes(g.t)
  })
  return former.length ? { id: x.id.slice(0, 80), b: x.b, h: x.h, former: former.slice(0, 40) } : undefined
}

/** Bransjens startikoner, hentet én gang når bransjen er valgt. */
export function useBransjeikoner(bransje: string): Ikon[] {
  const [ikoner, setIkoner] = useState<Ikon[]>([])
  useEffect(() => {
    let aktiv = true
    hentIkoner(BRANSJEIKONER[bransje] ?? BRANSJEIKONER.annet)
      .then((i) => aktiv && setIkoner(i))
      .catch(() => undefined)
    return () => {
      aktiv = false
    }
  }, [bransje])
  return ikoner
}

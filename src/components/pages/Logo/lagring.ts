import { STANDARD, type Design, type Innhold } from './motor'
import { rensIkon } from './ikoner'
import { rensAbstrakt } from './abstrakt'
import { erTest } from './kjop'
import * as sky from '../../../lib/logodesign'

/**
 * Lagring av logoen kunden jobber med.
 *
 * To veier, og ingen av dem krever en server:
 *
 *   – I nettleseren (localStorage, per bruker), så en halvferdig logo er
 *     der neste gang kunden logger inn.
 *   – I adressen (`?d=…`), så profilsiden kan deles og bokmerkes, og så vi
 *     kan åpne nøyaktig kundens logo fra bestillingen.
 *
 * Firestore under brukeren ville vært bedre – da følger logoen kontoen til
 * en annen maskin – men det krever en ny samling i firestore.rules.
 */
export interface Lagret {
  design: Design
  innhold: Innhold
  bransje: string
  stiler: string[]
  /**
   * Bestillingen av designet, med designet slik det var da. Så lenge kunden
   * ikke har endret noe siden, er logoen kjøpt – og vises uten vannmerke.
   */
  bestilling?: { id: string; produkt: 'logo' | 'profil'; design: string }
  /** Id-en i skyen (Min side), når designet er lagret der. */
  designId?: string
}

const NOKKEL = 'vimzo-logo'

/** Per bruker: to kontoer på samme maskin skal ikke se hverandres logoer. */
const nokkel = (uid: string) => `${NOKKEL}:${uid}`

export function lesLokalt(uid: string): Lagret | null {
  try {
    const r = localStorage.getItem(nokkel(uid))
    return r ? rens(JSON.parse(r)) : null
  } catch {
    return null
  }
}

export function lagreLokalt(uid: string, l: Lagret) {
  try {
    localStorage.setItem(nokkel(uid), JSON.stringify(l))
  } catch {
    // Privat modus – logoen gjelder bare denne økten.
  }
}

/** Base64url av JSON. Kort nok til en lenke, og tåler æøå. */
export function kod(l: Pick<Lagret, 'design' | 'innhold'>): string {
  const json = JSON.stringify({ d: l.design, i: l.innhold })
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function dekod(s: string): Pick<Lagret, 'design' | 'innhold'> | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
    const o = JSON.parse(json)
    const r = rens({ design: o.d, innhold: o.i, bransje: 'annet', stiler: [] })
    return r && { design: r.design, innhold: r.innhold }
  } catch {
    return null
  }
}

/**
 * Det som kommer fra en lenke eller en gammel lagring, stoler vi ikke på:
 * ukjente felt faller bort, manglende får standardverdier, og tekst kuttes.
 */
function rens(o: unknown): Lagret | null {
  if (!o || typeof o !== 'object') return null
  const x = o as Partial<Lagret>
  const tekst = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '')
  const tall = (v: unknown, min: number, max: number, std: number) =>
    typeof v === 'number' && v >= min && v <= max ? v : std
  const d = (x.design ?? {}) as Partial<Design>
  return {
    design: {
      ...STANDARD,
      merke:
        (d.merke === 'ikon' && !rensIkon(d.ikon)) || (d.merke === 'abstrakt' && !rensAbstrakt(d.abstrakt))
          ? STANDARD.merke
          : tekst(d.merke, 20) || STANDARD.merke,
      beholder: d.beholder === 'flis' || d.beholder === 'sirkel' ? d.beholder : 'ingen',
      oppsett: (['side', 'over', 'kun-merke', 'ordbilde'] as const).find((v) => v === d.oppsett) ?? 'side',
      skrift: tekst(d.skrift, 20) || STANDARD.skrift,
      palett: tekst(d.palett, 20) || STANDARD.palett,
      merkefarge: d.merkefarge === 'aksent' ? 'aksent' : 'primaer',
      avstand: tall(d.avstand, 0.4, 2, 1),
      merkestorrelse: tall(d.merkestorrelse, 0.6, 1.6, 1),
      sperring: tall(d.sperring, -0.06, 0.3, 0),
      slagord: d.slagord !== false,
      ikon: rensIkon(d.ikon),
      abstrakt: rensAbstrakt(d.abstrakt),
      slagstil: (['versal', 'vanlig', 'skrift'] as const).find((v) => v === d.slagstil) ?? 'versal',
      bokstaver: (['stil', 'skrevet', 'store', 'sma'] as const).find((v) => v === d.bokstaver) ?? 'stil',
    },
    innhold: {
      navn: tekst(x.innhold?.navn, 32),
      slagord: tekst(x.innhold?.slagord, 40),
    },
    bransje: tekst(x.bransje, 20) || 'annet',
    designId: typeof x.designId === 'string' ? x.designId.slice(0, 64) : undefined,
    bestilling:
      x.bestilling &&
      typeof x.bestilling.id === 'string' &&
      (x.bestilling.produkt === 'logo' || x.bestilling.produkt === 'profil')
        ? {
            id: x.bestilling.id.slice(0, 64),
            produkt: x.bestilling.produkt,
            design: String(x.bestilling.design ?? '').slice(0, 20000),
          }
        : undefined,
    stiler: Array.isArray(x.stiler) ? x.stiler.filter((s): s is string => typeof s === 'string').slice(0, 3) : [],
  }
}

/* ------------------------------------------------------------------- skyen */

/**
 * Lagring på Min side, gjennom én dør. Verktøyet skal kalle disse og ikke
 * lib/logodesign direkte: i utvikling med `?test=1` går de til falske
 * utgaver i minnet (testsom.ts), så en testkjøring aldri skriver til
 * Firestore. Grenen er `import.meta.env.DEV && …` og finnes ikke i
 * produksjonsbygget – der er dette bare videresending.
 */
export async function lagreDesign(id: string | null, inn: sky.DesignInn): Promise<string> {
  if (import.meta.env.DEV && erTest()) return (await import('./testsom')).falskLagreDesign(id, inn)
  return sky.lagreDesign(id, inn)
}

export async function merkSomKjopt(id: string, bestillingId: string, produkt: 'logo' | 'profil'): Promise<void> {
  if (import.meta.env.DEV && erTest()) return (await import('./testsom')).falskMerkSomKjopt(id, bestillingId, produkt)
  return sky.merkSomKjopt(id, bestillingId, produkt)
}

export async function hentDesign(id: string): Promise<sky.LagretDesign | null> {
  if (import.meta.env.DEV && erTest()) return (await import('./testsom')).falskHentDesign(id)
  return sky.hentDesign(id)
}

/**
 * Referansen et design har når det er frigitt med en nettside i stedet for
 * kjøpt. Står der bestillingsnummeret ellers står – i LES-MEG, i metadataene
 * i filene – og skrives ut som «Inngår i nettsideprosjekt hos Vimzo».
 */
export const NETTSIDE = 'nettside'

/**
 * Er designet kundens, og i så fall som hvilket produkt? Kjøpt i verktøyet
 * gir bestillingen. Frigitt med en nettside (valgt i nettsidekalkulatoren,
 * fakturert med nettsiden, frigitt av Vimzo i /admin) gir hele pakken med
 * profilbok – uten ny bestilling. `data` er designet serialisert, så
 * kjøpet bare gjelder så lenge kunden ikke endrer noe.
 */
export function kjopFraSky(
  d: Pick<sky.LagretDesign, 'bestillingId' | 'produkt' | 'frigitt'>,
  data: string,
): Lagret['bestilling'] {
  if (d.bestillingId && (d.produkt === 'logo' || d.produkt === 'profil'))
    return { id: d.bestillingId, produkt: d.produkt, design: data }
  if (d.frigitt) return { id: NETTSIDE, produkt: 'profil', design: data }
  return undefined
}

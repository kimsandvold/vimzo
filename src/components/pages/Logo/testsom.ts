import type { NyLogobestilling } from '../../../lib/logobestillinger'
import type { DesignInn, LagretDesign } from '../../../lib/logodesign'

/**
 * Testsømmen: falske utgaver av alt verktøyet skriver til Firebase.
 *
 * Bare i utvikling, og bare med `?test=1` i adressen. Da er brukeren
 * oppdiktet (se `demoBruker` i kjop.ts), og bestillinger og lagrede design
 * havner i minnet her i stedet for i Firestore – så testskriptene kan gå
 * hele veien fra navn til ZIP uten å lage en eneste ekte konto eller ordre.
 *
 * Modulen lastes bare bak `import.meta.env.DEV && …`, og den grenen fjernes
 * helt i produksjonsbygget. Strengene under er med vilje lette å søke etter:
 * finnes «vimzo-testsom» i dist/, har sømmen lekket ut.
 */

export const TESTMERKE = 'vimzo-testsom'
const TESTBRUKER_UID = 'vimzo-test'

interface Testlager {
  merke: string
  bestillinger: (NyLogobestilling & { id: string })[]
  design: Map<string, LagretDesign>
}

/** Lageret ligger på window, så testskriptet kan lese hva som ble «sendt». */
function lager(): Testlager {
  const w = window as unknown as { __vimzoTest?: Testlager; __vimzoTestFro?: LagretDesign[] }
  // Testskriptet kan så design før siden lastes (`evaluateOnNewDocument`),
  // f.eks. et som er frigitt med en nettside.
  w.__vimzoTest ??= {
    merke: TESTMERKE,
    bestillinger: [],
    design: new Map((w.__vimzoTestFro ?? []).map((d) => [d.id, { ...d }])),
  }
  return w.__vimzoTest
}

const vent = () => new Promise((ok) => setTimeout(ok, 150))

/** Samme kontroller som `bestillLogo` gjør før den skriver – feilene skal være de samme. */
export async function falskBestilling(b: NyLogobestilling): Promise<string> {
  await vent()
  const orgnr = b.orgnr.replace(/\s/g, '')
  if (orgnr && !/^\d{9}$/.test(orgnr)) throw new Error('Organisasjonsnummeret må ha ni sifre')
  if (!b.bedrift.trim() || !b.adresse.trim() || !/^\d{4}$/.test(b.postnr.trim()) || !b.poststed.trim())
    throw new Error('Fyll inn firmanavn og fakturaadresse')
  const l = lager()
  const id = `TEST-${String(l.bestillinger.length + 1).padStart(4, '0')}`
  l.bestillinger.push({ ...b, orgnr, id })
  console.info(`[${TESTMERKE}] bestilling ${id} (${b.produkt}) – ikke sendt`)
  return id
}

export async function falskLagreDesign(id: string | null, inn: DesignInn): Promise<string> {
  await vent()
  const l = lager()
  const ny = id ?? `testdesign-${l.design.size + 1}`
  const for_ = l.design.get(ny)
  l.design.set(ny, {
    id: ny,
    uid: TESTBRUKER_UID,
    ...inn,
    bestillingId: for_?.bestillingId ?? null,
    produkt: for_?.produkt ?? null,
    frigitt: for_?.frigitt ?? false,
    opprettet: for_?.opprettet ?? Date.now(),
    oppdatert: Date.now(),
  })
  return ny
}

export async function falskMerkSomKjopt(id: string, bestillingId: string, produkt: 'logo' | 'profil'): Promise<void> {
  const d = lager().design.get(id)
  if (d) Object.assign(d, { bestillingId, produkt, oppdatert: Date.now() })
}

export async function falskHentDesign(id: string): Promise<LagretDesign | null> {
  return lager().design.get(id) ?? null
}

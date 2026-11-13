import type { DocumentData, Unsubscribe } from 'firebase/firestore'
import { firebaseKlar, hentDb } from './firebase'

/**
 * Lagrede logoer på Min side.
 *
 * Hvert design kunden lager, lagres her under kontoen hans – utkast og
 * kjøpte side om side. Logoverktøyet skriver hit (autolagring og «Lagre»),
 * Min side leser herfra. Når et design bestilles, får det `bestillingId`, og
 * da vet både Min side og verktøyet at filene er kjøpt og skal være uten
 * vannmerke.
 *
 * En logo kan også være knyttet til en nettsideforespørsel fra kalkulatoren.
 * Da faktureres den sammen med nettsiden, og Vimzo setter `frigitt` i saken
 * når siden er ferdig – fra da av er filene kundens, uten egen bestilling.
 *
 * Firestore-reglene (firestore.rules → logodesign) gir kunden full råderett
 * over sine egne og ingen tilgang til andres. Admin kan lese, og bare admin
 * kan frigi.
 */

const SAMLING = 'logodesign'

/** Grenser som også håndheves i firestore.rules. Holdes like. */
export const MAKS_DESIGN = { navn: 200, design: 20000, forhandsvisning: 30000 } as const

export interface LagretDesign {
  id: string
  uid: string
  /** Det kunden kaller det – som regel bedriftsnavnet. */
  navn: string
  /** Hele designet, serialisert av logoverktøyet. */
  design: string
  /** Liten SVG av hovedlogoen, til kortet på Min side. Uten vannmerke er greit – den er bare kundens egen. */
  forhandsvisning: string
  /** Satt når designet er kjøpt. */
  bestillingId: string | null
  /** 'logo' | 'profil' når kjøpt. */
  produkt: string | null
  /**
   * Frigitt av Vimzo som del av et nettsideprosjekt. Gir de samme rene
   * filene som et kjøp – fakturaen kommer med nettsiden.
   */
  frigitt: boolean
  opprettet: number
  oppdatert: number
}

export interface DesignInn {
  navn: string
  design: string
  forhandsvisning: string
}

const kutt = (s: string, n: number) => s.slice(0, n)

const ms = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : Number(v) || Date.now()

function tilDesign(id: string, d: DocumentData): LagretDesign {
  return {
    id,
    uid: d.uid ?? '',
    navn: d.navn ?? '',
    design: d.design ?? '',
    forhandsvisning: d.forhandsvisning ?? '',
    bestillingId: d.bestillingId ?? null,
    produkt: d.produkt ?? null,
    frigitt: d.frigitt === true,
    opprettet: ms(d.opprettet),
    oppdatert: ms(d.oppdatert ?? d.opprettet),
  }
}

async function innloggetUid(): Promise<string> {
  const { getAuth } = await import('firebase/auth')
  const bruker = getAuth().currentUser
  if (!bruker) throw new Error('Du må være innlogget for å lagre')
  return bruker.uid
}

/**
 * Lagre et design. Uten `id` opprettes et nytt, og id-en returneres – den
 * skal verktøyet holde på, så neste lagring oppdaterer samme design i
 * stedet for å lage et nytt hver gang.
 */
export async function lagreDesign(id: string | null, inn: DesignInn): Promise<string> {
  if (!firebaseKlar) throw new Error('Lagring er ikke tilgjengelig akkurat nå')
  const [{ addDoc, collection, doc, serverTimestamp, updateDoc }, db, uid] = await Promise.all([
    import('firebase/firestore'),
    hentDb(),
    innloggetUid(),
  ])
  const felt = {
    navn: kutt(inn.navn, MAKS_DESIGN.navn),
    design: kutt(inn.design, MAKS_DESIGN.design),
    forhandsvisning: kutt(inn.forhandsvisning, MAKS_DESIGN.forhandsvisning),
    oppdatert: serverTimestamp(),
  }
  if (id) {
    await updateDoc(doc(db, SAMLING, id), felt)
    return id
  }
  const ref = await addDoc(collection(db, SAMLING), {
    ...felt,
    uid,
    bestillingId: null,
    produkt: null,
    opprettet: serverTimestamp(),
  })
  return ref.id
}

/** Merk designet som kjøpt. Kalles av verktøyet rett etter `bestillLogo`. */
export async function merkSomKjopt(id: string, bestillingId: string, produkt: 'logo' | 'profil'): Promise<void> {
  const [{ doc, serverTimestamp, updateDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { bestillingId, produkt, oppdatert: serverTimestamp() })
}

/** Sant når filene er kundens – kjøpt i verktøyet eller frigitt med nettsiden. */
export const erKundens = (d: Pick<LagretDesign, 'bestillingId' | 'frigitt'>) => !!d.bestillingId || d.frigitt

/**
 * Studioet for signatur og SoMe åpnes med logoen som har profilen – ellers
 * den sist kjøpte, ellers den sist endrede (da vises det låst).
 */
export function velgStudiologo(liste: LagretDesign[] | null): LagretDesign | null {
  const l = liste ?? []
  return l.find((d) => d.frigitt || (d.bestillingId && d.produkt === 'profil')) ?? l.find(erKundens) ?? l[0] ?? null
}

/** Admin: frigi logoen til kunden, som del av nettsideprosjektet. */
export async function frigiDesign(id: string, frigitt = true): Promise<void> {
  const [{ doc, serverTimestamp, updateDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { frigitt, oppdatert: serverTimestamp() })
}

export async function hentDesign(id: string): Promise<LagretDesign | null> {
  if (!firebaseKlar) return null
  const [{ doc, getDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  const d = await getDoc(doc(db, SAMLING, id))
  return d.exists() ? tilDesign(d.id, d.data()) : null
}

/** Slett et utkast. Kjøpte design kan ikke slettes av kunden (reglene nekter). */
export async function slettDesign(id: string): Promise<void> {
  const [{ deleteDoc, doc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await deleteDoc(doc(db, SAMLING, id))
}

/**
 * Lytt på den innloggede kundens design, sist endret først.
 *
 * Sorteringen skjer her og ikke i spørringen: `where` + `orderBy` på to
 * felt krever en egen indeks i Firestore, og for noen titalls design per
 * kunde er det ikke verdt det.
 */
export async function lyttMineDesign(
  uid: string,
  ved: (liste: LagretDesign[]) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, query, where }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING), where('uid', '==', uid)),
    (snap) => ved(snap.docs.map((d) => tilDesign(d.id, d.data())).sort((a, b) => b.oppdatert - a.oppdatert)),
    vedFeil,
  )
}

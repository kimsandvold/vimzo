import type { DocumentData, DocumentSnapshot, Unsubscribe } from 'firebase/firestore'
import { hentDb } from './firebase'
import { prosjektFra, type Melding, type Prosjekt } from '../data/prosjekt'
import type { Sak } from '../data/saker'

const SAMLING = 'prosjekter'

/** Firestore-tidsstempel eller tall → millisekunder, eller null. */
function ms(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof (v as { toMillis?: () => number }).toMillis === 'function') return (v as { toMillis: () => number }).toMillis()
  return typeof v === 'number' ? v : null
}

function tilProsjekt(snap: DocumentSnapshot): Prosjekt {
  // «estimate»: et tidsstempel som ennå ikke er bekreftet av serveren, vises
  // med lokal tid i stedet for som null – ellers blinker «godtatt» av og på.
  const d = snap.data({ serverTimestamps: 'estimate' }) as DocumentData
  return {
    id: snap.id,
    kundeEpost: d.kundeEpost ?? '',
    tittel: d.tittel ?? '',
    status: d.status ?? 'ny',
    tidslinje: d.tidslinje ?? [],
    forventetLevering: d.forventetLevering ?? null,
    tilbud: d.tilbud ?? null,
    tilbudsbeskrivelse: d.tilbudsbeskrivelse ?? '',
    tilbudGodtatt: ms(d.tilbudGodtatt),
    faktura: d.faktura ?? null,
    drift: d.drift ?? null,
    sistKundemelding: ms(d.sistKundemelding),
    oppdatert: ms(d.oppdatert) ?? Date.now(),
  }
}

/* ------------------------------------------------------------------ admin */

/** Gi kunden tilgang: opprett prosjektet med samme id som saken. */
export async function giKundetilgang(sak: Sak) {
  const [{ doc, setDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await setDoc(doc(db, SAMLING, sak.id), {
    ...prosjektFra(sak),
    forventetLevering: null,
    tilbudsbeskrivelse: '',
    tilbudGodtatt: null,
    sistKundemelding: null,
    oppdatert: serverTimestamp(),
  })
}

/**
 * Skriv sakens synlige felter til prosjektet. Rører aldri det kunden eier
 * (godtatt, sist melding) eller det du skriver for hånd.
 */
export async function synkProsjekt(sak: Sak) {
  const [{ doc, updateDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, sak.id), { ...prosjektFra(sak), oppdatert: serverTimestamp() })
}

export async function oppdaterProsjekt(id: string, felt: { forventetLevering?: string | null; tilbudsbeskrivelse?: string }) {
  const [{ doc, updateDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { ...felt, oppdatert: serverTimestamp() })
}

/** Ta bort kundens tilgang. Meldingene blir liggende, men kan ikke leses av kunden. */
export async function fjernKundetilgang(id: string) {
  const [{ doc, deleteDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await deleteDoc(doc(db, SAMLING, id))
}

export async function lyttProsjekt(id: string, ved: (p: Prosjekt | null) => void, vedFeil: (e: Error) => void): Promise<Unsubscribe> {
  const [{ doc, onSnapshot }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(doc(db, SAMLING, id), (s) => ved(s.exists() ? tilProsjekt(s) : null), vedFeil)
}

/** Alle prosjekter – for oversikten i admin (nye meldinger, godtatte tilbud). */
export async function lyttAlleProsjekter(ved: (p: Prosjekt[]) => void, vedFeil: (e: Error) => void): Promise<Unsubscribe> {
  const [{ collection, onSnapshot }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(collection(db, SAMLING), (s) => ved(s.docs.map(tilProsjekt)), vedFeil)
}

/* ------------------------------------------------------------------ kunde */

/** Kundens egne prosjekter – de som står på den innloggede e-postadressen. */
export async function lyttMineProsjekter(
  epost: string,
  ved: (p: Prosjekt[]) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, query, where }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING), where('kundeEpost', '==', epost.trim().toLowerCase())),
    (s) => ved(s.docs.map(tilProsjekt).sort((a, b) => b.oppdatert - a.oppdatert)),
    vedFeil,
  )
}

export async function godtaTilbud(id: string) {
  const [{ doc, updateDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { tilbudGodtatt: serverTimestamp() })
}

/* --------------------------------------------------------------- meldinger */

export async function lyttMeldinger(id: string, ved: (m: Melding[]) => void, vedFeil: (e: Error) => void): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, orderBy, query }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING, id, 'meldinger'), orderBy('tid')),
    (s) =>
      ved(
        s.docs.map((d) => {
          const m = d.data({ serverTimestamps: 'estimate' })
          return { id: d.id, fra: m.fra, navn: m.navn ?? '', tekst: m.tekst ?? '', tid: ms(m.tid) ?? Date.now() }
        }),
      ),
    vedFeil,
  )
}

/**
 * Send en melding. Fra kunden stemples også prosjektet, så admin ser at det
 * har kommet noe nytt.
 */
export async function sendMelding(id: string, fra: 'kunde' | 'vimzo', navn: string, tekst: string) {
  const [{ addDoc, collection, doc, serverTimestamp, updateDoc }, db] = await Promise.all([
    import('firebase/firestore'),
    hentDb(),
  ])
  await addDoc(collection(db, SAMLING, id, 'meldinger'), { fra, navn: navn.slice(0, 200), tekst: tekst.slice(0, 5000), tid: serverTimestamp() })
  if (fra === 'kunde') await updateDoc(doc(db, SAMLING, id), { sistKundemelding: serverTimestamp() })
}

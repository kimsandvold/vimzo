import type { DocumentData, Unsubscribe } from 'firebase/firestore'
import { firebaseKlar, hentDb } from './firebase'
import type { Drift, Hendelse, NyHenvendelse, Notat, Sak, Status } from '../data/saker'

const SAMLING = 'henvendelser'

/** Grenser som også håndheves i firestore.rules. Holdes like. */
export const MAKS = { kort: 200, epost: 254, telefon: 40, melding: 5000, brief: 5000, id: 100 } as const

const kutt = (s: string, n: number) => s.slice(0, n)

/**
 * Lagre en henvendelse fra et offentlig skjema.
 *
 * Kan bare opprette – aldri lese, endre eller slette. Det er sikkerhetsreglene
 * som sørger for det, ikke denne koden. Er Firebase ikke satt opp, gjør den
 * ingenting og sier fra med `false`.
 */
export async function lagreHenvendelse(h: NyHenvendelse): Promise<boolean> {
  if (!firebaseKlar) return false
  const [{ addDoc, collection, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await addDoc(collection(db, SAMLING), {
    kilde: h.kilde,
    navn: kutt(h.navn, MAKS.kort),
    bedrift: kutt(h.bedrift, MAKS.kort),
    epost: kutt(h.epost, MAKS.epost),
    telefon: kutt(h.telefon, MAKS.telefon),
    melding: kutt(h.melding, MAKS.melding),
    brief: kutt(h.brief, MAKS.brief),
    pakke: kutt(h.pakke, MAKS.kort),
    anslag: h.anslag,
    logodesign: kutt(h.logodesign ?? '', MAKS.id),
    status: 'ny',
    opprettet: serverTimestamp(),
  })
  return true
}

/* ------------------------------------------------------------------ admin */

/** Firestore-dokument → Sak, med trygge standardverdier for felt som mangler. */
function tilSak(id: string, d: DocumentData): Sak {
  const ms = (v: unknown): number =>
    v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : Number(v) || Date.now()
  return {
    id,
    kilde: d.kilde ?? 'kontakt',
    navn: d.navn ?? '',
    bedrift: d.bedrift ?? '',
    epost: d.epost ?? '',
    telefon: d.telefon ?? '',
    melding: d.melding ?? '',
    brief: d.brief ?? '',
    pakke: d.pakke ?? '',
    anslag: d.anslag ?? null,
    logodesign: d.logodesign ?? '',
    opprettet: ms(d.opprettet),
    status: d.status ?? 'ny',
    historikk: d.historikk ?? [],
    notater: d.notater ?? [],
    nesteOppfolging: d.nesteOppfolging ?? null,
    tilbudBelop: d.tilbudBelop ?? null,
    fakturertBelop: d.fakturertBelop ?? null,
    drift: d.drift ?? null,
    sistLest: d.sistLest ?? null,
    oppdatert: ms(d.oppdatert ?? d.opprettet),
  }
}

/** Lytt på alle saker, nyeste først. Kaller `vedFeil` hvis reglene nekter. */
export async function lyttSaker(ved: (saker: Sak[]) => void, vedFeil: (e: Error) => void): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, orderBy, query }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING), orderBy('opprettet', 'desc')),
    (snap) => ved(snap.docs.map((d) => tilSak(d.id, d.data()))),
    vedFeil,
  )
}

export async function lyttSak(id: string, ved: (sak: Sak | null) => void, vedFeil: (e: Error) => void): Promise<Unsubscribe> {
  const [{ doc, onSnapshot }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(doc(db, SAMLING, id), (d) => ved(d.exists() ? tilSak(d.id, d.data()) : null), vedFeil)
}

async function oppdater(id: string, felt: Record<string, unknown>) {
  const [{ doc, updateDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { ...felt, oppdatert: serverTimestamp() })
}

/**
 * Flytt saken til en ny status, med dato. Datoen kan settes bakover – det
 * hender at du legger inn i dag at tilbudet gikk ut i går.
 */
export async function settStatus(sak: Sak, ny: Status, tid: number, ekstra: { belop?: number; grunn?: string } = {}) {
  const hendelse: Hendelse = { status: ny, tid, ...ekstra }
  const historikk = [...sak.historikk, hendelse].sort((a, b) => a.tid - b.tid)
  const felt: Record<string, unknown> = { status: ny, historikk }
  if (ny === 'tilbud' && ekstra.belop !== undefined) felt.tilbudBelop = ekstra.belop
  if (ny === 'fakturert' && ekstra.belop !== undefined) felt.fakturertBelop = ekstra.belop
  await oppdater(sak.id, felt)
}

/** Fjern én hendelse fra historikken – for når en status ble satt ved en feil. */
export async function fjernHendelse(sak: Sak, indeks: number) {
  const historikk = sak.historikk.filter((_, i) => i !== indeks)
  const sist = historikk[historikk.length - 1]
  await oppdater(sak.id, { historikk, status: sist?.status ?? 'ny' })
}

export async function leggTilNotat(sak: Sak, tekst: string) {
  const notat: Notat = { tekst, tid: Date.now() }
  await oppdater(sak.id, { notater: [...sak.notater, notat] })
}

export async function fjernNotat(sak: Sak, indeks: number) {
  await oppdater(sak.id, { notater: sak.notater.filter((_, i) => i !== indeks) })
}

export async function settOppfolging(sak: Sak, dato: string | null) {
  await oppdater(sak.id, { nesteOppfolging: dato })
}

/** Marker at du har sett saken – nye meldinger fra kunden regnes fra her. */
export async function markerLest(id: string) {
  const [{ doc, updateDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  // Bare dette feltet, og uten å røre «oppdatert»: å se på saken er ikke å endre den.
  await updateDoc(doc(db, SAMLING, id), { sistLest: Date.now() })
}

export async function settDrift(sak: Sak, drift: Drift | null) {
  await oppdater(sak.id, { drift })
}

export async function settBelop(sak: Sak, felt: 'tilbudBelop' | 'fakturertBelop', belop: number | null) {
  await oppdater(sak.id, { [felt]: belop })
}

export async function oppdaterKontakt(sak: Sak, kontakt: Pick<Sak, 'navn' | 'bedrift' | 'epost' | 'telefon'>) {
  await oppdater(sak.id, kontakt)
}

/** Legg inn en sak selv – for henvendelser som kom på telefon eller i nettverket. */
export async function opprettManuell(h: Pick<Sak, 'navn' | 'bedrift' | 'epost' | 'telefon' | 'melding'>): Promise<string> {
  const [{ addDoc, collection, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  const ref = await addDoc(collection(db, SAMLING), {
    kilde: 'manuell',
    ...h,
    brief: '',
    pakke: '',
    anslag: null,
    status: 'ny',
    opprettet: serverTimestamp(),
  })
  return ref.id
}

export async function slettSak(id: string) {
  const [{ doc, deleteDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await deleteDoc(doc(db, SAMLING, id))
}

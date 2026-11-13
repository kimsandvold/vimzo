import type { DocumentData, Unsubscribe } from 'firebase/firestore'
import { firebaseKlar, hentDb } from './firebase'
import type { Mvatermin, Selskapsform } from './frister'

/**
 * Profilen på Min side: hvem du er, og – hvis du har en – bedriften din.
 *
 * Fylles inn én gang og brukes overalt etterpå: i e-postsignaturen, i
 * fristkalenderen, i tilbud og i kalkulatorene. Bedriften er valgfri; mange
 * som lager logo her, har ikke registrert foretaket ennå.
 *
 * Ett dokument per konto, med kontoens uid som id: `profiler/{uid}`.
 * Firestore-reglene (firestore.rules → profiler) slipper bare eieren til,
 * og sjekker felt og lengder. Grensene under håndheves også der – hold dem like.
 */

const SAMLING = 'profiler'

export interface Person {
  navn: string
  tittel: string
  telefon: string
  epost: string
}

export interface Bedrift {
  orgnr: string
  navn: string
  /** Kode fra Enhetsregisteret: ENK, AS … Tom hvis lagt inn for hånd. */
  formkode: string
  adresse: string
  postnr: string
  poststed: string
  telefon: string
  epost: string
  nettside: string
  /** Til tilbud og fakturaer. 11 siffer, uten punktum. */
  kontonummer: string
}

/** Svarene fristkalenderen trenger ut over det registeret vet. */
export interface Fristvalg {
  mva: Mvatermin
  lonn: boolean
  lonningsdag: number
}

/**
 * Kontoen profilen hører til, slik innloggingen kjenner den.
 *
 * Lagres ved første innlogging, før brukeren har fylt inn noe – så admin
 * alltid kan finne igjen en kunde, også om e-posten med ordren forsvinner.
 * Reglene sjekker at uid og e-post er den innloggedes egen.
 */
export interface Konto {
  uid: string
  /** Innloggingsadressen. Kan være en annen enn `person.epost`. */
  epost: string
  /** Navnet fra Google-kontoen, hvis noe. */
  navn: string
}

export interface Profil {
  konto: Konto | null
  person: Person
  /** `null` når brukeren ikke har (eller ikke vil legge inn) en bedrift. */
  bedrift: Bedrift | null
  frister: Fristvalg | null
  /** Sant når brukeren selv har lagret profilen – ikke bare logget inn. */
  fullfort: boolean
  opprettet: number
  oppdatert: number
}

/** Grenser som også håndheves i firestore.rules. */
export const MAKS = { kort: 120, lang: 200, url: 300 } as const

export const TOM_PERSON: Person = { navn: '', tittel: '', telefon: '', epost: '' }

export const TOM_BEDRIFT: Bedrift = {
  orgnr: '',
  navn: '',
  formkode: '',
  adresse: '',
  postnr: '',
  poststed: '',
  telefon: '',
  epost: '',
  nettside: '',
  kontonummer: '',
}

const tekst = (v: unknown, maks: number) => (typeof v === 'string' ? v.trim().slice(0, maks) : '')

const ms = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : Number(v) || 0

function rensPerson(p: Partial<Person> | undefined): Person {
  return {
    navn: tekst(p?.navn, MAKS.lang),
    tittel: tekst(p?.tittel, MAKS.kort),
    telefon: tekst(p?.telefon, MAKS.kort),
    epost: tekst(p?.epost, MAKS.lang),
  }
}

function rensBedrift(b: Partial<Bedrift>): Bedrift {
  return {
    orgnr: tekst(b.orgnr, 9).replace(/\D/g, ''),
    navn: tekst(b.navn, MAKS.lang),
    formkode: tekst(b.formkode, 10),
    adresse: tekst(b.adresse, MAKS.lang),
    postnr: tekst(b.postnr, 4).replace(/\D/g, ''),
    poststed: tekst(b.poststed, MAKS.kort),
    telefon: tekst(b.telefon, MAKS.kort),
    epost: tekst(b.epost, MAKS.lang),
    nettside: tekst(b.nettside, MAKS.url),
    kontonummer: tekst(b.kontonummer, 20).replace(/\D/g, '').slice(0, 11),
  }
}

function rensFrister(f: Partial<Fristvalg> | null | undefined): Fristvalg | null {
  if (!f) return null
  const mva: Mvatermin = f.mva === 'ingen' || f.mva === 'aar' ? f.mva : 'tomaaned'
  const dag = Math.round(Number(f.lonningsdag))
  return { mva, lonn: f.lonn === true, lonningsdag: dag >= 1 && dag <= 31 ? dag : 20 }
}

function tilProfil(d: DocumentData): Profil {
  return {
    konto: d.konto
      ? { uid: tekst(d.konto.uid, 128), epost: tekst(d.konto.epost, MAKS.lang), navn: tekst(d.konto.navn, MAKS.lang) }
      : null,
    person: rensPerson(d.person),
    bedrift: d.bedrift ? rensBedrift(d.bedrift) : null,
    frister: rensFrister(d.frister),
    // Profiler lagret før feltet fantes, er fylt ut av brukeren selv.
    fullfort: d.fullfort !== false,
    opprettet: ms(d.opprettet ?? d.oppdatert),
    oppdatert: ms(d.oppdatert),
  }
}

/* ------------------------------------------------------------------ */
/* Validering i skjemaet                                               */
/* ------------------------------------------------------------------ */

/** Norsk kontonummer: 11 siffer med kontrollsiffer (modulus 11). */
export function gyldigKontonummer(t: string): boolean {
  const nr = t.replace(/[\s.]/g, '')
  if (!/^\d{11}$/.test(nr)) return false
  const vekter = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = vekter.reduce((s, v, i) => s + v * Number(nr[i]), 0)
  const rest = sum % 11
  const kontroll = rest === 0 ? 0 : 11 - rest
  return kontroll !== 10 && kontroll === Number(nr[10])
}

/** «12345678903» → «1234.56.78903», slik nordmenn skriver det. */
export function formaterKontonummer(t: string): string {
  const nr = t.replace(/\D/g, '')
  return nr.length === 11 ? `${nr.slice(0, 4)}.${nr.slice(4, 6)}.${nr.slice(6)}` : t
}

/** «923609016» → «923 609 016». */
export function formaterOrgnr(t: string): string {
  const nr = t.replace(/\D/g, '')
  return nr.length === 9 ? `${nr.slice(0, 3)} ${nr.slice(3, 6)} ${nr.slice(6)}` : t
}

/* ------------------------------------------------------------------ */
/* Fristkalenderen                                                     */
/* ------------------------------------------------------------------ */

export function selskapsform(formkode: string): Selskapsform | null {
  if (formkode === 'ENK') return 'enk'
  if (formkode === 'AS' || formkode === 'ASA') return 'as'
  return null
}

/** Lenke til /frister med alt ferdig utfylt. */
export function fristlenke(bedrift: Bedrift, valg: Fristvalg, sti = '/frister'): string {
  const p = new URLSearchParams()
  if (bedrift.orgnr) p.set('org', bedrift.orgnr)
  p.set('form', selskapsform(bedrift.formkode) ?? 'as')
  p.set('mva', valg.mva)
  p.set('lonn', valg.lonn ? '1' : '0')
  if (valg.lonn) p.set('dag', String(valg.lonningsdag))
  return `${sti}?${p}`
}

export const gyldigEpost = (t: string) => t === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)

/* ------------------------------------------------------------------ */
/* Lagring                                                             */
/* ------------------------------------------------------------------ */

/** Kontoen slik Firebase kjenner den, i formen reglene krever. */
async function innloggetKonto(): Promise<Konto> {
  const { getAuth } = await import('firebase/auth')
  const b = getAuth().currentUser
  if (!b?.email) throw new Error('Du må være innlogget for å lagre')
  return { uid: b.uid, epost: b.email, navn: tekst(b.displayName, MAKS.lang) }
}

/**
 * Registrer kontoen ved første innlogging, før brukeren har fylt inn noe.
 *
 * Gjør ingenting hvis profilen alt finnes. Navn og e-post fra innloggingen
 * står som forslag; `fullfort` er usann til brukeren lagrer selv.
 */
export async function registrerKonto(uid: string): Promise<void> {
  if (!firebaseKlar) return
  const [{ doc, getDoc, serverTimestamp, setDoc }, db, konto] = await Promise.all([
    import('firebase/firestore'),
    hentDb(),
    innloggetKonto(),
  ])
  const ref = doc(db, SAMLING, uid)
  if ((await getDoc(ref)).exists()) return
  await setDoc(ref, {
    konto,
    person: rensPerson({ navn: konto.navn, epost: konto.epost }),
    bedrift: null,
    frister: null,
    fullfort: false,
    opprettet: serverTimestamp(),
    oppdatert: serverTimestamp(),
  })
}

/**
 * Lagre profilen. `merge` gjør at `opprettet` står urørt – reglene krever
 * at den aldri endres etter første lagring.
 */
export async function lagreProfil(
  uid: string,
  inn: { person: Person; bedrift: Bedrift | null; frister: Fristvalg | null },
): Promise<void> {
  if (!firebaseKlar) throw new Error('Lagring er ikke tilgjengelig akkurat nå')
  const [{ doc, getDoc, serverTimestamp, setDoc }, db, konto] = await Promise.all([
    import('firebase/firestore'),
    hentDb(),
    innloggetKonto(),
  ])
  const ref = doc(db, SAMLING, uid)
  const finnes = (await getDoc(ref)).exists()
  const bedrift = inn.bedrift ? rensBedrift(inn.bedrift) : null
  await setDoc(
    ref,
    {
      konto,
      person: rensPerson(inn.person),
      bedrift,
      // Fristvalgene gir bare mening med en bedrift.
      frister: bedrift ? rensFrister(inn.frister) : null,
      fullfort: true,
      ...(finnes ? {} : { opprettet: serverTimestamp() }),
      oppdatert: serverTimestamp(),
    },
    { merge: true },
  )
}

/** Admin: alle profilene, nyeste først. Reglene slipper bare admin til. */
export async function lyttAlleProfiler(
  ved: (liste: Array<Profil & { id: string }>) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ collection, onSnapshot }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    collection(db, SAMLING),
    (snap) => ved(snap.docs.map((d) => ({ id: d.id, ...tilProfil(d.data()) })).sort((a, b) => b.opprettet - a.opprettet)),
    vedFeil,
  )
}

/** Lytt på profilen. `null` når den ikke er laget ennå. */
export async function lyttProfil(
  uid: string,
  ved: (profil: Profil | null) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ doc, onSnapshot }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    doc(db, SAMLING, uid),
    (snap) => ved(snap.exists() ? tilProfil(snap.data()) : null),
    vedFeil,
  )
}

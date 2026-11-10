import type { DocumentData, Unsubscribe } from 'firebase/firestore'
import { firebaseKlar, hentDb } from './firebase'
import { bekreftTilKunde, varsleVimzo } from './emailjs'
import { OPPGRADERING, PRODUKTER, type Produkt } from '../data/logoprodukter'

/**
 * Bestillinger fra logoverktøyet.
 *
 * Kunden designer innlogget, bestiller og får filene med en gang (en ZIP med
 * SVG, PNG og profilen som PDF). Betalingen skjer med faktura i etterkant.
 * Derfor er rekkefølgen hellig: bestillingen – med alt som trengs for å
 * fakturere – lagres FØR nedlastingen starter. Feiler lagringen, får kunden
 * ingen filer. Ordrelinjen opprettes som «levert», fordi filene er levert i
 * det øyeblikket; i /admin står den da som «skal faktureres».
 *
 * Når Vipps eller Stripe kobles på, får `bestillLogo` et betalingssteg til –
 * ordrelinjen er den samme.
 *
 * Firestore-reglene (firestore.rules → logobestillinger) sørger for at en
 * kunde bare kan opprette sin egen bestilling, med riktig pris, og bare lese
 * sine egne. Alt annet er admin.
 */

const SAMLING = 'logobestillinger'

/** Prisene står i data/logoprodukter.ts – re-eksportert her for verktøyets skyld. */
export { OPPGRADERING, PRODUKTER, type Produkt }

/** Det en ordrelinje kan gjelde: et av produktene, eller oppgraderingen fra logo til profil. */
export type Ordreprodukt = Produkt | 'oppgradering'

export const produktnavn = (p: Ordreprodukt) => (p === 'oppgradering' ? OPPGRADERING.navn : PRODUKTER[p].navn)

/** Gir ordrelinjen hele profilen? Kjøpt som profil, eller oppgradert til den. */
export const girProfil = (p: Ordreprodukt) => p === 'profil' || p === 'oppgradering'

/**
 * Ordrelinjens gang: levert → fakturert → betalt. Eller kansellert.
 * «ny» brukes ikke av kunder lenger (filene leveres med en gang), men står
 * igjen for bestillinger som legges inn manuelt.
 */
export type Bestillingsstatus = 'ny' | 'levert' | 'fakturert' | 'betalt' | 'kansellert'

export const BESTILLINGSSTATUSER: { id: Bestillingsstatus; navn: string }[] = [
  { id: 'ny', navn: 'Ny' },
  { id: 'levert', navn: 'Levert' },
  { id: 'fakturert', navn: 'Fakturert' },
  { id: 'betalt', navn: 'Betalt' },
  { id: 'kansellert', navn: 'Kansellert' },
]

/** Grenser som også håndheves i firestore.rules. Holdes like. */
export const MAKS_BESTILLING = { kort: 200, epost: 254, telefon: 40, design: 20000, merknad: 2000, orgnr: 9, postnr: 4 } as const

/**
 * Versjonen av kjøpsvilkårene på /vilkar/logo. Endres vilkårene, endres
 * denne – den lagres på hver bestilling, så det alltid er klart hva et kjøp
 * ble gjort på.
 */
export const VILKAR_VERSJON = '2026-11-10'

/**
 * Samtykket kunden krysser av for før «Bestill». Lagres ordrett på
 * bestillingen sammen med versjonen. Lenken til vilkårene står ved siden av
 * avkrysningen i verktøyet.
 */
export const VILKAR =
  `Jeg har lest kjøpsvilkårene (versjon ${VILKAR_VERSJON}) og bestiller med plikt til å betale. ` +
  'Jeg forstår at jeg blir fakturert med 14 dagers forfall. Jeg samtykker til at filene leveres ' +
  'med en gang, og er kjent med at angreretten da faller bort.'

export interface NyLogobestilling {
  produkt: Produkt
  /** Bedriftsnavnet logoen er laget for – og som faktureres. */
  bedrift: string
  /** Organisasjonsnummer, ni sifre. Tomt for privatpersoner. */
  orgnr: string
  /** Fakturaadresse. */
  adresse: string
  postnr: string
  poststed: string
  /** Kontaktperson. */
  navn: string
  telefon: string
  /** Fritekst fra kunden – fakturaadresse, ønsker, org.nr. */
  merknad: string
  /** Hele designet, serialisert. Lar Vimzo åpne nøyaktig det kunden så. */
  design: string
}

export interface Logobestilling extends Omit<NyLogobestilling, 'produkt'> {
  id: string
  produkt: Ordreprodukt
  /** På en oppgradering: logobestillingen som ble oppgradert. */
  oppgraderer: string | null
  uid: string
  epost: string
  pris: number
  status: Bestillingsstatus
  /** Vilkårsteksten kunden godtok, ordrett. */
  vilkar: string
  opprettet: number
  oppdatert: number
}

const kutt = (s: string, n: number) => s.slice(0, n)

/**
 * Legg inn en bestilling for den innloggede kunden, og varsle Vimzo.
 *
 * Kaster hvis kunden ikke er innlogget med bekreftet e-post, eller hvis
 * Firebase ikke er satt opp – da finnes det ingen ordrelinje å fakturere
 * fra, og kunden må få vite det. E-postvarselet er best-effort: feiler det,
 * står bestillingen uansett i /admin.
 */
export async function bestillLogo(b: NyLogobestilling): Promise<string> {
  if (!firebaseKlar) throw new Error('Bestilling er ikke tilgjengelig akkurat nå')
  const [{ addDoc, collection, serverTimestamp }, { getAuth }, db] = await Promise.all([
    import('firebase/firestore'),
    import('firebase/auth'),
    hentDb(),
  ])
  const bruker = getAuth().currentUser
  if (!bruker?.email || !bruker.emailVerified) throw new Error('Du må være innlogget for å bestille')

  const produkt = PRODUKTER[b.produkt]
  const orgnr = b.orgnr.replace(/\s/g, '')
  if (orgnr && !/^\d{9}$/.test(orgnr)) throw new Error('Organisasjonsnummeret må ha ni sifre')
  if (!b.bedrift.trim() || !b.adresse.trim() || !/^\d{4}$/.test(b.postnr.trim()) || !b.poststed.trim())
    throw new Error('Fyll inn firmanavn og fakturaadresse')

  const ref = await addDoc(collection(db, SAMLING), {
    uid: bruker.uid,
    epost: bruker.email.toLowerCase(),
    produkt: b.produkt,
    pris: produkt.pris,
    bedrift: kutt(b.bedrift.trim(), MAKS_BESTILLING.kort),
    orgnr,
    adresse: kutt(b.adresse.trim(), MAKS_BESTILLING.kort),
    postnr: b.postnr.trim(),
    poststed: kutt(b.poststed.trim(), MAKS_BESTILLING.kort),
    navn: kutt(b.navn, MAKS_BESTILLING.kort),
    telefon: kutt(b.telefon, MAKS_BESTILLING.telefon),
    merknad: kutt(b.merknad, MAKS_BESTILLING.merknad),
    design: kutt(b.design, MAKS_BESTILLING.design),
    vilkar: VILKAR,
    // Levert i det filene lastes ned – som skjer rett etter at dette er lagret.
    status: 'levert',
    opprettet: serverTimestamp(),
  })

  await varsleVimzo({
    emne: `Fakturer: ${produkt.navn} – ${b.bedrift} (${produkt.pris} kr eks. mva)`,
    navn: b.navn,
    bedrift: b.bedrift,
    epost: bruker.email,
    telefon: b.telefon,
    melding: [
      `${produkt.navn} – ${produkt.pris} kr eks. mva. Filene er lastet ned; send faktura.`,
      '',
      `${b.bedrift}${orgnr ? ` (org.nr ${orgnr})` : ''}`,
      `${b.adresse}, ${b.postnr} ${b.poststed}`,
      `${b.navn} · ${bruker.email}${b.telefon ? ` · ${b.telefon}` : ''}`,
      b.merknad && `Merknad: ${b.merknad}`,
      '',
      `Ordrelinje: https://vimzo.no/admin/logo`,
    ]
      .filter(Boolean)
      .join('\n'),
    brief: `Bestilling ${ref.id}`,
  })

  // Ordrebekreftelse til kunden – kjøpet skal bekreftes skriftlig uten
  // ugrunnet opphold (ehandelsloven § 10).
  const inklMva = Math.round(produkt.pris * 125) / 100
  await bekreftTilKunde({
    emne: `Ordrebekreftelse: ${produkt.navn} fra Vimzo`,
    navn: b.navn,
    bedrift: b.bedrift,
    epost: bruker.email,
    telefon: b.telefon,
    melding: [
      `Takk for bestillingen! Filene er lastet ned i nettleseren din, og du kan laste dem ned igjen fra kontoen din.`,
      '',
      `${produkt.navn}: ${produkt.pris} kr eks. mva (${inklMva.toLocaleString('nb-NO')} kr inkl. mva).`,
      `Faktura sendes til ${bruker.email} innen én virkedag, med 14 dagers forfall.`,
      b.produkt === 'profil' &&
        'E-postsignatur og bilder til sosiale medier lager du på Min side: https://vimzo.no/min-side (trykk «Signatur og SoMe» på logoen).',
      `Fakturaadresse: ${b.bedrift}${orgnr ? ` (org.nr ${orgnr})` : ''}, ${b.adresse}, ${b.postnr} ${b.poststed}.`,
      '',
      `Kjøpsvilkår (versjon ${VILKAR_VERSJON}): https://vimzo.no/vilkar/logo`,
    ]
      .filter((l) => l !== false)
      .join('\n'),
    brief: `Bestilling ${ref.id}`,
  })

  return ref.id
}

/**
 * Oppgrader en kjøpt logo til hele profilen.
 *
 * En egen ordrelinje på mellomlegget, fakturert til samme firma og adresse
 * som logoen – kunden har gitt oss alt det fra før, og skal ikke fylle ut
 * det samme skjemaet to ganger. Designet er det som ble kjøpt; profilen
 * lages av nøyaktig den logoen.
 *
 * Reglene (firestore.rules → gyldigOppgradering) krever at `oppgraderer`
 * er en logobestilling på samme konto.
 */
export async function oppgraderTilProfil(logo: Logobestilling): Promise<string> {
  if (!firebaseKlar) throw new Error('Bestilling er ikke tilgjengelig akkurat nå')
  if (logo.produkt !== 'logo') throw new Error('Bare en logo kjøpt alene kan oppgraderes')
  const [{ addDoc, collection, serverTimestamp }, { getAuth }, db] = await Promise.all([
    import('firebase/firestore'),
    import('firebase/auth'),
    hentDb(),
  ])
  const bruker = getAuth().currentUser
  if (!bruker?.email || !bruker.emailVerified) throw new Error('Du må være innlogget for å bestille')

  const ref = await addDoc(collection(db, SAMLING), {
    uid: bruker.uid,
    epost: bruker.email.toLowerCase(),
    produkt: 'oppgradering',
    pris: OPPGRADERING.pris,
    oppgraderer: logo.id,
    bedrift: logo.bedrift,
    orgnr: logo.orgnr,
    adresse: logo.adresse,
    postnr: logo.postnr,
    poststed: logo.poststed,
    navn: logo.navn,
    telefon: logo.telefon,
    merknad: '',
    design: logo.design,
    vilkar: VILKAR,
    status: 'levert',
    opprettet: serverTimestamp(),
  })

  const adresse = `${logo.bedrift}${logo.orgnr ? ` (org.nr ${logo.orgnr})` : ''}, ${logo.adresse}, ${logo.postnr} ${logo.poststed}`
  await varsleVimzo({
    emne: `Fakturer: ${OPPGRADERING.navn} – ${logo.bedrift} (${OPPGRADERING.pris} kr eks. mva)`,
    navn: logo.navn,
    bedrift: logo.bedrift,
    epost: bruker.email,
    telefon: logo.telefon,
    melding: [
      `${OPPGRADERING.navn} – ${OPPGRADERING.pris} kr eks. mva. Profilen er låst opp; send faktura.`,
      `Oppgraderer logobestilling ${logo.id}.`,
      '',
      adresse,
      `${logo.navn} · ${bruker.email}${logo.telefon ? ` · ${logo.telefon}` : ''}`,
      '',
      `Ordrelinje: https://vimzo.no/admin/logo`,
    ].join('\n'),
    brief: `Bestilling ${ref.id}`,
  })

  const inklMva = Math.round(OPPGRADERING.pris * 125) / 100
  await bekreftTilKunde({
    emne: `Ordrebekreftelse: ${OPPGRADERING.navn} fra Vimzo`,
    navn: logo.navn,
    bedrift: logo.bedrift,
    epost: bruker.email,
    telefon: logo.telefon,
    melding: [
      'Takk! Profilen er låst opp. Profilbok, mockups, e-postsignatur og bilder til sosiale medier finner du på Min side: https://vimzo.no/min-side',
      '',
      `${OPPGRADERING.navn}: ${OPPGRADERING.pris} kr eks. mva (${inklMva.toLocaleString('nb-NO')} kr inkl. mva).`,
      `Faktura sendes til ${bruker.email} innen én virkedag, med 14 dagers forfall.`,
      `Fakturaadresse: ${adresse}.`,
      '',
      `Kjøpsvilkår (versjon ${VILKAR_VERSJON}): https://vimzo.no/vilkar/logo`,
    ].join('\n'),
    brief: `Bestilling ${ref.id}`,
  })

  return ref.id
}

/* ------------------------------------------------------------------ lesing */

const ms = (v: unknown): number =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : Number(v) || Date.now()

function tilBestilling(id: string, d: DocumentData): Logobestilling {
  return {
    id,
    uid: d.uid ?? '',
    epost: d.epost ?? '',
    produkt: d.produkt === 'profil' || d.produkt === 'oppgradering' ? d.produkt : 'logo',
    oppgraderer: typeof d.oppgraderer === 'string' ? d.oppgraderer : null,
    pris: d.pris ?? 0,
    bedrift: d.bedrift ?? '',
    orgnr: d.orgnr ?? '',
    adresse: d.adresse ?? '',
    postnr: d.postnr ?? '',
    poststed: d.poststed ?? '',
    navn: d.navn ?? '',
    telefon: d.telefon ?? '',
    merknad: d.merknad ?? '',
    design: d.design ?? '',
    vilkar: d.vilkar ?? '',
    status: d.status ?? 'ny',
    opprettet: ms(d.opprettet),
    oppdatert: ms(d.oppdatert ?? d.opprettet),
  }
}

/** Én bestilling – for kunden selv (egen) eller admin. */
export async function hentLogobestilling(id: string): Promise<Logobestilling | null> {
  if (!firebaseKlar) return null
  const [{ doc, getDoc }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  const d = await getDoc(doc(db, SAMLING, id))
  return d.exists() ? tilBestilling(d.id, d.data()) : null
}

/** Kunden: lytt på egne bestillinger (sortert her, så det ikke trengs en indeks). */
export async function lyttMineLogobestillinger(
  uid: string,
  ved: (liste: Logobestilling[]) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, query, where }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING), where('uid', '==', uid)),
    (snap) => ved(snap.docs.map((d) => tilBestilling(d.id, d.data())).sort((a, b) => b.opprettet - a.opprettet)),
    vedFeil,
  )
}

/** Admin: lytt på alle bestillinger, nyeste først. */
export async function lyttLogobestillinger(
  ved: (liste: Logobestilling[]) => void,
  vedFeil: (e: Error) => void,
): Promise<Unsubscribe> {
  const [{ collection, onSnapshot, orderBy, query }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  return onSnapshot(
    query(collection(db, SAMLING), orderBy('opprettet', 'desc')),
    (snap) => ved(snap.docs.map((d) => tilBestilling(d.id, d.data()))),
    vedFeil,
  )
}

/** Admin: flytt ordrelinjen videre. */
export async function settBestillingsstatus(id: string, status: Bestillingsstatus): Promise<void> {
  const [{ doc, updateDoc, serverTimestamp }, db] = await Promise.all([import('firebase/firestore'), hentDb()])
  await updateDoc(doc(db, SAMLING, id), { status, oppdatert: serverTimestamp() })
}

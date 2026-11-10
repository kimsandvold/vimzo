import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { firebaseKlar, hentAuth } from '../../../lib/firebase'
import { PRODUKTER as PRISER, bestillLogo, type Produkt } from '../../../lib/logobestillinger'
import type { Design, Innhold } from './motor'

/**
 * Kjøp av logo og visuell profil.
 *
 * Verktøyet krever innlogging, men å lage og se på logoen koster ingenting –
 * det er filene som koster. Foreløpig er kjøpet en bestilling: kunden
 * bestiller, og vi sender filene og faktura innen én virkedag.
 *
 * Alt som har med betaling å gjøre, går gjennom `startKjop`. Når Vipps eller
 * Stripe kobles på, er det den ene funksjonen som skal skrives om.
 */

/**
 * Produktene. Navn og pris kommer fra bestillingslaget, så prisen står ett
 * sted; her ligger bare det som vises på kortene.
 */
export const PRODUKTER = {
  logo: {
    ...PRISER.logo,
    innhold: [
      'Logoen i SVG, PDF, PNG og JPG',
      'Fullfarge, svart, hvit og to farger',
      'Gravering, farger, skrift og favikon',
    ],
  },
  profil: {
    ...PRISER.profil,
    innhold: [
      'Alt i Logo',
      'Profilbok (PDF) med farger, skrift og regler',
      'Bilder til sosiale medier og e-postsignatur',
      'Mockups i høy oppløsning',
    ],
  },
} as const

export type ProduktId = Produkt

export const formaterKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

/* --------------------------------------------------------------- innlogging */

/**
 * Brukeren, fra samme Firebase-innlogging som /min-side. `undefined` mens
 * vi venter på svar, `null` når ingen er logget inn.
 */
export function useBruker(): User | null | undefined {
  const [bruker, setBruker] = useState<User | null | undefined>(() => demoBruker() ?? (firebaseKlar ? undefined : null))
  useEffect(() => {
    if (!firebaseKlar || demoBruker()) return
    let stopp = () => {}
    let aktiv = true
    Promise.all([hentAuth(), import('firebase/auth')]).then(([auth, { onAuthStateChanged }]) => {
      if (aktiv) stopp = onAuthStateChanged(auth, setBruker)
    })
    return () => {
      aktiv = false
      stopp()
    }
  }, [])
  return bruker
}

/**
 * Bare i utvikling: `?demo=1` gir en oppdiktet, bekreftet bruker, så
 * verktøyet kan testes og fotograferes uten ekte innlogging. `?test=1` gir
 * den samme brukeren, og i tillegg går bestilling og lagring til falske
 * utgaver i minnet (testsom.ts) – se `erTest`. `import.meta.env.DEV` er
 * usann i produksjonsbygget, så ingen av grenene finnes der.
 */
function demoBruker(): User | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null
  const test = erTest()
  if (!test && !location.search.includes('demo=1')) return null
  return {
    // Testbrukeren er ikke «demo»: verktøyet hopper over lagring i skyen for
    // demo, men skal gjøre den – mot testsømmen – i en testkjøring.
    uid: test ? 'vimzo-test' : 'demo',
    email: test ? 'test@vimzo.test' : 'demo@vimzo.no',
    displayName: test ? 'Test Testesen' : 'Demo',
    emailVerified: true,
    providerData: [{ providerId: 'google.com' }],
  } as unknown as User
}

/**
 * Testsømmen er på: utvikling og `?test=1`. Kalles alltid som
 * `import.meta.env.DEV && erTest()`, så hele grenen – og importen av
 * testsom.ts – forsvinner fra produksjonsbygget.
 */
export function erTest(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('test') === '1'
}

export async function loggInnGoogle(): Promise<void> {
  const [auth, { GoogleAuthProvider, signInWithPopup, signInWithRedirect }] = await Promise.all([
    hentAuth(),
    import('firebase/auth'),
  ])
  const leverandor = new GoogleAuthProvider()
  leverandor.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, leverandor)
  } catch (e) {
    const kode = (e as { code?: string }).code
    if (kode === 'auth/popup-blocked' || kode === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, leverandor)
    } else if (kode !== 'auth/popup-closed-by-user' && kode !== 'auth/cancelled-popup-request') {
      throw e
    }
  }
}

/**
 * E-post og passord. Ny konto sender bekreftelse, slik /min-side gjør – en
 * bestilling på en adresse man ikke eier, skal ikke kunne legges inn.
 */
export async function loggInnPassord(epost: string, passord: string, ny: boolean): Promise<void> {
  const [auth, f] = await Promise.all([hentAuth(), import('firebase/auth')])
  if (ny) {
    const { user } = await f.createUserWithEmailAndPassword(auth, epost, passord)
    await f.sendEmailVerification(user)
  } else {
    await f.signInWithEmailAndPassword(auth, epost, passord)
  }
}

/**
 * En passordkonto må bekrefte e-posten før den kan bestille – bestillings-
 * laget og reglene krever det. Etter at kunden har klikket lenken, må
 * brukerobjektet lastes på nytt for å se det.
 */
export async function sjekkBekreftet(bruker: User): Promise<boolean> {
  await bruker.reload()
  await bruker.getIdToken(true)
  return bruker.emailVerified
}

export async function sendBekreftelseIgjen(bruker: User) {
  const { sendEmailVerification } = await import('firebase/auth')
  await sendEmailVerification(bruker)
}

export async function loggUt() {
  const [auth, { signOut }] = await Promise.all([hentAuth(), import('firebase/auth')])
  await signOut(auth)
}

export const innloggingMulig = firebaseKlar

/* ----------------------------------------------------------------- bestilling */

/**
 * Designet slik det lagres på bestillingen: kompakt JSON, uten bilder.
 * Det er nok til å tegne nøyaktig den samme logoen på nytt i /admin.
 */
export function serialiser(design: Design, innhold: Innhold): string {
  return JSON.stringify({ versjon: 1, design, innhold })
}

/**
 * Start et kjøp.
 *
 * TODO(betaling): i dag lager dette en bestilling som faktureres manuelt.
 * Når Vipps eller Stripe er valgt, opprett betalingen her og send kunden
 * videre til betalingssiden. Filene bør da lages på serveren etter at
 * betalingen er bekreftet – ikke i nettleseren.
 */
export interface Kjopsdata {
  produkt: ProduktId
  bedrift: string
  orgnr: string
  adresse: string
  postnr: string
  poststed: string
  kontaktnavn: string
  telefon: string
  merknad: string
  design: Design
  innhold: Innhold
}

export async function startKjop(k: Kjopsdata): Promise<string> {
  const lagre =
    import.meta.env.DEV && erTest() ? (await import('./testsom')).falskBestilling : bestillLogo
  return lagre({
    produkt: k.produkt,
    bedrift: k.bedrift.trim() || k.innhold.navn.trim(),
    orgnr: k.orgnr.replace(/\s/g, ''),
    adresse: k.adresse.trim(),
    postnr: k.postnr.trim(),
    poststed: k.poststed.trim(),
    navn: k.kontaktnavn.trim(),
    telefon: k.telefon.trim(),
    merknad: k.merknad.trim(),
    design: serialiser(k.design, k.innhold),
  })
}

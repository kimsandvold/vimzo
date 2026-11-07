import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

/**
 * Firebase – lagring av henvendelser og innlogging til /admin.
 *
 * Alt lastes først når det trengs: når noen sender et skjema, eller åpner
 * /admin. Vanlige besøkende laster aldri en byte av Firebase, så forsiden er
 * like rask som før.
 *
 * Konfigurasjonen er offentlig av natur – den ligger i nettleseren hos alle
 * som bruker appen. Det som beskytter dataene, er sikkerhetsreglene i
 * `firestore.rules`, ikke at nøklene er hemmelige.
 */

/**
 * Innloggingsdomenet.
 *
 * På vimzo.no går Google-innloggingen via vimzo.no selv, ikke via
 * vimzo-73890.firebaseapp.com – ellers står Firebase-adressen i Googles
 * «Fortsett til …». Det virker fordi Firebase sine innloggingsfiler ligger
 * under public/__/auth/ og serveres fra vårt eget domene. Lokalt, og på
 * andre adresser, brukes Firebase-domenet som før.
 */
const EGET_DOMENE = 'vimzo.no'
const authDomain =
  typeof window !== 'undefined' && window.location.hostname === EGET_DOMENE
    ? EGET_DOMENE
    : (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)

const konfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** Sant når Firebase er satt opp. Uten det lagres ingenting, og /admin sier fra. */
export const firebaseKlar = Boolean(konfig.apiKey && konfig.authDomain && konfig.projectId && konfig.appId)

let app: Promise<FirebaseApp> | null = null

function hentApp(): Promise<FirebaseApp> {
  if (!firebaseKlar) return Promise.reject(new Error('Firebase er ikke satt opp'))
  app ??= import('firebase/app').then(({ initializeApp, getApps, getApp }) =>
    getApps().length ? getApp() : initializeApp(konfig as Required<typeof konfig>),
  )
  return app
}

export async function hentDb(): Promise<Firestore> {
  const [{ getFirestore }, a] = await Promise.all([import('firebase/firestore'), hentApp()])
  return getFirestore(a)
}

export async function hentAuth(): Promise<Auth> {
  const [{ getAuth }, a] = await Promise.all([import('firebase/auth'), hentApp()])
  return getAuth(a)
}

import { emailjsKlar, sendHenvendelse, type Henvendelse } from './emailjs'
import { firebaseKlar } from './firebase'
import { lagreHenvendelse } from './henvendelser'
import type { NyHenvendelse } from '../data/saker'

/**
 * Sending av en henvendelse: e-post via EmailJS og lagring i Firestore, side
 * om side.
 *
 * Henvendelsen regnes som mottatt hvis minst én av dem går gjennom. Er
 * EmailJS nede, ligger den i /admin; er Firestore nede, ligger den i
 * innboksen. Bare når begge feiler, får kunden beskjed om å prøve igjen.
 */

/** Sant når skjemaene kan sende selv. Ellers faller de tilbake til mailto. */
export const kanSende = emailjsKlar || firebaseKlar

/**
 * Firestore gir ikke feil når nettet er borte – den legger skrivingen i kø
 * og venter. Uten en grense ville skjemaet stått på «Sender …» for alltid.
 */
const LAGRING_TIDSGRENSE_MS = 12_000

function medTidsgrense<T>(lofte: Promise<T>, ms: number): Promise<T> {
  return Promise.race([lofte, new Promise<T>((_, avvis) => setTimeout(() => avvis(new Error('Tidsavbrudd')), ms))])
}

export async function sendInn(epost: Henvendelse, lagring: NyHenvendelse): Promise<void> {
  const epostSendt = emailjsKlar ? sendHenvendelse(epost) : Promise.reject(new Error('EmailJS er ikke satt opp'))
  const lagret = medTidsgrense(
    lagreHenvendelse(lagring).then((ok) => {
      if (!ok) throw new Error('Firebase er ikke satt opp')
    }),
    LAGRING_TIDSGRENSE_MS,
  )

  // Det som feiler, logges – men kunden skal ikke vente på det.
  epostSendt.catch((e) => emailjsKlar && console.error('E-posten ble ikke sendt:', e))
  lagret.catch((e) => firebaseKlar && console.error('Henvendelsen ble ikke lagret:', e))

  // «Sendt» så snart én av dem er bekreftet. Den andre fullfører i bakgrunnen.
  // Bare når begge feiler, kaster dette – og kunden får beskjed om å prøve igjen.
  try {
    await Promise.any([epostSendt, lagret])
  } catch {
    throw new Error('Verken e-post eller lagring gikk gjennom')
  }
}

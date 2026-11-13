import { prosentAv, type Ore } from './kroner'
import { finnAgaSone } from '../data/timepris'

/**
 * Hva en ansatt faktisk koster.
 *
 * Spørsmålet småbedrifter stiller før de ansetter, og svaret folk flest
 * bommer på: lønnen er ikke kostnaden. Feriepenger, arbeidsgiveravgift og
 * obligatorisk tjenestepensjon kommer oppå, og arbeidsgiveravgiften beregnes
 * av alt sammen – også av pensjonsinnskuddet.
 *
 * Så kommer det ingen lønnsslipp viser: arbeidsplass, utstyr, forsikring,
 * kurs og programvare. De koster like mye enten den ansatte er produktiv
 * eller ikke, og de hører hjemme i beslutningen.
 *
 * Ren funksjon, ingen React. Testet i `ansatt.test.ts`.
 */

export interface Ansattgrunnlag {
  /** Bruttolønn per år – beløpet på lønnsslippen. */
  readonly bruttolonn: Ore
  readonly agaSone: string
  /** Prosent. 12 ved fem uker ferie, 10,2 ved lovens minimum. */
  readonly feriepengesats: number
  /** Prosent. 2 er lovens minimum for obligatorisk tjenestepensjon. */
  readonly pensjonssats: number
  /** Arbeidsplass, utstyr, forsikring, kurs, programvare – per år. */
  readonly andreKostnader: Ore
  /** Hvor mange timer den ansatte er på jobb i året. */
  readonly arbeidstimer: number
  /** Prosent av arbeidstimene som kan faktureres videre til kunde. */
  readonly fakturerbarAndel: number
}

export interface Ansattkostnad {
  readonly bruttolonn: Ore
  readonly feriepenger: Ore
  readonly arbeidsgiveravgift: Ore
  readonly pensjon: Ore
  readonly andreKostnader: Ore
  readonly sumPerAr: Ore
  readonly sumPerManed: Ore
  /**
   * Hvor mange ganger lønnen den ansatte koster. 600 000 i lønn som koster
   * 830 000, gir 1,38. Dette er tallet folk husker.
   */
  readonly faktor: number
  /** Kostnad fordelt på alle timene den ansatte er på jobb. */
  readonly kostnadPerArbeidstime: Ore | null
  /**
   * Hva den ansatte må fakturere i timen for å bære sin egen kostnad.
   * `null` når ingen timer er fakturerbare – da er den ansatte en ren
   * kostnad, og det er en annen vurdering.
   */
  readonly nullpunktTimepris: Ore | null
  readonly fakturerbareTimer: number
}

export function beregnAnsattkostnad(g: Ansattgrunnlag): Ansattkostnad {
  const feriepenger = prosentAv(g.bruttolonn, g.feriepengesats)
  const pensjon = prosentAv(g.bruttolonn, g.pensjonssats)
  // Samme grunnlag som i timepriskalkulatoren: lønn, feriepenger og
  // pensjonsinnskudd er alle avgiftspliktige.
  const arbeidsgiveravgift = prosentAv(g.bruttolonn + feriepenger + pensjon, finnAgaSone(g.agaSone).sats)

  const sumPerAr = g.bruttolonn + feriepenger + arbeidsgiveravgift + pensjon + g.andreKostnader

  const arbeidstimer = Math.max(0, g.arbeidstimer)
  const fakturerbareTimer = (arbeidstimer * Math.min(100, Math.max(0, g.fakturerbarAndel))) / 100

  return {
    bruttolonn: g.bruttolonn,
    feriepenger,
    arbeidsgiveravgift,
    pensjon,
    andreKostnader: g.andreKostnader,
    sumPerAr,
    sumPerManed: Math.round(sumPerAr / 12),
    faktor: g.bruttolonn > 0 ? sumPerAr / g.bruttolonn : 0,
    kostnadPerArbeidstime: arbeidstimer > 0 ? Math.round(sumPerAr / arbeidstimer) : null,
    nullpunktTimepris: fakturerbareTimer > 0 ? Math.round(sumPerAr / fakturerbareTimer) : null,
    fakturerbareTimer,
  }
}

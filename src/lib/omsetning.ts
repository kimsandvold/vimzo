import type { Ore } from './kroner'
import { beregnLonnskostnad, type Driftsform, type Lonnskostnad } from './timepris'

/**
 * Hvor mye må du fakturere for å gå rundt?
 *
 * Timepriskalkulatoren svarer på hva én time må koste. Denne svarer på det
 * andre halve spørsmålet: hvor mange av dem du må selge.
 *
 * Det er den samme kalkylen snudd. I stedet for å dele kostnadene på timene
 * du har, deler vi dem på prisen du tar – og får ut hvor mange timer du må
 * fakturere. Så regner vi den tilbake til arbeidstimer, og det er der
 * regnestykket pleier å bli ubehagelig: skal du fakturere 150 timer i
 * måneden og bare 65 % av tiden din er fakturerbar, må du være på jobb 231.
 *
 * Ren funksjon, ingen React. Testet i `omsetning.test.ts`.
 */

export interface Omsetningsgrunnlag {
  readonly driftsform: Driftsform
  readonly onsketInntekt: Ore
  readonly agaSone: string
  readonly fasteKostnader: Ore
  /** Det du tar i timen i dag, eks. mva. */
  readonly timepris: Ore
  readonly fakturerbarAndel: number
  readonly arbeidsuker: number
  /** Snittpris på et oppdrag. 0 når brukeren ikke vil regne i oppdrag. */
  readonly snittOppdrag: Ore
}

export interface Omsetningskrav {
  readonly lonnskostnad: Lonnskostnad
  readonly nodvendigOmsetning: Ore
  readonly omsetningPerManed: Ore
  /** `null` når timeprisen er null – da finnes det ingen mengde som holder. */
  readonly fakturerbareTimerPerAr: number | null
  readonly fakturerbareTimerPerManed: number | null
  readonly fakturerbareTimerPerUke: number | null
  /** Hva det tilsvarer i faktisk arbeidstid, gitt at ikke alt er fakturerbart. */
  readonly arbeidstimerPerUke: number | null
  /** `null` når brukeren ikke har oppgitt noen snittpris. */
  readonly oppdragPerAr: number | null
  readonly oppdragPerManed: number | null
}

export function beregnOmsetningskrav(g: Omsetningsgrunnlag): Omsetningskrav {
  const lonnskostnad = beregnLonnskostnad(g.driftsform, g.onsketInntekt, g.agaSone)
  const nodvendigOmsetning = lonnskostnad.sum + g.fasteKostnader

  const uker = Math.max(1, g.arbeidsuker)
  const andel = Math.min(100, Math.max(0, g.fakturerbarAndel))

  const timerPerAr = g.timepris > 0 ? nodvendigOmsetning / g.timepris : null
  const arbeidstimerPerUke = timerPerAr !== null && andel > 0 ? timerPerAr / (andel / 100) / uker : null

  const oppdragPerAr = g.snittOppdrag > 0 ? nodvendigOmsetning / g.snittOppdrag : null

  return {
    lonnskostnad,
    nodvendigOmsetning,
    omsetningPerManed: Math.round(nodvendigOmsetning / 12),
    fakturerbareTimerPerAr: timerPerAr,
    fakturerbareTimerPerManed: timerPerAr === null ? null : timerPerAr / 12,
    fakturerbareTimerPerUke: timerPerAr === null ? null : timerPerAr / uker,
    arbeidstimerPerUke,
    oppdragPerAr,
    oppdragPerManed: oppdragPerAr === null ? null : oppdragPerAr / 12,
  }
}

import { delOre, leggTilProsent, prosentAv, rundOppTilTier, type Ore } from './kroner'
import { FERIEPENGESATS, finnAgaSone, OTP_SATS } from '../data/timepris'

/**
 * Driftsform.
 *
 * Skillet er ikke en formalitet – det er den vanligste kilden til feil
 * timepris. I et enkeltpersonforetak er «det du vil tjene» overskuddet i
 * foretaket, og skatten er eierens private sak. I et aksjeselskap tar eieren
 * lønn, og lønn koster selskapet langt mer enn beløpet på lønnsslippen.
 *
 * Regner man som om de to var like, bommer man med godt over hundre kroner
 * i timen. Se `src/beregning/timepris.ts`.
 */
export type Driftsform = 'enk' | 'as'

/** De faste kostnadene, som egne poster. Brukeren ser hver enkelt. */
export interface FasteKostnader {
  readonly lokale: Ore
  readonly forsikring: Ore
  readonly verktoy: Ore
  readonly transport: Ore
  readonly regnskap: Ore
  readonly kontor: Ore
  readonly annet: Ore
}

export interface Grunnlag {
  readonly driftsform: Driftsform
  /**
   * For ENK: ønsket overskudd før skatt.
   * For AS: ønsket bruttolønn til deg selv.
   */
  readonly onsketInntekt: Ore
  /** Bare relevant for AS. Ignoreres for ENK. */
  readonly agaSone: string
  readonly fasteKostnader: FasteKostnader
  readonly arbeidsuker: number
  readonly timerPerUke: number
  /** Prosent av arbeidstimene som faktisk kan faktureres. */
  readonly fakturerbarAndel: number
  /** Prosent påslag ut over det som dekker lønn og kostnader. */
  readonly buffer: number
  /** Hva brukeren tar i dag. `null` når feltet står tomt. */
  readonly dagensTimepris: Ore | null
}

/** Hva lønnen faktisk koster. For ENK er alt bortsett fra `inntekt` null. */
export interface Lonnskostnad {
  readonly inntekt: Ore
  readonly feriepenger: Ore
  readonly arbeidsgiveravgift: Ore
  readonly pensjon: Ore
  readonly sum: Ore
}

export interface Avvik {
  readonly dagensTimepris: Ore
  /** Positiv når brukeren tar for lite. */
  readonly perTime: Ore
  /** Hva avviket utgjør på et år med de fakturerbare timene. */
  readonly perAr: Ore
  readonly tarForLite: boolean
}

export interface Kalkyle {
  readonly arbeidstimer: number
  readonly fakturerbareTimer: number
  readonly lonnskostnad: Lonnskostnad
  readonly fasteKostnaderSum: Ore
  readonly nodvendigDekning: Ore
  /** `null` når brukeren ikke har noen fakturerbare timer å dele på. */
  readonly minsteTimepris: Ore | null
  readonly anbefaltTimepris: Ore | null
  /** Anbefalt timepris rundet opp til nærmeste tier – tallet vi viser størst. */
  readonly anbefaltAvrundet: Ore | null
  readonly omsetningPerAr: Ore | null
  readonly omsetningPerManed: Ore | null
  /** Hvor mange prosent høyere timeprisen må være fordi ikke alt er fakturerbart. */
  readonly pastandOmUbetaltTid: number | null
  readonly avvik: Avvik | null
}

/**
 * Selve regnestykket.
 *
 * Ren funksjon, ingen React, ingen sideeffekter. Den tar et grunnlag og gir
 * en kalkyle, og kan testes uten at noe tegnes på skjermen. Testvektorene i
 * `timepris.test.ts` er regnet for hånd og er fasiten – avviker koden, er
 * det koden som tar feil.
 *
 * Kjeden er kort:
 *
 *   arbeidstimer       = uker × timer per uke
 *   fakturerbare timer = arbeidstimer × fakturerbar andel
 *   nødvendig dekning  = lønnskostnad + faste kostnader
 *   minste timepris    = nødvendig dekning / fakturerbare timer
 *   anbefalt timepris  = minste timepris + buffer
 */

export function summerFasteKostnader(k: FasteKostnader): Ore {
  return k.lokale + k.forsikring + k.verktoy + k.transport + k.regnskap + k.kontor + k.annet
}

/**
 * Hva det koster å gi deg selv den inntekten du vil ha.
 *
 * For et enkeltpersonforetak er svaret like enkelt som folk tror det er:
 * overskuddet er det du vil sitte igjen med før skatt, og skatten betaler du
 * privat. Ingenting legges på.
 *
 * For et aksjeselskap er svaret et helt annet, og det er her folk bommer.
 * Skal du ha 600 000 i lønn, koster det selskapet nærmere 780 000 når
 * feriepenger, arbeidsgiveravgift og obligatorisk tjenestepensjon er med.
 * Den forskjellen må inn i timeprisen, ellers finansierer du selskapet ditt
 * av egen lomme.
 */
export function beregnLonnskostnad(driftsform: Grunnlag['driftsform'], inntekt: Ore, agaSone: string): Lonnskostnad {
  if (driftsform === 'enk') {
    return { inntekt, feriepenger: 0, arbeidsgiveravgift: 0, pensjon: 0, sum: inntekt }
  }

  const feriepenger = prosentAv(inntekt, FERIEPENGESATS)
  const pensjon = prosentAv(inntekt, OTP_SATS)
  // Grunnlaget for arbeidsgiveravgift er lønn, feriepenger OG
  // pensjonsinnskuddet. Feriepengene er lønn som utbetales senere, og premie
  // til pensjonsordning er avgiftspliktig på linje med lønn. Regner man bare
  // av lønnen, blir avgiften nesten 12 000 kroner for lav på en lønn på
  // 600 000 – og hele timeprisen for lav med den.
  const arbeidsgiveravgift = prosentAv(inntekt + feriepenger + pensjon, finnAgaSone(agaSone).sats)

  return {
    inntekt,
    feriepenger,
    arbeidsgiveravgift,
    pensjon,
    sum: inntekt + feriepenger + arbeidsgiveravgift + pensjon,
  }
}

export function beregnKalkyle(g: Grunnlag): Kalkyle {
  const arbeidstimer = Math.max(0, g.arbeidsuker) * Math.max(0, g.timerPerUke)
  const fakturerbareTimer = (arbeidstimer * Math.min(100, Math.max(0, g.fakturerbarAndel))) / 100

  const lonnskostnad = beregnLonnskostnad(g.driftsform, g.onsketInntekt, g.agaSone)
  const fasteKostnaderSum = summerFasteKostnader(g.fasteKostnader)
  const nodvendigDekning = lonnskostnad.sum + fasteKostnaderSum

  const minsteTimepris = delOre(nodvendigDekning, fakturerbareTimer)

  // Bufferen legges på den uavrundede dekningen, ikke på den avrundede
  // timeprisen. Ellers runder vi to ganger og sprer et avvik vi ikke trenger.
  const anbefaltTimepris = delOre(leggTilProsent(nodvendigDekning, g.buffer), fakturerbareTimer)
  const anbefaltAvrundet = anbefaltTimepris === null ? null : rundOppTilTier(anbefaltTimepris)

  // Omsetningen regnes av den AVRUNDEDE timeprisen, ikke av den eksakte.
  // Det er 700 kr brukeren kommer til å skrive på fakturaen, og da må
  // 700 × timer være tallet som står her. Regnet vi av 692,31 ville noen
  // ganget opp det store tallet selv og fått et annet svar enn kvitteringen
  // – og da er det kalkulatoren som mister troverdighet, ikke brukeren.
  const omsetningPerAr = anbefaltAvrundet === null ? null : Math.round(anbefaltAvrundet * fakturerbareTimer)
  const omsetningPerManed = omsetningPerAr === null ? null : Math.round(omsetningPerAr / 12)

  return {
    arbeidstimer,
    fakturerbareTimer,
    lonnskostnad,
    fasteKostnaderSum,
    nodvendigDekning,
    minsteTimepris,
    anbefaltTimepris,
    anbefaltAvrundet,
    omsetningPerAr,
    omsetningPerManed,
    pastandOmUbetaltTid: beregnUbetaltTillegg(g.fakturerbarAndel),
    avvik: beregnAvvik(g.dagensTimepris, anbefaltAvrundet, fakturerbareTimer),
  }
}

/**
 * Hvor mange prosent høyere timeprisen må være fordi ikke all tid kan
 * faktureres.
 *
 * Dette er setningen folk deler videre: «du jobber 1 840 timer, men kan bare
 * fakturere 1 196 – derfor må timeprisen være 54 % høyere enn du trodde».
 * Tallet er 100/andel − 100, og ved 65 % blir det 53,8 %.
 */
function beregnUbetaltTillegg(fakturerbarAndel: number): number | null {
  if (fakturerbarAndel <= 0 || fakturerbarAndel >= 100) return null
  return Math.round(10000 / fakturerbarAndel - 100)
}

/**
 * Forskjellen på det brukeren tar i dag og det hen burde ta.
 *
 * Sammenligningen gjøres mot den avrundede anbefalingen, fordi det er det
 * tallet brukeren faktisk ser og kommer til å fakturere.
 */
function beregnAvvik(
  dagensTimepris: Ore | null,
  anbefaltAvrundet: Ore | null,
  fakturerbareTimer: number,
): Kalkyle['avvik'] {
  if (dagensTimepris === null || dagensTimepris <= 0 || anbefaltAvrundet === null) return null

  const perTime = anbefaltAvrundet - dagensTimepris
  return {
    dagensTimepris,
    perTime,
    perAr: Math.round(perTime * fakturerbareTimer),
    tarForLite: perTime > 0,
  }
}

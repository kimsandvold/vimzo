/**
 * Penger i dette prosjektet er alltid heltall i øre.
 *
 * Flyttall er feil verktøy for kroner. 0.1 + 0.2 er ikke 0.3, og når en
 * kalkyle legger sammen tjue kostnadsposter og deler på antall timer, samler
 * de små avvikene seg opp til noe en snekker kan se på skjermen. Heltall i
 * øre har ingen slike avvik, og et pengebibliotek er en avhengighet vi ikke
 * trenger å betale for å slippe å tenke.
 *
 * Regelen er derfor: `Ore` inn, `Ore` ut, gjennom hele beregningen.
 * Avrunding skjer to steder, og bare to:
 *
 *   1. her, i `delOre`, når en divisjon ikke går opp
 *   2. i `rundOppTilTier`, på det ene tallet vi anbefaler brukeren å ta
 *
 * Visning gjør ingen avrunding – den formaterer bare det som allerede er
 * avrundet.
 */

/** Et pengebeløp i hele øre. 100 kr er 10 000. */
export type Ore = number

export const kronerTilOre = (kroner: number): Ore => Math.round(kroner * 100)

export const oreTilKroner = (ore: Ore): number => ore / 100

/**
 * Multipliser et beløp med en prosentsats.
 *
 * Satsen oppgis som prosent (12 for 12 %), ikke som brøk, fordi det er slik
 * den står i loven og i datafilene våre. Regnestykket gjøres i heltall og
 * avrundes først til slutt.
 */
export function prosentAv(ore: Ore, prosent: number): Ore {
  return Math.round((ore * prosent) / 100)
}

/** Legg en prosentsats til et beløp. `leggTilProsent(100_00, 15)` → `115_00`. */
export function leggTilProsent(ore: Ore, prosent: number): Ore {
  return ore + prosentAv(ore, prosent)
}

/**
 * Del et beløp på et antall, og rund til nærmeste øre.
 *
 * Halve øre rundes opp. Det er den vanlige konvensjonen, og i vår
 * sammenheng er det også den trygge retningen: en timepris som er ett øre
 * for høy skader ingen, en som er ett øre for lav er feil vei for brukeren.
 *
 * Deling på null er ikke en feil her – den oppstår naturlig når brukeren
 * ennå ikke har fylt ut hvor mye hen jobber. Den som kaller må håndtere
 * `null`, og vise en forklaring i stedet for et tall.
 */
export function delOre(ore: Ore, antall: number): Ore | null {
  if (!Number.isFinite(antall) || antall <= 0) return null
  return Math.round(ore / antall)
}

/**
 * Rund opp til nærmeste tikrone.
 *
 * Brukes bare på den anbefalte timeprisen. 692,31 kr er et riktig svar, men
 * ingen fakturerer 692,31 i timen – de tar 700. Vi runder opp og aldri ned,
 * fordi nedrunding spiser av bufferen brukeren nettopp ba om.
 */
export function rundOppTilTier(ore: Ore): Ore {
  const tier = 10 * 100
  return Math.ceil(ore / tier) * tier
}

const KRONER = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })
const KRONER_MED_ORE = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** «692 kr». Til store tall der ørene bare er støy. */
export const formaterKroner = (ore: Ore): string => `${KRONER.format(Math.round(oreTilKroner(ore)))} kr`

/** «692,31 kr». Til tall der presisjonen er poenget. */
export const formaterKronerMedOre = (ore: Ore): string => `${KRONER_MED_ORE.format(oreTilKroner(ore))} kr`

const TALL = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })

/** «1 196». Timer og antall – ikke penger. */
export const formaterTall = (n: number): string => TALL.format(Math.round(n))

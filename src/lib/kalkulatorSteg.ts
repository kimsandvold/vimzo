/**
 * Stegene i kalkulatoren på forsiden – som en ren tilstandsmaskin.
 *
 * Før lå dette som løse `setState`-kall og en `setTimeout` i komponenten, og
 * kalkulatoren kunne hoppe bakover: et valg satte i gang «videre om 0,3 s»,
 * kunden rakk å trykke et annet steg, og så fyrte tidtakeren og dro ham
 * tilbake. Eller han gikk tilbake fra steg fire for å bytte bransje, og ble
 * sendt videre til steg to – lenger bak enn der han kom fra.
 *
 * Reglene her er testet i `kalkulatorSteg.test.ts`:
 *  - Man kan alltid gå til et hvilket som helst steg, innenfor rekken.
 *  - Et valg sender videre av seg selv BARE første gang steget besvares –
 *    altså når man står ytterst. Går man tilbake for å endre, blir man stående.
 *  - En ventende «videre» gjelder bare hvis man fortsatt står på steget den
 *    ble satt fra.
 */

export interface Stegtilstand {
  /** Steget som vises. */
  steg: number
  /** Det lengste steget kunden har vært på. */
  lengst: number
  /** Hvilken vei forrige bytte gikk – steget glir inn fra den siden. */
  retning: 1 | -1
}

export const STARTSTEG: Stegtilstand = { steg: 0, lengst: 0, retning: 1 }

/** Gå til steg `i`. Utenfor rekken klemmes det inn; samme steg endrer ingenting. */
export function gaTil(t: Stegtilstand, i: number, antall: number): Stegtilstand {
  const mal = Math.max(0, Math.min(antall - 1, Math.round(i)))
  if (mal === t.steg) return t
  return { steg: mal, lengst: Math.max(t.lengst, mal), retning: mal < t.steg ? -1 : 1 }
}

/**
 * Skal et svar på `besvart` sende kunden videre av seg selv?
 * Bare når det er steget som vises, og kunden ikke har vært lenger før.
 */
export function skalVidere(t: Stegtilstand, besvart: number, antall: number): boolean {
  return t.steg === besvart && besvart === t.lengst && besvart < antall - 1
}

/**
 * Tidtakeren for «videre» har fyrt. Gå videre bare hvis kunden fortsatt står
 * der den ble satt – ellers har han flyttet seg selv, og det vinner.
 */
export function videreFra(t: Stegtilstand, fra: number, antall: number): Stegtilstand {
  return t.steg === fra ? gaTil(t, fra + 1, antall) : t
}

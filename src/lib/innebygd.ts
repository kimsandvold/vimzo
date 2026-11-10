/**
 * Logoverktøyet inne i kalkulatoren på forsiden.
 *
 * Kalkulatoren åpner /logo?innebygd=1 i en modal (en iframe), så kunden
 * lager logoen uten å forlate forsiden og miste svarene sine. I den
 * modusen viser siden bare verktøyet – uten meny, fot og bestilling – og
 * siste steg er «Bruk denne logoen», som sender valget tilbake hit med
 * postMessage. Logoen faktureres sammen med nettsiden.
 */

export const INNEBYGD = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('innebygd')

/** Meldingen verktøyet sender til kalkulatoren. */
export type Logomelding =
  | { type: 'vimzo:logo-valgt'; logo: { id: string; navn: string; forhandsvisning: string } }
  | { type: 'vimzo:logo-lukk' }

/** Send til vinduet som har åpnet verktøyet. Bare samme opprinnelse. */
export function sendTilKalkulator(m: Logomelding) {
  if (INNEBYGD && window.parent !== window) window.parent.postMessage(m, window.location.origin)
}

// Uten meny er det ingen menyhøyde å gi plass til (se --nav-hoyde i GlobalStyles).
if (INNEBYGD) document.documentElement.setAttribute('data-innebygd', '')

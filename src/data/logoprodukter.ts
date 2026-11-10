/**
 * Produktene i logoverktøyet, og prisene på dem.
 *
 * Står her, i data/, og ikke i lib/logobestillinger.ts, fordi kalkulatoren på
 * forsiden også trenger prisen – og forsiden skal aldri laste Firebase bare
 * for å vise et tall. Prisene håndheves i tillegg i firestore.rules
 * (logobestillinger → riktigPris). Endres de her, må de endres der.
 */
export const PRODUKTER = {
  logo: { navn: 'Logo', pris: 490 },
  profil: { navn: 'Logo + visuell profil', pris: 990 },
} as const

export type Produkt = keyof typeof PRODUKTER

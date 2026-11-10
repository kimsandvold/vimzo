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

/**
 * Oppgraderingen fra «Logo» til «Logo + visuell profil», for den som alt har
 * kjøpt logoen. Prisen er forskjellen mellom de to, så ingen betaler mer for
 * å ta det i to steg. Står for seg selv – ikke i PRODUKTER – fordi den ikke
 * kan velges i verktøyet, bare på en logo som er kjøpt. Håndheves også i
 * firestore.rules (riktigPris).
 */
export const OPPGRADERING = {
  navn: 'Oppgradering til visuell profil',
  pris: PRODUKTER.profil.pris - PRODUKTER.logo.pris,
} as const

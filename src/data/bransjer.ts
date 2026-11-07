/**
 * Bransjene kalkulatoren på forsiden kjenner igjen.
 *
 * Lista har én jobb: at den som kommer inn skal finne seg selv på første
 * spørsmål. En fotpleier som må velge «Noe annet» har allerede fått vite at
 * hun ikke er den vi hadde i tankene.
 *
 * Alle er tjenestebedrifter. Det er et bevisst utvalg og ikke en tilfeldighet
 * – vi lager ikke nettbutikker, så en side som het «Butikk» og lovet
 * nettbestilling hørte ikke hjemme her.
 */

export interface Bransje {
  id: string
  navn: string
}

export const BRANSJER: readonly Bransje[] = [
  { id: 'rorlegger', navn: 'Rørlegger' },
  { id: 'snekker', navn: 'Snekker' },
  { id: 'elektriker', navn: 'Elektriker' },
  { id: 'maler', navn: 'Maler' },
  { id: 'murer', navn: 'Murer' },
  { id: 'anlegg', navn: 'Anleggsgartner' },
  { id: 'bilverksted', navn: 'Bilverksted' },
  { id: 'renhold', navn: 'Renhold' },
  { id: 'transport', navn: 'Transport og flytting' },
  { id: 'frisor', navn: 'Frisør' },
  { id: 'fotpleie', navn: 'Fotpleie og hudpleie' },
  { id: 'trening', navn: 'Trening og helse' },
  { id: 'servering', navn: 'Servering' },
  { id: 'annet', navn: 'Noe annet' },
]

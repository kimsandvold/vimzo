import type { IkonNavn } from '../components/shared/Icon'

export interface Steg {
  nummer: string
  ikon: IkonNavn
  tittel: string
  varighet: string
  tekst: string
}

/**
 * Hvordan et prosjekt faktisk går. Poenget med å publisere dette er å fjerne
 * den vanligste innvendingen hos små bedrifter: «jeg vet ikke hva jeg går
 * til». Hold stegene ærlige – de blir et løfte.
 */
export const prosess: readonly Steg[] = [
  {
    nummer: '01',
    ikon: 'samtale',
    tittel: 'Du ringer, eller vi ringer',
    varighet: '30 minutter',
    tekst:
      'Vi prater om hva bedriften gjør og hvem du vil nå. Du trenger ikke ha tenkt ferdig, og ' +
      'du trenger ikke forberede noe. Etterpå får du et skriftlig tilbud med fast pris.',
  },
  {
    nummer: '02',
    ikon: 'penn',
    tittel: 'Vi finner ut hva siden skal inneholde',
    varighet: '3–5 dager',
    tekst:
      'Vi tar en prat til om tjenestene dine, og skriver tekstene. Samtidig kjøper vi domenet og ' +
      'setter opp e-posten. Du får se forsiden som ekte nettside, ikke som et bilde.',
  },
  {
    nummer: '03',
    ikon: 'kode',
    tittel: 'Vi bygger den ferdig',
    varighet: '1–3 uker',
    tekst:
      'Siden ligger på en testadresse du kan se på når du vil, og vi tar bildene hvis det inngår. ' +
      'Du trenger ikke gjøre noe i denne perioden – men du kan følge med om du vil.',
  },
  {
    nummer: '04',
    ikon: 'maler',
    tittel: 'Du leser gjennom',
    varighet: '1 time',
    tekst:
      'Vi går gjennom siden sammen, på skjerm og på mobil, og retter det du vil ha endret. ' +
      'Dette er den andre og siste timen du bruker på prosjektet.',
  },
  {
    nummer: '05',
    ikon: 'rakett',
    tittel: 'Vi setter den på lufta',
    varighet: 'Samme dag',
    tekst:
      'Vi kobler domenet, melder deg inn hos Google og Google Maps, og sender deg alle ' +
      'tilgangene. Etter 30 dager tar vi en prat om hva tallene viser. Skal noe endres senere, ' +
      'sender du en e-post – du slipper å lære deg et system.',
  },
] as const

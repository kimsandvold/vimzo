import type { IkonNavn } from '../components/shared/Icon'

/**
 * De frie verktøyene vi har bygget og lagt ut.
 *
 * De har sin egen side (/verktoy), en lenke fra forsiden, en plass i menyen
 * og en kolonne i bunnteksten. Forsiden selv handler om nettsiden.
 *
 * Navnet ER lenketeksten, og det skal være spørsmålet verktøyet svarer på.
 * «Timepriskalkulator» forteller en søkemotor hva siden heter; «Hva skal du
 * ta i timen?» forteller den hva siden svarer på.
 */
export interface Gratisverktoy {
  til: string
  navn: string
  tekst: string
  ikon: IkonNavn
  /** Grupperingen på /verktoy. */
  gruppe: 'start' | 'penger' | 'orden'
  /** Det verktøyet gir deg, i tre–fire ord – til kortet på /verktoy. */
  gir: string
}

export const VERKTOYGRUPPER: ReadonlyArray<{ id: Gratisverktoy['gruppe']; navn: string; tekst: string }> = [
  { id: 'orden', navn: 'Orden i bedriften', tekst: 'Det du ellers må huske selv.' },
  { id: 'penger', navn: 'Pris og lønnsomhet', tekst: 'Tallene som avgjør om året går opp.' },
  { id: 'start', navn: 'Navn og merkevare', tekst: 'For deg som starter – eller vil se mer profesjonell ut.' },
]

export const gratisverktoy: readonly Gratisverktoy[] = [
  {
    til: '/frister',
    navn: 'Når er fristene dine?',
    tekst: 'Mva, a-melding, forskuddsskatt og årsoppgjør for akkurat din bedrift – rett i kalenderen, med varsel.',
    ikon: 'klokke',
    gruppe: 'orden',
    gir: 'Kalender med varsel',
  },
  {
    til: '/timepris',
    navn: 'Hva skal du ta i timen?',
    tekst: 'Lønn, faste kostnader og ubetalt tid, regnet om til timepris. Med typiske tall for ditt fag.',
    ikon: 'graf',
    gruppe: 'penger',
    gir: 'Timepris du kan stå for',
  },
  {
    til: '/hva-ma-du-fakturere',
    navn: 'Hvor mye må du fakturere?',
    tekst: 'Hva året krever i omsetning – og hvor mange timer du da faktisk må være på jobb.',
    ikon: 'dokument',
    gruppe: 'penger',
    gir: 'Omsetningsmål per måned',
  },
  {
    til: '/hva-koster-en-ansatt',
    navn: 'Hva koster en ansatt?',
    tekst: 'Lønn, feriepenger, arbeidsgiveravgift og pensjon. En ansatt koster 30–40 % mer enn lønnen.',
    ikon: 'person',
    gruppe: 'penger',
    gir: 'Full årskostnad',
  },
  {
    til: '/navnesjekk',
    navn: 'Er firmanavnet ledig?',
    tekst: 'Samme og lignende navn i Brønnøysundregistrene, og ledige .no-domener.',
    ikon: 'sok',
    gruppe: 'start',
    gir: 'Svar på sekunder',
  },
  {
    til: '/logo',
    navn: 'Lag din egen logo',
    tekst: 'Design logoen selv på norsk. Å prøve koster ingenting.',
    ikon: 'penn',
    gruppe: 'start',
    gir: 'Logo på minutter',
  },
]

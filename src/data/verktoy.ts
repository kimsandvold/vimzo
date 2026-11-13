import type { IkonNavn } from '../components/shared/Icon'

/**
 * Regneverktøy og kalkulatorer.
 *
 * Dette er det klareste skillet mellom en nettside som står der og en som
 * jobber. En kunde som får et prisanslag på skjermen har allerede bestemt seg
 * halvveis – og du får en henvendelse med tall i, i stedet for «hva koster
 * det?» på telefon klokka halv åtte.
 *
 * Eksemplene under er med vilje konkrete og fra ulike bransjer, så leseren
 * kjenner igjen sin egen. Hold dem slik: «en kalkulator» selger ingenting,
 * «hva koster terrassen min» selger.
 */

export interface Verktoy {
  ikon: IkonNavn
  bransje: string
  navn: string
  tekst: string
}

export const verktoy: readonly Verktoy[] = [
  {
    ikon: 'maler',
    bransje: 'Håndverk og bygg',
    navn: 'Hva koster terrassen?',
    tekst:
      'Kunden taster inn mål og velger materiale, og får et prisanslag med én gang – sammen med ' +
      'et tilbudsskjema som allerede er fylt ut.',
  },
  {
    ikon: 'kart',
    bransje: 'Transport og flytting',
    navn: 'Hva koster oppdraget hit?',
    tekst:
      'Regner ut pris ut fra avstand, størrelse og tilleggstjenester, og viser med én gang om du ' +
      'kjører så langt.',
  },
  {
    ikon: 'klokke',
    bransje: 'Tjenester med timebestilling',
    navn: 'Book tid direkte',
    tekst:
      'Ledige tider på skjermen, bekreftelse på e-post og en påminnelse dagen før. Uten et ' +
      'bookingsystem du må betale månedsleie for.',
  },
  {
    ikon: 'kamera',
    bransje: 'Håndverk og service',
    navn: 'Send bilde, få et anslag',
    tekst:
      'Kunden tar bilde av jobben, beskriver den kort og sender inn. Du slipper å kjøre ut for ' +
      'å se på noe du kunne priset fra kontoret.',
  },
  {
    ikon: 'dokument',
    bransje: 'Alle bransjer',
    navn: 'Tilbudsskjema i flere steg',
    tekst:
      'Ett spørsmål om gangen i stedet for ett stort skjema. Flere fullfører, og du får ' +
      'henvendelser du faktisk kan prise.',
  },
]

export const verktoyNotat =
  'Vi bygger verktøyet inn i siden – ingen tredjepartstjeneste med månedsavgift og ingen ' +
  'innlogging. Tar verktøyet imot opplysninger fra kundene dine, lagres de i Europa hos ' +
  'leverandører vi har databehandleravtale med.'

/**
 * De frie verktøyene vi har bygget og lagt ut.
 *
 * Lista over er eksempler på hva vi kan lage for en kunde. Denne er beviset:
 * fem verktøy som faktisk ligger ute, som hvem som helst kan prøve nå.
 *
 * De står på forsiden fordi det er den siden som har mest vekt å gi videre.
 * Lå de bare i bunnteksten – slik de gjorde til å begynne med – ville de hatt
 * én sidedekkende standardlenke hver, og det teller nesten ingenting.
 *
 * Navnet ER lenketeksten, og det skal være spørsmålet verktøyet svarer på.
 * «Timepriskalkulator» forteller en søkemotor hva siden heter; «Hva skal du
 * ta i timen?» forteller den hva siden svarer på.
 */
export interface Gratisverktoy {
  til: string
  navn: string
  tekst: string
}

export const gratisverktoy: readonly Gratisverktoy[] = [
  {
    til: '/timepris',
    navn: 'Hva skal du ta i timen?',
    tekst: 'Lønn, faste kostnader og ubetalt tid, regnet om til timepris. Med typiske tall for ditt fag.',
  },
  {
    til: '/hva-ma-du-fakturere',
    navn: 'Hvor mye må du fakturere?',
    tekst: 'Hva året krever i omsetning – og hvor mange timer du da faktisk må være på jobb.',
  },
  {
    til: '/hva-koster-en-ansatt',
    navn: 'Hva koster en ansatt?',
    tekst: 'Lønn, feriepenger, arbeidsgiveravgift og pensjon. En ansatt koster 30–40 % mer enn lønnen.',
  },
  {
    til: '/navnesjekk',
    navn: 'Er firmanavnet ledig?',
    tekst: 'Samme og lignende navn i Brønnøysundregistrene, og ledige .no-domener.',
  },
  {
    til: '/logo',
    navn: 'Lag din egen logo',
    tekst: 'Design logoen selv på norsk. Å prøve koster ingenting.',
  },
]

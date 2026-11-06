/**
 * Foretaksopplysninger – brukes i footer, strukturerte data, personvern og
 * kontaktsiden. Ett sted, slik at ingenting kommer ut av synk.
 *
 * TODO før lansering: fyll inn `orgNr` og `telefon`. Begge feltene er tomme
 * nå, og alt som leser dem skjuler seg selv når verdien mangler – siden skal
 * aldri publisere en opplysning vi ikke har.
 */
interface Firma {
  merke: string
  juridiskNavn: string
  orgForm: string
  orgNr: string
  adresse: string
  postnr: string
  poststed: string
  land: string
  epostBruker: string
  epostDomene: string
  telefon: string
  telefonVist: string
  nettsted: string
  url: string
  grunnlegger: string
  grunnleggerTittel: string
  fagomrader: readonly string[]
  dekningsomrade: readonly string[]
}

export const firma: Firma = {
  merke: 'Vimzo',
  /** Juridisk navn i Enhetsregisteret. */
  juridiskNavn: '',
  orgForm: 'Enkeltpersonforetak',
  /** Org.nr. formatert med mellomrom, f.eks. «123 456 789». */
  orgNr: '',
  adresse: '',
  postnr: '2624',
  poststed: 'Lillehammer',
  land: 'Norge',
  /**
   * E-post lagres i deler slik at den fullstendige adressen aldri finnes som
   * én sammenhengende streng i kildekode, DOM eller prerendret HTML.
   */
  epostBruker: 'post',
  epostDomene: 'vimzo.no',
  /** E.164 for `tel:`-lenker, f.eks. «+4740000000». Tom = skjul telefon. */
  telefon: '',
  /** Samme nummer formatert for visning, f.eks. «400 00 000». */
  telefonVist: '',
  nettsted: 'vimzo.no',
  url: 'https://vimzo.no',

  /** Den som står bak. En navngitt fagperson veier tyngre enn et foretaksnavn
   *  i både søkeresultater og AI-genererte svar. */
  grunnlegger: 'Kim Sandvold',
  grunnleggerTittel: 'Utvikler og innehaver',

  /**
   * Fagområdene vi faktisk arbeider innenfor. Publiseres som `knowsAbout` på
   * Organization – den direkte måten å erklære temaautoritet på. Hold lista
   * ærlig: bare det vi virkelig leverer og skriver om.
   */
  fagomrader: [
    'Håndkodede nettsider i HTML, CSS og JavaScript',
    'Forhåndsrendring og statisk publisering',
    'Teknisk søkemotoroptimalisering',
    'Core Web Vitals og lastetid',
    'Strukturerte data etter schema.org',
    'Synlighet i AI-assistenter og generative søkeresultater',
    'Universell utforming etter WCAG 2.1 AA',
    'Nettsider for små og mellomstore bedrifter i Norge',
  ],

  /** Geografisk nedslagsfelt – brukes i `areaServed` og på kontaktsiden. */
  dekningsomrade: ['Innlandet', 'Oslo og Viken', 'Hele Norge – vi jobber digitalt'],
}

/** Full e-postadresse, satt sammen først når den faktisk skal brukes. */
export const epost = () => `${firma.epostBruker}@${firma.epostDomene}`

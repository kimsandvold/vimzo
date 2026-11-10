/**
 * Foretaksopplysninger – brukes i footer, strukturerte data, personvern og
 * kontaktsiden. Ett sted, slik at ingenting kommer ut av synk.
 *
 * TODO før lansering: fyll inn `orgNr` og `juridiskNavn`. Tomme felter
 * skjuler seg selv – siden skal aldri publisere en opplysning vi ikke har.
 *
 * Gateadresse og postnummer finnes med vilje IKKE her, og telefon og e-post
 * vises aldri i HTML-en. All kontakt går gjennom kontaktskjemaet – med ett
 * unntak: «Ta kontakt»-knappen nede i hjørnet, som viser nummeret først når
 * noen trykker på den.
 */
interface Firma {
  merke: string
  juridiskNavn: string
  orgForm: string
  orgNr: string
  poststed: string
  land: string
  epostBruker: string
  epostDomene: string
  telefonDeler: readonly string[]
  tilgjengelig: string
  nettsted: string
  url: string
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
  poststed: 'Lillehammer',
  land: 'Norge',
  /**
   * E-post lagres i deler slik at den fullstendige adressen aldri finnes som
   * én sammenhengende streng i kildekode, DOM eller prerendret HTML.
   *
   * Den skal heller ikke VISES noe sted – ikke som tekst, ikke som
   * mailto-lenke, ikke i JSON-LD. Veien inn er kontaktskjemaet. Eneste bruk
   * er reserveløsningen når EmailJS ikke er satt opp, og der settes adressen
   * sammen først i det øyeblikket noen trykker send.
   */
  epostBruker: 'post',
  epostDomene: 'vimzo.no',
  /**
   * Telefon, i deler av samme grunn som e-posten. Brukes BARE av
   * `Kontaktknapp`, som setter det sammen når den åpnes – det står aldri i den
   * prerendrede HTML-en. Tom liste = knappen viser bare kontaktskjemaet.
   */
  telefonDeler: ['482', '52', '843'],
  /** Står over valgene når knappen er åpen. */
  tilgjengelig: 'Tilgjengelig hverdager etter kl. 16:00 og hele helgen',
  nettsted: 'vimzo.no',
  url: 'https://vimzo.no',


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

/** Telefonnummeret for visning («482 52 843») og for lenker («+4748252843»). */
export const telefonVist = () => firma.telefonDeler.join(' ')
export const telefonLenke = () => (firma.telefonDeler.length ? `+47${firma.telefonDeler.join('')}` : '')

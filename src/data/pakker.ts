/**
 * Prisene. Dette er sidens viktigste innhold.
 *
 * To ting styrer hvordan de er satt opp. Det ene er at en konkret pris er det
 * eneste de fleste leter etter – og det eneste en AI-assistent kan sitere.
 * Det andre er at et femsifret beløp skremmer en liten bedrift, selv når det
 * er riktig pris. Derfor oppgis alt både som månedsbeløp og som engangssum,
 * med differansen skrevet rett ut. Ingen skjulte påslag, ingen «fra*».
 *
 * TODO: juster beløpene til det du faktisk vil ta. Alt annet på siden –
 * forsiden, prissiden, kontaktskjemaet, strukturerte data og llms.txt –
 * leser herfra.
 *
 * Alle priser er i NOK og oppgitt eks. mva.
 */

export interface Pakke {
  id: string
  navn: string
  /** Én linje: hvem pakken er for. Skrevet som man snakker. */
  for: string
  /**
   * Samlet pris, eller `null` når omfanget må avtales.
   *
   * `null` er ikke en snikende «ring oss for pris». Det er en grense: de
   * største jobbene tar titalls timer, og de skal avtales én og én – ikke
   * bestilles fra en prisliste en fredag kveld.
   */
  pris: number | null
  /** Månedsbeløp ved deling over 12 måneder. `null` følger `pris`. */
  manedspris: number | null
  /** Antall sider som inngår, formulert for mennesker. */
  omfang: string
  punkter: readonly string[]
  /** Nøyaktig én pakke bør være fremhevet. */
  fremhevet?: boolean
}

/** Antall måneder delbetalingen går over. */
export const ANTALL_AVDRAG = 12

export const pakker: readonly Pakke[] = [
  {
    id: 'start',
    navn: 'Start',
    for: 'For deg som bare må finnes på nett, og helst i går.',
    pris: 14900,
    manedspris: 1290,
    omfang: 'Opptil 3 sider',
    punkter: [
      'Domene i ditt navn',
      'Alle tekster skrevet av oss',
      'Eget design, ingen mal',
      'Like god på mobil, nettbrett og PC',
      'Kontaktskjema til e-posten din',
      'Synlig på Google og Google Maps',
    ],
  },
  {
    id: 'bedrift',
    navn: 'Bedrift',
    for: 'For bedriften som skal selge tjenestene sine, ikke bare vises fram.',
    pris: 29900,
    manedspris: 2590,
    omfang: 'Opptil 8 sider',
    fremhevet: true,
    punkter: [
      'Alt i Start',
      'Egen side per tjeneste',
      'Halv dag foto hos deg',
      'E-post på eget domene',
      'Synlig i AI-assistenter',
    ],
  },
  {
    id: 'vekst',
    navn: 'Vekst',
    for: 'For deg som vil at nettsiden skal skaffe kunder, ikke bare stå der.',
    pris: null,
    manedspris: null,
    omfang: 'Omfang etter avtale',
    punkter: [
      'Alt i Bedrift',
      'Priskalkulator eller booking',
      'Hel dag foto og drone',
      'Seks fagartikler',
      'Månedsrapport i tre måneder',
    ],
  },
] as const

/**
 * Timepris for endringer og arbeid utenfor avtalt omfang.
 *
 * Modellen er bevisst: kunden får ikke et publiseringssystem å logge seg inn
 * i og fylle selv. Å skrive innhold som både leser godt og rangerer er et fag,
 * og sider eieren skal fylle mellom alt annet, forfaller nesten alltid.
 *
 * Men timeprisen er unntaket, ikke mekanismen. Siden er skreddersydd og har
 * ingen innlogging, så kunden kan ikke rette en telefonnummer selv om han
 * ville. Satte vi en teller på hver småting, ville han sluttet å spørre – og
 * da forfaller siden akkurat slik vi sier at den ikke skal. Derfor inngår
 * småendringer i driften, det forutsigbare har fast pris, og timer bruker vi
 * bare når ingenting annet passer.
 */
export const timepris = 1150

export interface Tillegg {
  navn: string
  pris: number
  /** «fra 6 900 kr» når omfanget varierer. */
  fraPris?: boolean
  enhet?: string
  beskrivelse: string
}

export const tilleggstjenester: readonly Tillegg[] = [
  {
    navn: 'Regneverktøy eller kalkulator',
    pris: 4900,
    fraPris: true,
    beskrivelse:
      'En priskalkulator, en bookingløsning eller et tilbudsskjema i flere steg, bygget inn i ' +
      'siden. Ingen månedsavgift til en tredjepart, og dataene lagres i Europa.',
  },
  {
    navn: 'Logo',
    pris: 2900,
    beskrivelse:
      'En ny logo tegnet for bedriften din, levert i alle filformatene du trenger – til nett, ' +
      'til trykk, til bil og skilt. Du får tre forslag og velger ett. Vil du prøve deg fram ' +
      'selv først, kan du bruke logoverktøyet vårt gratis.',
  },
  {
    navn: 'Visuell profil',
    pris: 5900,
    beskrivelse:
      'Logo, fargepalett, skrifttyper og et kort profilark som viser hvordan de brukes. Da ser ' +
      'nettsiden, fakturaen, arbeidstøyet og Facebook-siden ut som samme bedrift. Inkluderer ' +
      'logoen over.',
  },
  {
    navn: 'Foto og dronevideo',
    pris: 6900,
    fraPris: true,
    beskrivelse:
      'Halv dag hos deg: bilder av lokaler, produkter og folk, dronefoto av bygg og uteområder, ' +
      'og én kortvideo til forsiden. Ferdig redigert. Du eier bildene.',
  },
  {
    navn: '3D-visning og designverktøy',
    pris: 12900,
    fraPris: true,
    beskrivelse:
      'Produktet ditt bygget i 3D i nettleseren: kunden snur på det, velger mål og materiale, ' +
      'og ser pris og materialliste endre seg med valgene. Spennet er stort – en enkel ' +
      'produktvisning er én jobb, et fullt designverktøy som det på minio.no er en annen – ' +
      'så her settes prisen etter en prat.',
  },
  {
    navn: 'Ekstra side',
    pris: 2900,
    fraPris: true,
    beskrivelse: 'En ny tjeneste-, produkt- eller stedsside utover pakken, ferdig skrevet av oss.',
  },
  {
    navn: 'Fagartikkel',
    pris: 2400,
    enhet: 'per artikkel',
    beskrivelse:
      'En artikkel på 800–1 200 ord som svarer på noe kundene dine faktisk googler, skrevet ' +
      'etter en prat med deg.',
  },
  {
    navn: 'Større endringer senere',
    pris: timepris,
    enhet: 'per time',
    beskrivelse:
      'Småendringer inngår i driften, og det forutsigbare har fast pris. Timer bruker vi bare ' +
      'når ingenting annet passer – en ombygging, en ny funksjon, noe vi ikke har gjort før. ' +
      'Du får alltid et anslag før vi setter i gang.',
  },
] as const

export interface Driftsniva {
  id: string
  navn: string
  pris: number
  periode: string
  /** Én linje om hvem nivået passer for. */
  for: string
  punkter: readonly string[]
  anbefalt?: boolean
}

/**
 * Drift. Én pris, uansett hva siden gjør.
 *
 * Det var to nivåer før, der det dyre dekket sider med database. Det er
 * fjernet med vilje. Databasen deles av alle kundene våre og koster i
 * praksis ingenting ekstra per side, så et eget nivå priset en kostnad som
 * knapt fantes – og ga kunden et valg han ikke hadde grunnlag for å ta.
 *
 * Én pris er dessuten én ting å forklare, én ting å fakturere og én ting å
 * holde styr på. Det er verdt mer enn de kronene et ekstra nivå henter inn.
 */
export const driftsnivaer: readonly Driftsniva[] = [
  {
    id: 'drift',
    navn: 'Drift',
    pris: 449,
    periode: 'per måned',
    for: 'Én pris, enten siden bare står der eller tar imot bestillinger.',
    anbefalt: true,
    punkter: [
      'Vi passer på at siden er oppe, hele døgnet',
      'Sikkerhetskopi hver dag',
      'Småendringer inngår, inntil 20 minutter i måneden',
      'Database og sikkerhetskopi også når siden tar imot kundedata',
      'Kundedataene lagres i Europa, aldri lenger unna',
      'Hjelp med domene og e-post når du trenger det',
      'Ingen bindingstid',
    ],
  },
] as const

/** Standardnivået – det de fleste velger, og det som vises på forsiden. */
export const drift = driftsnivaer[0]

/** Det domenet faktisk koster – oppgis fordi «inkludert» skal tåle å sjekkes. */
export const domenepris = 169

/** Hvor mange måneder vi regner «over tid» på. Tre år er en nettsides levetid. */
export const SAMMENLIGNINGSPERIODE = 36

/**
 * Hva det koster å eie siden i et gitt antall måneder: bygget én gang,
 * pluss driften som løper.
 *
 * Dette tallet finnes fordi månedsprisen alene lyver begge veier. Vårt
 * avdrag på 1 290 ser dyrt ut ved siden av et abonnement til 699 – helt til
 * man ser at avdraget stopper etter tolv måneder og abonnementet aldri gjør
 * det. Da er det bare totalen som forteller sannheten.
 */
export function totaltOver(pakke: Pakke, maneder: number, driftPris: number = drift.pris): number | null {
  return pakke.pris === null ? null : pakke.pris + driftPris * maneder
}

/**
 * Hva et nettside-abonnement typisk koster i Norge, per måned eks. mva.
 *
 * Spennet er hentet fra oppgitte priser hos norske abonnementsleverandører
 * i november 2026. Vi navngir ingen – tallene endrer seg, og en påstand om
 * en konkurrent må kunne etterprøves den dagen noen sjekker. Spennet kan
 * det. Felles for alle er at beløpet løper så lenge du er kunde, og at
 * siden som regel slutter å finnes den dagen du slutter å betale.
 */
export const markedsabonnement = {
  lav: 699,
  hoy: 1490,
  hentet: 'november 2026',
} as const

export const prisnotat =
  'Alle priser er eks. mva. Du får et skriftlig tilbud med fast pris før vi begynner, og den ' +
  'står selv om arbeidet tar lengre tid enn vi trodde. Første års domene er inkludert; etter ' +
  'det koster det rundt 169 kroner i året, som vi fornyer for deg. Driften koster 449 ' +
  'kroner i måneden uansett hva siden gjør – også når den tar imot bestillinger og trenger ' +
  'en database bak seg.'

/**
 * Delbetalingen koster litt mer totalt. Det står åpent – en side som selger
 * trygghet har ikke råd til små skrift.
 */
export function totaltVedDeling(pakke: Pakke): number | null {
  return pakke.manedspris === null ? null : pakke.manedspris * ANTALL_AVDRAG
}

/**
 * Hva det koster å endre noe etter lansering.
 *
 * To linjer, med vilje. Kunden skal vite hva som er gratis å spørre om uten
 * å måtte lese en prisliste først – terskelen for å sende den e-posten er
 * det eneste som avgjør om siden holder seg oppdatert.
 */
export const endringsnotat =
  'Småendringer inngår i driften: telefon, åpningstider, en pris eller en setning. Du sender ' +
  'en e-post, vi retter det. Skal du ha noe nytt, får du fast pris før vi gjør det – en ny ' +
  `side koster 2 900 kroner, en fagartikkel 2 400. Timepris på ${timepris} bruker vi bare når ` +
  'ingenting annet passer, og da får du et anslag først.'

export const delbetalingsnotat =
  `Deler du opp, er det 0 kroner i oppstart: du betaler ${ANTALL_AVDRAG} avdrag og ender litt ` +
  'høyere enn engangsprisen. Begge tallene står på kortene, så du ser nøyaktig hva forskjellen ' +
  'er. Ingen renter, ingen kredittsjekk, og ingenting å binde seg til etter de tolv månedene – ' +
  'da er siden betalt, og det eneste som løper videre er driften.'

/**
 * «14 900» med hardt mellomrom som tusenskille, for ren tekst (skjemafelter,
 * meta-beskrivelser). Til beløp som vises stort i mono, bruk `<Belop>` –
 * mono-fonten gir mellomrommet full tegnbredde og sprenger tallet i to.
 */
export function formaterPris(verdi: number): string {
  return verdi.toLocaleString('nb-NO').replace(/\s/g, ' ')
}

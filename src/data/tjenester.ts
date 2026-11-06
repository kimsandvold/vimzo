import type { IkonNavn } from '../components/shared/Icon'

export interface Tjeneste {
  /** Brukes som anker på /tjenester og i strukturerte data. */
  id: string
  ikon: IkonNavn
  navn: string
  /** Én setning. Står i kortet på forsiden. */
  kort: string
  /** To–tre setninger. Står på tjenestesiden. */
  lang: string
  /** Konkret hva som faktisk gjøres – det er dette kunden kjøper. */
  punkter: readonly string[]
}

/**
 * Tjenestene vi selger, i den rekkefølgen en kunde tenker på dem: først
 * selve siden, så innholdet som skal stå på den, så det som gjør at noen
 * finner den, og til slutt det som holder den i live.
 *
 * Skrivereglene her er strenge, fordi leseren som regel ikke er teknisk:
 * ingen fagord uten forklaring, ingen «skreddersydde helhetsløsninger», og
 * hvert punkt skal være noe vi faktisk gjør – ikke noe vi «kan tilby».
 *
 * Hver tjeneste publiseres også som `Service` i strukturerte data, så dette
 * er teksten både mennesker og AI-assistenter leser.
 */
export const tjenester: readonly Tjeneste[] = [
  {
    id: 'ny-nettside',
    ikon: 'kode',
    navn: 'Hele nettsiden, ferdig laget',
    kort: 'Vi ordner alt – også domenet. Du svarer på noen spørsmål.',
    lang:
      'Du trenger ikke vite hva et domene er, hva siden bør hete eller hvilke sider du skal ha. ' +
      'Vi finner ut av det, kjøper domenet i ditt navn, lager designet, skriver innholdet og ' +
      'setter siden på lufta. Du bruker rundt to timer til sammen: én prat i starten og én ' +
      'gjennomlesing før vi publiserer.',
    punkter: [
      'Domene kjøpt og registrert i ditt navn',
      'Vi bestemmer hvilke sider du trenger, sammen med deg',
      'Design laget for din bedrift – ingen ferdigmal',
      'Virker like godt på mobil som på stor skjerm',
      'E-post på ditt eget domene',
      'Kontaktskjema som lander i innboksen din',
      'Lesbar for alle, også med skjermleser',
      'Du eier siden, koden og domenet',
    ],
  },
  {
    id: 'innhold',
    ikon: 'penn',
    navn: 'Tekst og innhold',
    kort: 'Du slipper å skrive. Vi intervjuer deg og gjør resten.',
    lang:
      'Det som stopper de fleste nettsider er teksten. Vi tar en prat med deg om hva bedriften ' +
      'gjør, hvem som ringer og hva de pleier å spørre om – og skriver sidene ferdig på norsk. ' +
      'Du leser gjennom og sier ja. Du trenger ikke være flink til å skrive, bare å fortelle.',
    punkter: [
      'Vi intervjuer deg – du trenger ikke forberede noe',
      'Alle sider skrevet ferdig på norsk',
      'Språk kundene dine kjenner igjen, ikke konsulentspråk',
      'Spørsmål og svar som fanger opp det folk lurer på',
      'Fagartikler som svarer på det kundene googler',
      'Du godkjenner alt før det publiseres',
    ],
  },
  {
    id: 'foto',
    ikon: 'kamera',
    navn: 'Foto og dronevideo',
    kort: 'Ekte bilder av din bedrift. Ikke arkivbilder av noen andres.',
    lang:
      'Har du ikke bilder, kommer vi og tar dem. Lokalene, produktene, arbeidet og folkene – og ' +
      'fra lufta med drone når motivet fortjener det. Egne bilder er det enkleste grepet som ' +
      'skiller en troverdig bedriftsside fra en som ser ut som alle andre.',
    punkter: [
      'Halv eller hel dag med fotografering hos deg',
      'Dronefoto og -video av bygg, anlegg og uteområder',
      'Kortvideo til forsiden og sosiale medier',
      'Ferdig redigert og klargjort for nett',
      'Du eier alle bildene og kan bruke dem til hva du vil',
    ],
  },
  {
    id: 'profil',
    ikon: 'gnist',
    navn: 'Logo og visuell profil',
    kort: 'Mangler du logo? Vi tegner en – eller du lager den selv i verktøyet vårt.',
    lang:
      'En nettside trenger noe å bygge utseendet rundt. Har du ikke en logo, eller har du en som ' +
      'ble laget i Word i 2011, tegner vi en ny og setter sammen farger og skrifttyper som ' +
      'passer bedriften. Vil du prøve deg fram selv først, har vi et gratis logoverktøy du kan ' +
      'leke med – og det du lager der kan vi ta videre.',
    punkter: [
      'Tre logoforslag, du velger ett',
      'Alle filformater: nett, trykk, skilt og bil',
      'Fargepalett og skrifttyper som hører sammen',
      'Kort profilark som viser hvordan det brukes',
      'Gratis logoverktøy du kan prøve selv, uten å bestille noe',
      'Logo fra 2 900 kr, hele profilen 5 900 kr',
    ],
  },
  {
    id: 'verktoy',
    ikon: 'panel',
    navn: 'Kalkulatorer og regneverktøy',
    kort: 'La kunden regne ut prisen selv – og sende forespørselen ferdig utfylt.',
    lang:
      'En priskalkulator, en bookingløsning eller et tilbudsskjema i flere steg, bygget rett inn ' +
      'i siden. Kunden får svar med én gang i stedet for å ringe, og du får en henvendelse med ' +
      'tall i. Ingen tredjepartstjeneste med månedsavgift, og dataene lagres i Europa.',
    punkter: [
      'Priskalkulator tilpasset det du selger',
      'Tilbudsskjema som stiller ett spørsmål om gangen',
      'Booking med bekreftelse og påminnelse på e-post',
      'Befaringsskjema der kunden legger ved bilde av jobben',
      'Regner ut avstand, mengde, areal – det du trenger',
      'Bygget inn i siden, uten månedsleie til andre',
    ],
  },
  {
    id: 'synlighet',
    ikon: 'sok',
    navn: 'Bli funnet i Google',
    kort: 'Riktig oppsett fra dag én, og en Google-profil som står ferdig.',
    lang:
      'At siden finnes er ikke det samme som at noen finner den. Vi setter opp alt Google ser ' +
      'etter – titler, struktur, sitemap og en bedriftsprofil med kart og åpningstider – og ' +
      'kobler til statistikk så du ser hva som faktisk skjer.',
    punkter: [
      'Vi finner ut hva kundene dine søker etter',
      'Egen tittel og beskrivelse på hver side',
      'Google Business-profil med kart, bilder og åpningstider',
      'Sitemap og teknisk oppsett som Google forstår',
      'Egne sider for stedene du jobber',
      'Besøksstatistikk du kan lese uten å være teknisk',
    ],
  },
  {
    id: 'ai-synlighet',
    ikon: 'gnist',
    navn: 'Bli funnet i ChatGPT',
    kort: 'Stadig flere spør en AI-assistent i stedet for å google.',
    lang:
      'Når noen spør ChatGPT «hvem kan hjelpe meg med dette i Innlandet», får de ett svar med to ' +
      'navn i – ikke ti lenker å velge mellom. Vi bygger og skriver siden slik at den faktisk ' +
      'kan leses og gjengis av disse tjenestene, og sjekker etterpå hva de svarer om deg.',
    punkter: [
      'Hele innholdet leselig for maskiner, ikke bare for nettlesere',
      'Priser, sted og tjenester skrevet så de kan siteres ordrett',
      'Teknisk merking som forteller hva bedriften er og gjør',
      'Egen fil som oppsummerer bedriften for språkmodeller',
      'Vi spør assistentene om deg og rapporterer hva de svarer',
    ],
  },
  {
    id: 'drift',
    ikon: 'globus',
    navn: 'Domene, e-post og drift',
    kort: 'Vi passer på at alt virker. Du slipper å tenke på det.',
    lang:
      'Domenet fornyes, sertifikatet holdes gyldig, sikkerhetskopien tas hver dag, og vi får ' +
      'beskjed før du gjør det hvis noe slutter å svare. Siden har ingen database og ingen ' +
      'tilleggsprogrammer, så det er lite som kan gå i stykker – og derfor er driften billig.',
    punkter: [
      'Vi fornyer domenet og passer på e-posten',
      'Overvåking døgnet rundt, med varsling til oss',
      'Sikkerhetskopi hver dag',
      'Inntil én time småendringer i måneden',
      'Ingen lisenser eller tilleggsprogrammer å betale for',
      'Ingen bindingstid',
    ],
  },
] as const

import { drift, formaterPris, tilleggstjenester, timepris, type Tillegg } from './pakker'

export type Gruppe = 'inngar' | 'tillegg'

export interface Tjeneste {
  /** Brukes som anker på /tjenester og i strukturerte data. */
  id: string
  gruppe: Gruppe
  navn: string
  /** To setninger. Hva det er, og hvorfor det betyr noe for kunden. */
  tekst: string
  /** Konkret hva som faktisk gjøres – det er dette kunden kjøper. */
  punkter: readonly string[]
  /**
   * Når tjenesten ikke er med i alle pakker, eller inngår i noen av dem.
   * Står som en liten merkelapp på kortet. Må stemme med `pakker.ts`.
   */
  merknad?: string
  /** Navn i `tilleggstjenester` – prisen hentes derfra, aldri skrevet her. */
  priser?: readonly string[]
}

/**
 * Tjenestene, delt i det som inngår og det som er tillegg.
 *
 * Skillet er hele poenget med siden. Kunden lurer ikke på hva vi «kan
 * tilby», men på hva som koster ekstra. Står alt i én liste, må han lete i
 * prislisten for å finne ut av det – og det er der tilliten ryker.
 *
 * Skrivereglene er strenge, fordi leseren som regel ikke er teknisk: ingen
 * fagord uten forklaring, ingen «skreddersydde helhetsløsninger», og hvert
 * punkt skal være noe vi faktisk gjør. Alt her publiseres også som `Service`
 * i strukturerte data, så det er teksten både mennesker og AI-assistenter
 * leser – og den må stemme med `pakker.ts` til siste krone.
 */
export const tjenester: readonly Tjeneste[] = [
  /* ---------------------------------------------------------- inngår */
  {
    id: 'ny-nettside',
    gruppe: 'inngar',
    navn: 'Hele nettsiden, ferdig laget',
    tekst:
      'Vi kjøper domenet i ditt navn, finner ut hvilke sider du trenger, designer siden og ' +
      'setter den på nett. Du bruker rundt to timer til sammen: én prat i starten og én ' +
      'gjennomlesing før vi publiserer.',
    punkter: [
      'Domene kjøpt og registrert i ditt navn',
      'Design laget for bedriften din – ingen ferdigmal',
      'Like god på mobil som på stor skjerm',
      'Kontaktskjema som lander i innboksen din',
      'Lesbar for alle, også med skjermleser',
    ],
  },
  {
    // Ikke «innhold» – den id-en har <main>, og to like id-er gir kortet sidens stil.
    id: 'tekst',
    gruppe: 'inngar',
    navn: 'Tekstene skriver vi',
    tekst:
      'Det som stopper de fleste nettsider er teksten. Vi tar en prat om hva bedriften gjør og ' +
      'hva kundene pleier å spørre om, og skriver sidene ferdig på norsk. Du leser gjennom og ' +
      'sier ja.',
    punkter: [
      'Vi intervjuer deg – du trenger ikke forberede noe',
      'Språk kundene dine kjenner igjen, ikke konsulentspråk',
      'Spørsmål og svar som fanger opp det folk lurer på',
      'Du godkjenner alt før det publiseres',
    ],
  },
  {
    id: 'synlighet',
    gruppe: 'inngar',
    navn: 'Synlig på Google og Google Maps',
    tekst:
      'At siden finnes er ikke det samme som at noen finner den. Vi setter den opp slik Google ' +
      'forstår den fra dag én, og bedriftsprofilen med kart og åpningstider står klar når siden ' +
      'går live.',
    punkter: [
      'Vi finner ut hva kundene dine søker etter',
      'Egen tittel og beskrivelse på hver side',
      'Google Business-profil med kart, bilder og åpningstider',
      'Sitemap og teknisk oppsett som Google forstår',
      'Besøksstatistikk du kan lese uten å være teknisk',
    ],
  },
  {
    id: 'ai-synlighet',
    gruppe: 'inngar',
    navn: 'Synlig i AI-assistenter',
    merknad: 'Fra Bedrift',
    tekst:
      'Spør noen ChatGPT hvem som kan hjelpe dem i Innlandet, får de ett svar med to navn – ' +
      'ikke ti lenker. Vi skriver og merker opp siden slik at den kan leses og siteres, og ' +
      'sjekker hva assistentene faktisk svarer om deg.',
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
    gruppe: 'inngar',
    navn: 'Drift, domene og sikkerhet',
    tekst:
      `Webhotell, domene, sikkerhetskopi hver dag og automatisk varsling hvis siden går ned. ` +
      `Én pris: ${drift.pris} kr i måneden, uten bindingstid. Endringer på innholdet faktureres for seg.`,
    punkter: [
      'Webhotell og fornyelse av domenet',
      'Automatisk overvåking, med varsling hvis siden går ned',
      'Sikkerhetskopi hver dag',
      'Ingen lisenser eller tilleggsprogrammer å betale for',
      `Endringer etter lansering: ${formaterPris(timepris)} kr/t, per påbegynte halvtime`,
    ],
  },
  {
    id: 'eierskap',
    gruppe: 'inngar',
    navn: 'Du eier alt',
    tekst:
      'Domenet, koden, tekstene og bildene står i ditt navn. Vil du bytte leverandør, tar du ' +
      'med deg alt – uten å spørre oss.',
    punkter: [
      'Domenet registreres på deg, ikke på oss',
      'Kildekoden er din',
      'Tekster og bilder kan du bruke hvor du vil',
      'Ingen bindingstid, verken på siden eller driften',
    ],
  },

  /* --------------------------------------------------------- tillegg */
  {
    id: 'foto',
    gruppe: 'tillegg',
    navn: 'Foto og dronevideo',
    merknad: 'Halv dag inngår i Bedrift',
    priser: ['Foto og dronevideo'],
    tekst:
      'Lokalene, produktene, arbeidet og folkene – og fra lufta når motivet fortjener det. Egne ' +
      'bilder er det enkleste grepet som skiller en troverdig side fra en som ser ut som alle ' +
      'andre.',
    punkter: [
      'Halv eller hel dag med fotografering hos deg',
      'Dronefoto og -video av bygg, anlegg og uteområder',
      'Kortvideo til forsiden og sosiale medier',
      'Du eier bildene og kan bruke dem til hva du vil',
    ],
  },
  {
    id: 'profil',
    gruppe: 'tillegg',
    navn: 'Logo og visuell profil',
    priser: ['Logo', 'Visuell profil'],
    tekst:
      'Har du ikke en logo – eller en som ble laget i Word i 2011 – tegner vi en ny, med farger ' +
      'og skrifttyper som hører sammen. Vil du heller lage den selv, kan du bruke logoverktøyet vårt.',
    punkter: [
      'Tre logoforslag, du velger ett',
      'Alle filformater: nett, trykk, skilt og bil',
      'Fargepalett og skrifttyper som hører sammen',
      'Kort profilark som viser hvordan det brukes',
    ],
  },
  {
    id: 'verktoy',
    gruppe: 'tillegg',
    navn: 'Kalkulator eller booking',
    merknad: 'Inngår i Vekst',
    priser: ['Regneverktøy eller kalkulator'],
    tekst:
      'Kunden regner ut prisen selv eller booker en tid, og du får henvendelsen ferdig utfylt ' +
      'i stedet for en telefon. Bygget inn i siden, uten månedsleie til andre.',
    punkter: [
      'Priskalkulator tilpasset det du selger',
      'Tilbudsskjema som stiller ett spørsmål om gangen',
      'Booking med bekreftelse på e-post',
      'Befaringsskjema der kunden legger ved bilde av jobben',
      'Dataene lagres i Europa',
    ],
  },
  {
    id: 'tredim',
    gruppe: 'tillegg',
    navn: '3D-visning og designverktøy',
    priser: ['3D-visning og designverktøy'],
    tekst:
      'Kunden snur på produktet, velger mål og materiale, og ser pris og materialliste endre ' +
      'seg. Levert i praksis på minio.no. Spennet er stort, så prisen settes etter en prat.',
    punkter: [
      'Produktet i 3D, sett fra alle kanter',
      'Mål, materiale og tilvalg – modellen følger med',
      'Materialliste og pris regnet ut fra valgene',
      'Forespørselen kommer inn med tegningen lagret',
    ],
  },
  {
    id: 'ekstra-side',
    gruppe: 'tillegg',
    navn: 'Ekstra side',
    priser: ['Ekstra side'],
    tekst:
      'En ny tjeneste-, produkt- eller stedsside utover det pakken dekker, ferdig skrevet av oss. ' +
      'Du får prisen før vi begynner.',
    punkter: ['Skrevet etter en kort prat med deg', 'Samme design og oppsett som resten av siden'],
  },
  {
    id: 'fagartikler',
    gruppe: 'tillegg',
    navn: 'Fagartikler',
    merknad: 'Seks inngår i Vekst',
    priser: ['Fagartikkel'],
    tekst:
      'En artikkel på 800–1 200 ord som svarer på noe kundene dine faktisk googler. Det er den ' +
      'typen innhold både Google og AI-assistenter siterer.',
    punkter: ['Tema valgt ut fra hva kundene dine søker etter', 'Skrevet etter en prat med deg'],
  },
] as const

/** Tilleggene en tjeneste viser pris for, slått opp i `pakker.ts`. */
export function prisFor(t: Tjeneste): Tillegg[] {
  return (t.priser ?? []).map((navn) => {
    const funnet = tilleggstjenester.find((x) => x.navn === navn)
    if (!funnet) throw new Error(`Fant ikke tillegget «${navn}» i pakker.ts`)
    return funnet
  })
}

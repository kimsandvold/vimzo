/**
 * Prisene – som anslag, ikke som prisliste.
 *
 * Hver nettside lages for én bedrift, og den endelige prisen avhenger av hvor
 * mye tekst som skal skrives, om vi må ut og ta bilder, og hva siden skal gjøre.
 * Derfor oppgis typiske prosjekter med et spenn, ikke et eksakt tall. Spennet
 * er ærlig: det er der de fleste lander. Den endelige prisen avtales etter en
 * prat, skriftlig – og da står den.
 *
 * Tallene er ikke runde med vilje: «19 900–28 900» leser som en vurdert
 * pris, «20 000–30 000» som en gjetning.
 *
 * Nivået er satt bevisst: under det byråene tar, men ikke på bunnen. Erfaring
 * og håndlaget arbeid skal ikke selges som en hyllevare, og vi skal ikke
 * presse prisene for andre seriøse aktører.
 *
 * Alt annet på siden – forsiden, prissiden, tjenestesiden, kontaktskjemaet,
 * strukturerte data og llms.txt – leser herfra.
 *
 * Alle priser er i NOK og oppgitt eks. mva.
 */

/** Et prisspenn. `til: null` betyr «fra»: jobben har ingen naturlig øvre grense. */
export interface Prisramme {
  fra: number
  til: number | null
}

export interface Pakke {
  id: string
  navn: string
  /** Én linje: hvem dette typisk passer for. Skrevet som man snakker. */
  for: string
  /** Hvor de fleste lander. Den endelige prisen avtales etter en prat. */
  pris: Prisramme
  /** Antall sider, formulert for mennesker. */
  omfang: string
  punkter: readonly string[]
  /** Det som oftest flytter prisen innenfor spennet. */
  drivere: readonly string[]
  /**
   * Satt for kortvarige sider: så mange måneder drift er med i prisen. Da
   * finnes det ingen løpende driftskostnad å vise, og ingen treårstotal.
   */
  driftInkludertMnd?: number
}

/** Når prisene sist ble gjennomgått. Vises på prissiden og i strukturerte data. */
export const PRISER_OPPDATERT = '2026-11-07'

export const ANTALL_AVDRAG = 12

/**
 * Påslaget når beløpet deles over tolv avdrag. Står åpent på prissiden –
 * en side som selger tillit har ikke råd til liten skrift.
 */
export const AVDRAGSPASLAG = 0.04

export const pakker: readonly Pakke[] = [
  {
    id: 'start',
    navn: 'Start',
    for: 'For deg som skal være lett å finne og lett å ringe – en håndverker, en frisør, en rådgiver.',
    pris: { fra: 19900, til: 28900 },
    omfang: '1–3 sider',
    punkter: [
      'Domene i ditt navn',
      'Alle tekster skrevet av oss',
      'Eget design, ingen mal',
      'Like god på mobil, nettbrett og PC',
      'Kontaktskjema til e-posten din',
      'Synlig på Google og Google Maps',
    ],
    drivere: ['Hvor mye tekst som skal skrives', 'Om det finnes bilder fra før'],
  },
  {
    id: 'bedrift',
    navn: 'Bedrift',
    for: 'For bedriften som skal selge tjenestene sine, ikke bare vises fram.',
    pris: { fra: 34900, til: 48900 },
    omfang: '4–8 sider',
    punkter: [
      'Alt i Start',
      'Egen side per tjeneste',
      'Halv dag foto hos deg',
      'E-post på eget domene',
      'Synlig i AI-assistenter',
    ],
    drivere: ['Antall tjenester og steder', 'Om en gammel side skal flyttes, med e-post og lenker'],
  },
  {
    id: 'vekst',
    navn: 'Vekst',
    for: 'For deg som vil at nettsiden skal gjøre en jobb – regne ut priser, ta imot bestillinger.',
    pris: { fra: 59900, til: null },
    omfang: 'Etter behov',
    punkter: [
      'Alt i Bedrift',
      'Priskalkulator eller booking',
      'Hel dag foto og drone',
      'Seks fagartikler',
      'Månedsrapport i tre måneder',
    ],
    drivere: ['Hva verktøyet skal regne ut eller ta imot', 'Innlogging, betaling eller koblinger til andre systemer'],
  },
  {
    /*
     * Kortvarige sider til messer, konferanser, lanseringer og kampanjer.
     * Jobben er smal og forutsigbar, så spennet er trangere enn for de andre.
     * Tre måneders drift er med – etterpå blir den en «takk for i år»-side
     * eller tas ned. Se /arrangement.
     */
    id: 'arrangement',
    navn: 'Arrangement',
    for: 'For en messe, en konferanse, en lansering eller en kampanje – en side som skal se ordentlig ut den perioden den gjelder.',
    pris: { fra: 11900, til: 17900 },
    omfang: 'Én side · 3 måneder drift inkludert',
    driftInkludertMnd: 3,
    punkter: [
      'Program, tid, sted og praktisk info',
      'Eget design i arrangementets farger',
      'Nedtelling og delingsbilde for sosiale medier',
      'QR-kode til plakat og messestand',
      'Klar på 1–2 uker',
    ],
    drivere: ['Hvor mange programposter, talere eller utstillere', 'Om dere trenger egen påmelding'],
  },
] as const

/** Sidene som skal leve over tid – det de fleste mener med «en nettside». */
export const varigePakker = pakker.filter((p) => !p.driftInkludertMnd)

/** Den kortvarige arrangementssiden. */
export const arrangement = pakker.find((p) => p.id === 'arrangement') as Pakke

/** Månedsbeløpet når et beløp deles over tolv avdrag, rundet til nærmeste tier. */
export function avdrag(belop: number): number {
  return Math.round((belop * (1 + AVDRAGSPASLAG)) / ANTALL_AVDRAG / 10) * 10
}

/** Et spenn som tekst: «35 000–50 000» eller «fra 60 000». Uten «kr». */
export function formaterRamme(r: Prisramme): string {
  return r.til === null ? `fra ${formaterPris(r.fra)}` : `${formaterPris(r.fra)}–${formaterPris(r.til)}`
}

/** Legg et fast beløp til et spenn. */
export function leggTil(r: Prisramme, belop: number): Prisramme {
  return { fra: r.fra + belop, til: r.til === null ? null : r.til + belop }
}

/** Spennet delt over tolv avdrag. */
export function avdragRamme(r: Prisramme): Prisramme {
  return { fra: avdrag(r.fra), til: r.til === null ? null : avdrag(r.til) }
}

/**
 * Timepris for endringer og arbeid utenfor avtalt omfang.
 *
 * Modellen er bevisst: kunden får ikke et publiseringssystem å logge seg inn
 * i og fylle selv. Å skrive innhold som både leser godt og rangerer er et fag,
 * og sider eieren skal fylle mellom alt annet, forfaller nesten alltid.
 *
 * Alle endringer etter leveranse faktureres – også de små. Driften dekker det
 * som holder siden i live, ikke arbeid på den. Det er ærligere enn å love
 * «småendringer inngår» og så måtte trekke grensen i hver enkelt sak, og det
 * er det eneste som holder en sidejobb innenfor det den har kapasitet til.
 *
 * Endringer faktureres per påbegynte halvtime. Det forutsigbare – en ny
 * side, en fagartikkel – har fast pris, og kunden får alltid et anslag før
 * større jobber.
 */
export const timepris = 1250

/** Minste fakturerbare enhet for endringer, i minutter. */
export const ENDRINGSENHET_MIN = 30

/** Hva den minste endringen koster: en påbegynt halvtime. */
export const minsteEndring = Math.round((timepris * ENDRINGSENHET_MIN) / 60)

export interface Tillegg {
  navn: string
  pris: number
  /** «fra 7 900 kr» når omfanget varierer. */
  fraPris?: boolean
  enhet?: string
  beskrivelse: string
}

/**
 * Tilleggene. Satt etter hva jobben faktisk tar, ikke for å se billig ut:
 * en skreddersydd kalkulator til 4 900 ville vært dumping, og det ville
 * fortalt kunden at det er en ferdigmal vi bare skrur på.
 */
export const tilleggstjenester: readonly Tillegg[] = [
  {
    navn: 'Regneverktøy eller kalkulator',
    pris: 9900,
    fraPris: true,
    beskrivelse:
      'En priskalkulator, en bookingløsning eller et tilbudsskjema i flere steg, bygget for det ' +
      'du selger og lagt rett inn i siden. Ingen lisens eller abonnement på selve verktøyet.',
  },
  {
    navn: 'Logo',
    pris: 4900,
    beskrivelse:
      'En ny logo tegnet for bedriften din, levert i alle filformatene du trenger – til nett, ' +
      'til trykk, til bil og skilt. Du får tre forslag og velger ett. Vil du heller lage den ' +
      'selv, kan du bruke logoverktøyet vårt.',
  },
  {
    navn: 'Visuell profil',
    pris: 9900,
    beskrivelse:
      'Logo, fargepalett, skrifttyper og et kort profilark som viser hvordan de brukes. Da ser ' +
      'nettsiden, fakturaen, arbeidstøyet og Facebook-siden ut som samme bedrift. Inkluderer ' +
      'logoen over.',
  },
  {
    navn: 'Foto og dronevideo',
    pris: 7900,
    fraPris: true,
    beskrivelse:
      'Halv dag hos deg: bilder av lokaler, produkter og folk, dronefoto av bygg og uteområder, ' +
      'og én kortvideo til forsiden. Ferdig redigert. Du eier bildene.',
  },
  {
    navn: '3D-visning og designverktøy',
    pris: 24900,
    fraPris: true,
    beskrivelse:
      'Produktet ditt bygget i 3D i nettleseren: kunden snur på det, velger mål og materiale, ' +
      'og ser pris og materialliste endre seg med valgene. Spennet er stort – en enkel ' +
      'produktvisning er én jobb, et fullt designverktøy som det på minio.no er en annen – ' +
      'så her settes prisen etter en prat.',
  },
  {
    navn: 'Ekstra side',
    pris: 3900,
    fraPris: true,
    beskrivelse: 'En ny tjeneste-, produkt- eller stedsside utover det som er avtalt, ferdig skrevet av oss.',
  },
  {
    navn: 'Fagartikkel',
    pris: 3400,
    enhet: 'per artikkel',
    beskrivelse:
      'En artikkel på 800–1 200 ord som svarer på noe kundene dine faktisk googler, skrevet ' +
      'etter en prat med deg.',
  },
  {
    navn: 'Påmelding til arrangement',
    pris: 4900,
    fraPris: true,
    beskrivelse:
      'Påmeldingsskjema på arrangementssiden, med bekreftelse på e-post til deltakeren og ' +
      'en oversikt over hvem som kommer. Uten billettsystem og uten avgift per påmelding.',
  },
  {
    navn: 'Ny utgave av arrangementsside',
    pris: 6000,
    fraPris: true,
    beskrivelse:
      'Samme side neste år, med nye datoer, nytt program og nye bilder. Designet står, så ' +
      'det meste av jobben er allerede gjort.',
  },
  {
    navn: 'Endringer etter lansering',
    pris: timepris,
    enhet: 'per time',
    beskrivelse:
      'Alt fra et nytt telefonnummer til en ny funksjon. Faktureres per påbegynte halvtime, så ' +
      'en liten endring koster ' +
      `${formaterPris(Math.round((timepris * 30) / 60))} kroner. Ved større jobber får du alltid et anslag før ` +
      'vi setter i gang.',
  },
] as const

/** Slå opp et tillegg på navn. Kaster hvis det ikke finnes – en skrivefeil skal stoppe bygget. */
export function tillegg(navn: string): Tillegg {
  const funnet = tilleggstjenester.find((t) => t.navn === navn)
  if (!funnet) throw new Error(`Fant ikke tillegget «${navn}» i pakker.ts`)
  return funnet
}

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
 * Den er lav fordi det er lite å drifte: ferdige filer på et vanlig
 * webhotell, ingen database å oppdatere, ingen tillegg som må lappes. Det er
 * ikke en rabatt – det er hva det faktisk koster, pluss tiden vår.
 */
export const driftsnivaer: readonly Driftsniva[] = [
  {
    id: 'drift',
    navn: 'Drift',
    pris: 449,
    periode: 'per måned',
    for: 'Det som holder siden i live. Endringer på innholdet faktureres for seg.',
    anbefalt: true,
    punkter: [
      'Webhotell og fornyelse av domenet',
      'Automatisk overvåking, med varsling hvis siden går ned',
      'Sikkerhetskopi hver dag',
      'Sikkerhetssertifikat (https) som holdes gyldig',
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

/** Hva det koster å eie siden i et gitt antall måneder: bygget, pluss driften som løper. */
export function eieOver(r: Prisramme, maneder: number = SAMMENLIGNINGSPERIODE): Prisramme {
  return leggTil(r, drift.pris * maneder)
}

export const prisnotat =
  'Spennene viser hvor de fleste prosjektene lander. Den endelige prisen avtaler vi etter en ' +
  'prat, og du får den skriftlig før vi begynner. Da står den – også om arbeidet tar lengre ' +
  `tid enn vi trodde. Første års domene er inkludert; etter det koster det rundt ${domenepris} ` +
  `kroner i året. Driften er ${drift.pris} kroner i måneden uansett hva siden gjør. ` +
  'Alle priser er eks. mva.'

/**
 * Hva det koster å endre noe etter lansering.
 *
 * Kunden skal vite hva som er gratis å spørre om uten å måtte lese en
 * prisliste først – terskelen for å be om en endring er det eneste som
 * avgjør om siden holder seg oppdatert.
 */
export const endringsnotat =
  'Endringer etter lansering faktureres, også de små – driften dekker det som holder siden i ' +
  `live, ikke arbeid på den. Timeprisen er ${formaterPris(timepris)} kroner, per påbegynte ` +
  `halvtime, så et nytt telefonnummer eller nye åpningstider koster ${formaterPris(minsteEndring)}. ` +
  `En ny side har fast pris fra ${formaterPris(tillegg('Ekstra side').pris)} kroner, en fagartikkel ` +
  `${formaterPris(tillegg('Fagartikkel').pris)}. Ved større jobber får du alltid et anslag først.`

export const delbetalingsnotat =
  `Du kan dele beløpet over ${ANTALL_AVDRAG} måneder, med 0 kroner i oppstart. Påslaget er ` +
  `${Math.round(AVDRAGSPASLAG * 100)} %, og det står i tilbudet. Ingen renter, ingen ` +
  'kredittsjekk – og etter tolv måneder er siden betalt. Det eneste som løper videre er driften.'

/**
 * «14 900» med hardt mellomrom som tusenskille, for ren tekst (skjemafelter,
 * meta-beskrivelser). Til beløp som vises stort i mono, bruk `<Belop>` –
 * mono-fonten gir mellomrommet full tegnbredde og sprenger tallet i to.
 */
export function formaterPris(verdi: number): string {
  return verdi.toLocaleString('nb-NO').replace(/\s/g, ' ')
}

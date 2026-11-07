/**
 * Prisene – som anslag, ikke som prisliste.
 *
 * Hver nettside lages for én bedrift, og den endelige prisen avhenger av hvor
 * mye tekst som skal skrives, om vi må ut og ta bilder, og hva siden skal gjøre.
 * Derfor oppgis typiske prosjekter med et spenn, ikke et eksakt tall. Spennet
 * er ærlig: det er der de fleste lander. Den endelige prisen avtales etter en
 * prat, skriftlig – og da står den.
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
}

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
    pris: { fra: 20000, til: 30000 },
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
    pris: { fra: 35000, til: 50000 },
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
    pris: { fra: 60000, til: null },
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
] as const

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
 * Men timeprisen er unntaket, ikke mekanismen. Siden er skreddersydd og har
 * ingen innlogging, så kunden kan ikke rette en telefonnummer selv om han
 * ville. Satte vi en teller på hver småting, ville han sluttet å spørre – og
 * da forfaller siden akkurat slik vi sier at den ikke skal. Derfor inngår
 * småendringer i driften, det forutsigbare har fast pris, og timer bruker vi
 * bare når ingenting annet passer.
 */
export const timepris = 1250

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
      'til trykk, til bil og skilt. Du får tre forslag og velger ett. Vil du prøve deg fram ' +
      'selv først, kan du bruke logoverktøyet vårt gratis.',
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
    navn: 'Større endringer senere',
    pris: timepris,
    enhet: 'per time',
    beskrivelse:
      'Småendringer inngår i driften, og det forutsigbare har fast pris. Timer bruker vi bare ' +
      'når ingenting annet passer – en ombygging, en ny funksjon, noe vi ikke har gjort før. ' +
      'Du får alltid et anslag før vi setter i gang.',
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
    for: 'Én pris, enten siden bare står der eller tar imot bestillinger.',
    anbefalt: true,
    punkter: [
      'Vi passer på at siden er oppe, hele døgnet',
      'Sikkerhetskopi hver dag',
      'Småendringer inngår – en pris, en setning, nye åpningstider',
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
  'Småendringer inngår i driften: telefon, åpningstider, en pris eller en setning. Si fra, så ' +
  'retter vi det. Skal du ha noe nytt, får du fast pris før vi gjør det – en ny side fra ' +
  `${formaterPris(tillegg('Ekstra side').pris)} kroner, en fagartikkel ` +
  `${formaterPris(tillegg('Fagartikkel').pris)}. Timepris på ${formaterPris(timepris)} bruker vi ` +
  'bare når ingenting annet passer, og da får du et anslag først.'

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

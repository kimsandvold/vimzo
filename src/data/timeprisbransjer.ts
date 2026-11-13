import { kronerTilOre } from '../lib/kroner'
import type { KostnadsfeltId } from './timepris'

/**
 * Bransjeprofilene til timepriskalkulatoren.
 *
 * Hver profil er en egen URL – /timepris/snekker, /timepris/rorlegger – og
 * det er de som skal rangere. «Hva skal jeg ta i timen» søkes sjelden; «hva
 * skal en snekker ta i timen» søkes hele tiden.
 *
 * Derfor er dette IKKE samme side med et nytt ord satt inn. Hver profil har
 * egne typiske kostnader, egen fakturerbar andel med en begrunnelse som bare
 * gjelder den bransjen, og egne spørsmål og svar. En rørlegger har varebil og
 * lager; en frisør har salong og produkter; en maler har stillas og mye
 * kjøring. Gjør vi dem like, lager vi portalsider Google med rette straffer –
 * og vi hjelper ingen.
 *
 * Tallene er typiske nivåer til å regne videre fra, ikke fasit. Det står på
 * siden, og det skal det fortsette å gjøre.
 */

export interface BransjeSporsmal {
  readonly sporsmal: string
  readonly svar: string
}

export interface Bransjeprofil {
  readonly slug: string
  /** «Snekker». Brukes i lister og i smulestien. */
  readonly navn: string
  /** «en snekker». Brukes midt i setninger. */
  readonly ubestemt: string
  /** Sidetittel – dette er søket vi vil treffe. */
  readonly tittel: string
  /** Meta-beskrivelse. Maks ~155 tegn. */
  readonly ingress: string
  /**
   * Svaret på sidens hovedspørsmål, i én bolk. Står øverst og merkes opp
   * separat – det er denne en AI-assistent siterer.
   */
  readonly kortsvar: string
  /** Hvorfor kostnadsbildet ser ut som det gjør i denne bransjen. */
  readonly kostnadstekst: string
  /** Hvorfor den fakturerbare andelen er som den er her. */
  readonly tidstekst: string
  readonly typisk: {
    readonly fakturerbarAndel: number
    readonly arbeidsuker: number
    readonly timerPerUke: number
    readonly fasteKostnader: Readonly<Record<KostnadsfeltId, number>>
  }
  readonly sporsmal: readonly BransjeSporsmal[]
}

const kr = kronerTilOre

export const BRANSJEPROFILER: readonly Bransjeprofil[] = [
  {
    slug: 'snekker',
    navn: 'Snekker',
    ubestemt: 'en snekker',
    tittel: 'Hva skal en snekker ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta som snekker for at lønn, verksted, verktøy og ubetalt tid går ' +
      'opp. Gratis kalkulator, ingen innlogging.',
    kortsvar:
      'Timeprisen til en snekker er ikke en markedspris du slår opp – den er et regnestykke med ' +
      'fire tall: hva du vil tjene, hva det koster å drive, hvor mange timer du jobber, og hvor ' +
      'stor andel av dem du faktisk får betalt for. Den siste er den som velter kalkylen for de ' +
      'fleste. En snekker med eget verksted som vil ha 600 000 før skatt, har 150 000 i faste ' +
      'kostnader og får fakturert 65 % av timene sine, må ta rundt 630 kroner timen eks. mva. ' +
      'bare for å gå i null – før det er lagt på en krone i overskudd.',
    kostnadstekst:
      'Verkstedet er den tunge posten, og den som oftest glemmes helt når man regner på en jobb. ' +
      'Husleie, strøm og forsikring løper enten du har oppdrag eller ikke. Maskinparken er den ' +
      'andre: en kombimaskin, avsug og håndverktøy slites ned og må erstattes, og den utgiften ' +
      'hører hjemme i timeprisen – ikke i en dårlig overraskelse det året båndsaga ryker.',
    tidstekst:
      'Snekkerarbeid har mye ubetalt tid rundt seg. Befaring og oppmåling, tegning, tilbud som ' +
      'aldri blir til noe, henting av materialer, og rydding og vedlikehold av verkstedet. Jobber ' +
      'du på bestilling mot privatkunder, går det også tid til å svare på henvendelser som aldri ' +
      'blir en ordre. 60–70 % er realistisk for de fleste.',
    typisk: {
      fakturerbarAndel: 65,
      arbeidsuker: 46,
      timerPerUke: 40,
      fasteKostnader: {
        lokale: kr(72_000),
        forsikring: kr(14_000),
        verktoy: kr(30_000),
        transport: kr(45_000),
        regnskap: kr(12_000),
        kontor: kr(15_000),
        annet: kr(10_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Er timeprisen med eller uten mva.?',
        svar:
          'Kalkulatoren regner timeprisen eksklusive merverdiavgift. Er du registrert i ' +
          'Merverdiavgiftsregisteret, legger du 25 % på toppen når du fakturerer en privatkunde. ' +
          'Er du under registreringsgrensen, skal du ikke fakturere mva. – men da får du heller ' +
          'ikke fradrag for mva. på materialer, og den kostnaden må inn i kalkylen.',
      },
      {
        sporsmal: 'Hvorfor er timeprisen høyere enn det jeg tjener i timen?',
        svar:
          'Fordi timeprisen skal dekke mer enn lønnen din. Den skal dekke verksted, forsikring, ' +
          'verktøy, bil, regnskap, ferie, og alle timene du jobber uten å kunne fakturere dem. ' +
          'En timepris på 700 kroner kan godt gi 300 kroner igjen til deg selv før skatt.',
      },
      {
        sporsmal: 'Bør jeg ta samme timepris på alt?',
        svar:
          'Nei. Timeprisen fra kalkulatoren er gulvet – det du må ha i snitt for at året skal gå ' +
          'opp. På spesialarbeid, hastejobber og oppdrag som krever mye oppmåling eller tegning ' +
          'kan du og bør du ligge over. Det som er farlig, er å ligge under uten å vite det.',
      },
    ],
  },

  {
    slug: 'rorlegger',
    navn: 'Rørlegger',
    ubestemt: 'en rørlegger',
    tittel: 'Hva skal en rørlegger ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta som rørlegger for at lønn, varebil, lager, sertifisering og ' +
      'ubetalt tid går opp. Gratis kalkulator.',
    kortsvar:
      'En rørlegger som driver for seg selv må som regel ligge høyere i timepris enn man tror, ' +
      'fordi tre kostnader er uvanlig tunge i faget: varebilen med lager, forsikringen, og ' +
      'sertifiseringene som må holdes ved like. Vil du ha 650 000 før skatt, har 200 000 i faste ' +
      'kostnader og fakturerer 65 % av timene dine, må du ta rundt 710 kroner timen eks. mva. ' +
      'for å gå i null. Legger du på en normal buffer på 15 %, lander du over 800.',
    kostnadstekst:
      'Varebilen er ikke bare transport – den er lager. Deler, verktøy og utstyr du må ha med ' +
      'uansett, pluss drivstoff, service og forsikring. Mange rørleggere undervurderer også ' +
      'hvor mye kapital som står bundet i deler de ikke har fakturert ennå. Sertifisering, ' +
      'våtromsdokumentasjon og obligatoriske kurs er en fast årlig post som må bæres av ' +
      'timeprisen.',
    tidstekst:
      'Kjøretiden er den store tyven. Mellom oppdrag, til grossist, tilbake for den delen som ' +
      'manglet. I tillegg kommer befaring, dokumentasjon av våtrom og garantisaker du ikke kan ' +
      'fakturere. Rørleggere som jobber mot privatmarkedet ligger ofte lavere enn 65 % – sjekk ' +
      'mot egne timelister før du antar.',
    typisk: {
      fakturerbarAndel: 62,
      arbeidsuker: 46,
      timerPerUke: 40,
      fasteKostnader: {
        lokale: kr(48_000),
        forsikring: kr(22_000),
        verktoy: kr(35_000),
        transport: kr(85_000),
        regnskap: kr(15_000),
        kontor: kr(15_000),
        annet: kr(20_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Skal materialer og deler inn i timeprisen?',
        svar:
          'Nei. Deler og materialer faktureres for seg, normalt med et påslag som dekker innkjøp, ' +
          'lagerhold og risiko. Det som hører hjemme i timeprisen, er det du har uansett: bilen, ' +
          'verktøyet, forsikringen, sertifiseringen og den ubetalte tiden.',
      },
      {
        sporsmal: 'Hvordan regner jeg inn kjøretiden?',
        svar:
          'To måter, og begge er riktige så lenge du er konsekvent. Enten fakturerer du kjøretid ' +
          'som egne timer – da er de fakturerbare. Eller så gjør du det ikke, og da må de trekkes ' +
          'fra den fakturerbare andelen, slik at timeprisen dekker dem indirekte. Det farlige er ' +
          'å gjøre verken eller.',
      },
      {
        sporsmal: 'Hva med beredskap og utrykning?',
        svar:
          'Har du vakt eller rykker ut utenom arbeidstid, hører det ikke inn i den ordinære ' +
          'timeprisen. Det er et eget produkt med egen pris. Regn ut grunntimeprisen her først, ' +
          'og legg utrykningstillegget oppå.',
      },
    ],
  },

  {
    slug: 'elektriker',
    navn: 'Elektriker',
    ubestemt: 'en elektriker',
    tittel: 'Hva skal en elektriker ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta som elektriker når internkontroll, sertifisering, bil og ' +
      'ubetalt dokumentasjonstid skal dekkes. Gratis kalkulator.',
    kortsvar:
      'Elektrikerfaget har en kostnad de fleste andre håndverkere slipper: dokumentasjon og ' +
      'internkontroll som kreves av regelverket, og som sjelden kan faktureres time for time. ' +
      'Den tiden må bæres av timeprisen på alt annet arbeid. En elektriker som vil ha 650 000 ' +
      'før skatt, har 190 000 i faste kostnader og fakturerer 60 % av timene sine, må ta rundt ' +
      '760 kroner timen eks. mva. for å gå i null – og nærmere 880 med en normal buffer.',
    kostnadstekst:
      'Måleinstrumenter skal kalibreres, og de er dyre. Internkontrollsystem, ' +
      'elvirksomhetsregisteret og faglig ansvarlig er faste poster som løper uansett ' +
      'oppdragsmengde. Bilen med lager kommer i tillegg, som for rørleggeren. Til sammen er ' +
      'det et kostnadsbilde som gjør at en lav timepris sjelden er lønnsom i det hele tatt.',
    tidstekst:
      'Samsvarserklæringer, risikovurderinger og dokumentasjon tar tid som kunden ikke ser og ' +
      'sjelden betaler for direkte. Legg til kjøring, befaring og tilbud, og 55–65 % er ' +
      'realistisk. Setter du 80 %, regner du på et år du ikke kommer til å ha.',
    typisk: {
      fakturerbarAndel: 60,
      arbeidsuker: 46,
      timerPerUke: 40,
      fasteKostnader: {
        lokale: kr(42_000),
        forsikring: kr(24_000),
        verktoy: kr(40_000),
        transport: kr(80_000),
        regnskap: kr(18_000),
        kontor: kr(16_000),
        annet: kr(30_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Kan jeg fakturere dokumentasjonstiden?',
        svar:
          'Noe av den kan du, og bør du – særlig på større anlegg der samsvarserklæring og ' +
          'sluttdokumentasjon er en synlig leveranse. Men mye av den løpende internkontrollen ' +
          'er din egen plikt og ikke kundens kjøp. Den må dekkes av timeprisen.',
      },
      {
        sporsmal: 'Hvorfor er timeprisen høyere enn det kollegaen min tar?',
        svar:
          'Enten fordi han har lavere kostnader, fordi han fakturerer en større andel av tiden ' +
          'sin, eller fordi han ikke har regnet. Det tredje er vanligere enn de to første. ' +
          'Kalkulatoren forteller deg hva ditt eget år krever – ikke hva markedet gjør.',
      },
      {
        sporsmal: 'Bør lærlinger regnes inn?',
        svar:
          'Har du lærling, er det en egen kalkyle: lærlingen koster lønn og tid fra deg, og ' +
          'fakturerer færre timer enn en svenn. Regn ut din egen timepris her først, og se på ' +
          'lærlingen som et eget regnestykke ved siden av.',
      },
    ],
  },

  {
    slug: 'maler',
    navn: 'Maler',
    ubestemt: 'en maler',
    tittel: 'Hva skal en maler ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta som maler når rigg, stillas, kjøring og ubetalt ' +
      'forberedelsestid skal dekkes. Gratis kalkulator, ingen innlogging.',
    kortsvar:
      'Malerfaget prises ofte per kvadratmeter, men bak kvadratmeterprisen ligger alltid en ' +
      'timepris – og den må være riktig, ellers taper du på hver jobb uten å se det. En maler ' +
      'som vil ha 550 000 før skatt, har 120 000 i faste kostnader og fakturerer 65 % av timene ' +
      'sine, må ta rundt 560 kroner timen eks. mva. for å gå i null. Rigg, maskering og ' +
      'opprydding er en stor del av arbeidet og må enten faktureres eller bakes inn.',
    kostnadstekst:
      'Stillas, lift og sprøyteutstyr er kapitalkrevende, enten du eier eller leier. Bilen går ' +
      'mye, og forbruksmateriell som maskeringstape, plast, filler og pensler er en løpende ' +
      'kostnad det er lett å glemme å føre. Mange malere har lavere lokalkostnad enn andre ' +
      'håndverkere, men høyere utstyrs- og transportkostnad.',
    tidstekst:
      'Rigging, maskering, dekking og opprydding kan utgjøre en tredjedel av tiden på en jobb. ' +
      'Fakturerer du bare «maletimene», regner du feil på hele oppdraget. Enten tar du med all ' +
      'tid på jobben som fakturerbar og legger riggen inn i tilbudet – eller så senker du den ' +
      'fakturerbare andelen tilsvarende.',
    typisk: {
      fakturerbarAndel: 65,
      arbeidsuker: 46,
      timerPerUke: 40,
      fasteKostnader: {
        lokale: kr(30_000),
        forsikring: kr(14_000),
        verktoy: kr(25_000),
        transport: kr(60_000),
        regnskap: kr(12_000),
        kontor: kr(14_000),
        annet: kr(12_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Jeg priser per kvadratmeter – trenger jeg en timepris?',
        svar:
          'Ja, og mer enn de fleste. Kvadratmeterprisen er bare en timepris ganget med hvor fort ' +
          'du jobber. Vet du ikke timeprisen din, vet du ikke om kvadratmeterprisen er lønnsom – ' +
          'du vet bare at du fikk jobben.',
      },
      {
        sporsmal: 'Skal maling og materialer inn i timeprisen?',
        svar:
          'Nei, de faktureres for seg, normalt med påslag. Forbruksmateriell som tape, plast og ' +
          'filler kan du enten fakturere som materiell eller legge inn som en fast kostnad i ' +
          'kalkylen. Velg én av delene, og gjør det likt hver gang.',
      },
      {
        sporsmal: 'Hva med jobber der jeg bruker stillas?',
        svar:
          'Stillasleie faktureres som en egen post. Eier du stillaset selv, hører det hjemme ' +
          'under verktøy og utstyr i kalkylen – da betaler alle jobbene litt på det, i stedet ' +
          'for at én jobb bærer hele investeringen.',
      },
    ],
  },

  {
    slug: 'anleggsgartner',
    navn: 'Anleggsgartner',
    ubestemt: 'en anleggsgartner',
    tittel: 'Hva skal en anleggsgartner ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta som anleggsgartner når maskiner, henger, sesong og ubetalt ' +
      'tid skal dekkes. Gratis kalkulator.',
    kortsvar:
      'Anleggsgartnerfaget har en utfordring de fleste andre slipper: sesongen. Inntekten skal ' +
      'tjenes inn på langt færre uker enn året har, og vinteren må finansieres av sommeren. Det ' +
      'betyr at timeprisen må være høyere, ikke lavere, enn i fag som går jevnt hele året. ' +
      'Regner du med 34 arbeidsuker i stedet for 46, stiger timeprisen med over en tredjedel – ' +
      'og det er den riktige prisen, ikke en påplussing.',
    kostnadstekst:
      'Maskiner er den tunge posten: minigraver, henger, plateviber, jordfreser, og en bil som ' +
      'tåler å dra det. Alt skal vedlikeholdes, forsikres og erstattes. Har du lagerplass til ' +
      'maskiner og masser, kommer den i tillegg. Dette er et fag der en for lav timepris spiser ' +
      'opp maskinparken over noen år uten at det vises før den må byttes.',
    tidstekst:
      'Sett arbeidsukene etter sesongen din, ikke etter kalenderen. Mange anleggsgartnere har ' +
      '30–38 reelle produksjonsuker. I tillegg kommer befaring, tilbud, planlegging og ' +
      'maskinvedlikehold. Vinterarbeid som brøyting kan jevne ut året – men det er en egen ' +
      'kalkyle, ikke en forlengelse av denne.',
    typisk: {
      fakturerbarAndel: 65,
      arbeidsuker: 34,
      timerPerUke: 45,
      fasteKostnader: {
        lokale: kr(50_000),
        forsikring: kr(20_000),
        verktoy: kr(80_000),
        transport: kr(90_000),
        regnskap: kr(14_000),
        kontor: kr(15_000),
        annet: kr(15_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Hvordan regner jeg sesongen riktig?',
        svar:
          'Sett arbeidsuker til de ukene du faktisk kan produsere. Har du 34 uker med drift, er ' +
          'det 34 du skal skrive – ikke 46. Hele årets kostnader skal dekkes inn på de ukene, og ' +
          'det er nettopp derfor timeprisen blir høyere enn i fag som går jevnt.',
      },
      {
        sporsmal: 'Skal maskinleie faktureres i tillegg til timeprisen?',
        svar:
          'Eier du maskinen, er begge deler riktig – men ikke samtidig. Enten tar du en egen ' +
          'maskinpris per time, og holder maskinkostnaden utenfor kalkylen her. Eller så legger ' +
          'du maskinene inn som fast kostnad, og tar alt gjennom timeprisen. Blander du, dekker ' +
          'du maskinen to ganger eller ingen.',
      },
      {
        sporsmal: 'Hva med masser, planter og materialer?',
        svar:
          'De faktureres for seg, med påslag som dekker innkjøp, transport og svinn. Planter har ' +
          'dessuten en reell svinnprosent som bør være med i påslaget – det som ikke overlever ' +
          'første sesong, betaler du for hvis du ikke har regnet det inn.',
      },
    ],
  },

  {
    slug: 'renhold',
    navn: 'Renhold',
    ubestemt: 'et renholdsfirma',
    tittel: 'Hva skal et renholdsfirma ta i timen?',
    ingress:
      'Regn ut timeprisen du må ta på renhold når kjøring, utstyr, godkjenning og ubetalt tid ' +
      'skal dekkes. Gratis kalkulator.',
    kortsvar:
      'Renhold prises lavt i markedet, og det gjør det ekstra viktig å vite hvor gulvet ditt ' +
      'ligger. Et enkeltpersonforetak som vil ha 450 000 før skatt, har 90 000 i faste kostnader ' +
      'og fakturerer 70 % av timene sine, må ta rundt 420 kroner timen eks. mva. for å gå i ' +
      'null. Ligger du under det, betaler du for å jobbe – uansett hvor mange oppdrag du har.',
    kostnadstekst:
      'Kostnadsbildet er lavere enn i byggfagene, men ikke null: bil og kjøring mellom oppdrag ' +
      'er den største posten, og maskiner som kombimaskin eller tepperenser krever kapital. ' +
      'Godkjenning i Arbeidstilsynets renholdsregister og HMS-kort er faste poster. Kjemikalier ' +
      'og forbruksmateriell løper hele tiden.',
    tidstekst:
      'Renhold har ofte høyere fakturerbar andel enn byggfagene, fordi oppdragene er ' +
      'forutsigbare og gjentakende. 70–75 % er oppnåelig med faste kunder. Men kjøringen mellom ' +
      'små oppdrag spiser fort opp fordelen – har du mange korte oppdrag spredt geografisk, ' +
      'ligger du lavere enn du tror.',
    typisk: {
      fakturerbarAndel: 70,
      arbeidsuker: 46,
      timerPerUke: 40,
      fasteKostnader: {
        lokale: kr(24_000),
        forsikring: kr(10_000),
        verktoy: kr(20_000),
        transport: kr(55_000),
        regnskap: kr(12_000),
        kontor: kr(12_000),
        annet: kr(14_000),
      },
    },
    sporsmal: [
      {
        sporsmal: 'Kunden vil ha fastpris per måned – hvordan regner jeg det?',
        svar:
          'Finn timeprisen først, anslå hvor mange timer oppdraget faktisk tar i måneden, og ' +
          'gang. Mål tiden de første gangene i stedet for å gjette – de fleste bommer nedover, ' +
          'og en fastpris som er satt for lavt følger deg i årevis.',
      },
      {
        sporsmal: 'Skal kjøringen mellom oppdrag være fakturerbar?',
        svar:
          'Som regel ikke, mot privatkunder. Da må den trekkes fra den fakturerbare andelen. Har ' +
          'du fem korte oppdrag på en dag med kjøring imellom, kan den reelle andelen være nede ' +
          'i 55 % selv om du har jobbet full dag.',
      },
      {
        sporsmal: 'Hva med forbruksmateriell og kjemikalier?',
        svar:
          'Enten fakturerer du dem som et eget tillegg, eller så legger du dem inn som fast ' +
          'kostnad her. Det siste er vanligst på faste avtaler. Det som ikke fungerer, er å la ' +
          'dem være usynlige – da er de et fradrag fra lønnen din.',
      },
    ],
  },
]

export const finnBransjeprofil = (slug: string | undefined): Bransjeprofil | undefined =>
  BRANSJEPROFILER.find((b) => b.slug === slug)

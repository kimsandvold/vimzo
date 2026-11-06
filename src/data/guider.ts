/**
 * Fagartiklene. De gjør tre jobber samtidig: de svarer på det kundene faktisk
 * googler, de er beviset på at vi kan faget, og de er innholdet AI-assistenter
 * har noe å hente fra.
 *
 * Artiklene ligger som strukturert data, ikke som ferdig HTML. Da kan samme
 * tekst rendres som lesbar side, merkes opp som `Article` og `FAQPage`, og
 * hentes inn i sitemap-en uten at noe må vedlikeholdes to steder.
 *
 * Ny artikkel? Legg den til her. `scripts/generate-sitemap.mjs` leser denne
 * fila, så URL-en havner i sitemap og blir forhåndsrendret automatisk.
 */

export type Blokk =
  | { type: 'p'; tekst: string }
  | { type: 'liste'; punkter: readonly string[] }
  | { type: 'nummerert'; punkter: readonly string[] }
  | { type: 'faktaboks'; tittel: string; tekst: string }
  | { type: 'tabell'; kolonner: readonly string[]; rader: readonly (readonly string[])[] }

export interface Seksjon {
  overskrift: string
  innhold: readonly Blokk[]
}

export interface Guide {
  slug: string
  tittel: string
  /** Vises i lista og som meta-beskrivelse. Maks ~155 tegn. */
  ingress: string
  /** ISO-dato. Brukes i sitemap og i `datePublished`. */
  publisert: string
  oppdatert?: string
  /** Omtrentlig lesetid i minutter. */
  lesetid: number
  /** Merkelapp i lista. */
  kategori: 'Synlighet' | 'Pris' | 'Teknikk'
  /**
   * Svaret på artikkelens hovedspørsmål, i én avsnittslang bolk. Står øverst
   * på siden og merkes opp separat – det er denne en AI-assistent siterer.
   */
  kortsvar: string
  seksjoner: readonly Seksjon[]
}

export const guider: readonly Guide[] = [
  {
    slug: 'synlig-i-ai-sok',
    tittel: 'Slik blir bedriften din synlig når kundene spør ChatGPT',
    ingress:
      'Stadig flere starter søket i en AI-assistent i stedet for i Google. Her er hva som ' +
      'faktisk avgjør om bedriften din blir nevnt i svaret.',
    publisert: '2026-10-14',
    lesetid: 7,
    kategori: 'Synlighet',
    kortsvar:
      'AI-assistenter siterer sider som er lette å lese maskinelt og lette å stole på. I ' +
      'praksis betyr det fire ting: at innholdet finnes i HTML uten at JavaScript må kjøres, ' +
      'at fakta som pris, sted og tjenester står entydig i teksten, at sidene er merket opp ' +
      'med schema.org, og at bedriften omtales likt på tvers av nettsted, Google Business og ' +
      'bransjeregistre. En nettside som er bygget for dette, blir sitert. En som ikke er det, ' +
      'blir hoppet over – uansett hvor pen den er.',
    seksjoner: [
      {
        overskrift: 'Hva som faktisk har endret seg',
        innhold: [
          {
            type: 'p',
            tekst:
              'I et vanlig Google-søk er målet å bli klikket på. I et AI-søk er målet å bli ' +
              'sitert. Assistenten leser et knippe kilder, skriver ett svar, og nevner kanskje ' +
              'to–tre av dem. Er du ikke blant dem, finnes du ikke i den samtalen – og ' +
              'kunden ser aldri en liste med ti alternativer der du står på plass fire.',
          },
          {
            type: 'p',
            tekst:
              'Det skjerper kravene. Der Google kan gjette seg til hva en side handler om ut ' +
              'fra lenker og atferd over tid, må en AI-assistent klare det på ett gjennomlest ' +
              'dokument. Tvetydig innhold blir ikke rangert lavere – det blir utelatt.',
          },
        ],
      },
      {
        overskrift: '1. Innholdet må finnes i HTML-en',
        innhold: [
          {
            type: 'p',
            tekst:
              'De fleste indekseringsrobotene som henter innhold til AI-assistenter kjører ' +
              'ikke JavaScript, eller gjør det bare delvis. Er nettsiden din bygget slik at ' +
              'teksten settes inn av JavaScript etter at siden har lastet – det gjelder de ' +
              'fleste React-, Vue- og Angular-sider uten forhåndsrendring – ser roboten et ' +
              'tomt skall.',
          },
          {
            type: 'faktaboks',
            tittel: 'Test det selv på ett minutt',
            tekst:
              'Åpne nettsiden din, høyreklikk og velg «Vis kildekode» (ikke «Inspiser»). ' +
              'Finner du ikke brødteksten din i det vinduet, finner en AI-assistent den ' +
              'heller ikke.',
          },
          {
            type: 'p',
            tekst:
              'Løsningen er forhåndsrendring: siden bygges ferdig til HTML før den publiseres, ' +
              'slik at hver URL er en komplett fil. Det er den samme teknikken som gjør siden ' +
              'rask for mennesker, så du får to ting for én.',
          },
        ],
      },
      {
        overskrift: '2. Fakta må stå entydig',
        innhold: [
          {
            type: 'p',
            tekst:
              'En AI-assistent gjengir det den kan feste til et konkret utsagn. «Vi leverer ' +
              'skreddersydde helhetsløsninger til konkurransedyktige priser» er umulig å ' +
              'sitere. «En nettside koster fra 14 900 kroner eks. mva., og domenet står i ' +
              'ditt navn fra dag én» er lett.',
          },
          { type: 'p', tekst: 'Det som bør stå i klartekst et sted på nettstedet:' },
          {
            type: 'liste',
            punkter: [
              'Hva du selger, med ord kundene selv bruker',
              'Hva det koster, eller i det minste hva det starter på',
              'Hvor du holder til og hvilke områder du dekker',
              'Hvor lang tid leveransen tar',
              'Hvem som står bak, med navn',
              'Hvordan man får tak i deg',
            ],
          },
          {
            type: 'p',
            tekst:
              'Dette er også grunnen til at en spørsmål-og-svar-seksjon virker så godt. Den ' +
              'tvinger fram korte, selvstendige svar – akkurat formatet en assistent kan løfte ' +
              'rett inn i en samtale.',
          },
        ],
      },
      {
        overskrift: '3. Merk opp sidene med schema.org',
        innhold: [
          {
            type: 'p',
            tekst:
              'Strukturerte data er en maskinlesbar oppsummering av siden, lagt inn som et ' +
              'lite JSON-avsnitt i koden. Den forteller rett ut at dette er en bedrift, at ' +
              'dette er en tjeneste, at dette er et spørsmål med tilhørende svar. Både Google ' +
              'og AI-assistentene bruker det til å forstå siden uten å gjette.',
          },
          {
            type: 'p',
            tekst:
              'De typene som betyr mest for en norsk småbedrift er Organization eller ' +
              'LocalBusiness på forsiden, Service på hver tjenesteside, FAQPage der du har ' +
              'spørsmål og svar, og BreadcrumbList for å vise hvor siden hører hjemme. Er ' +
              'nettstedet bygget riktig, settes dette opp én gang og vedlikeholder seg selv.',
          },
        ],
      },
      {
        overskrift: '4. Legg ved en llms.txt',
        innhold: [
          {
            type: 'p',
            tekst:
              'llms.txt er en enkel tekstfil på rot-nivå – samme idé som robots.txt, men ' +
              'skrevet for språkmodeller. Den oppsummerer hva nettstedet handler om, hvem det ' +
              'er for, og hvilke sider som er de viktigste. Standarden er fortsatt ung og ' +
              'ingen garanterer at den leses, men den koster en halvtime å lage og gjør ingen ' +
              'skade.',
          },
          {
            type: 'p',
            tekst:
              'Nettstedet du leser nå har en: vimzo.no/llms.txt. Det er den korteste ' +
              'mulige beskrivelsen av hva vi gjør og hva det koster.',
          },
        ],
      },
      {
        overskrift: '5. Si det samme overalt',
        innhold: [
          {
            type: 'p',
            tekst:
              'Modeller vekter informasjon som bekreftes flere steder. Står firmanavnet ditt ' +
              'med punktum i Brønnøysund, uten på Facebook og i tredje variant på egen ' +
              'nettside, svekkes alle tre. Det samme gjelder adresse, telefonnummer og ' +
              'beskrivelsen av hva du driver med.',
          },
          {
            type: 'nummerert',
            punkter: [
              'Bestem én skrivemåte for navn, adresse og telefonnummer',
              'Rett den opp på nettstedet først',
              'Så i Google Business-profilen',
              'Så i Brønnøysundregistrene, Proff, 1881 og bransjeregistre',
              'Til slutt i sosiale medier',
            ],
          },
        ],
      },
      {
        overskrift: 'Hvordan måle om det virker',
        innhold: [
          {
            type: 'p',
            tekst:
              'Det finnes ingen Search Console for AI-svar ennå. Den praktiske metoden er å ' +
              'spørre. Still de fem–ti spørsmålene en kunde ville stilt – «hvem lager ' +
              'nettsider på Lillehammer», «hva koster X i Innlandet» – i ChatGPT, Claude, ' +
              'Perplexity og Google AI-oversikt, og noter hvem som nevnes. Gjenta hver måned. ' +
              'Det er grovt, men det er den eneste målingen som faktisk teller.',
          },
          {
            type: 'faktaboks',
            tittel: 'Kort oppsummert',
            tekst:
              'Lever innholdet som ferdig HTML, skriv fakta som kan siteres ordrett, merk opp ' +
              'sidene med schema.org, legg ved en llms.txt og omtal bedriften likt overalt. ' +
              'Det er ingen triks i dette – det er bare ryddig arbeid, gjort én gang.',
          },
        ],
      },
    ],
  },

  {
    slug: 'hva-koster-en-nettside',
    tittel: 'Hva koster en nettside for en liten bedrift i Norge?',
    ingress:
      'Fra null til et par hundre tusen. Her er hva som faktisk ligger bak prislappen, og ' +
      'hva en liten bedrift bør regne med å betale – både i oppstart og per år.',
    publisert: '2026-10-28',
    lesetid: 8,
    kategori: 'Pris',
    kortsvar:
      'En profesjonell nettside for en liten norsk bedrift koster typisk mellom 15 000 og ' +
      '60 000 kroner eks. mva., avhengig av antall sider og av om leverandøren også skriver ' +
      'innholdet. Løpende kostnader er normalt 1 500–6 000 kroner i året for en ' +
      'statisk side, og 6 000–20 000 kroner i året for en WordPress-side med lisenser og ' +
      'vedlikehold. Den største enkeltposten er nesten alltid innhold – tekst og bilder – ' +
      'ikke selve koden.',
    seksjoner: [
      {
        overskrift: 'Prisnivåene i det norske markedet',
        innhold: [
          {
            type: 'p',
            tekst:
              'Grovt sagt finnes det fire nivåer. De løser ulike problemer, og det dyreste er ' +
              'ikke automatisk riktig for en bedrift med fire ansatte.',
          },
          {
            type: 'tabell',
            kolonner: ['Nivå', 'Pris', 'Hva du får'],
            rader: [
              [
                'Gjør-det-selv',
                '0–3 000 kr/år',
                'Squarespace, Wix eller WordPress.com. Du gjør alt selv, inkludert tekst, bilder og SEO.',
              ],
              [
                'Mal og oppsett',
                '8 000–20 000 kr',
                'En frilanser setter opp et kjøpt tema og fyller inn innholdet ditt. Rask levering, lite tilpasning.',
              ],
              [
                'Håndkodet småbedriftsside',
                '15 000–60 000 kr',
                'Egen design, egne tekster, teknisk SEO og måling. Nivået de fleste SMB-er bør ligge på.',
              ],
              [
                'Byråprosjekt',
                '100 000 kr og oppover',
                'Strategi, visuell profil, flere involverte roller. Riktig når nettsiden er hovedkanalen for salget.',
              ],
            ],
          },
        ],
      },
      {
        overskrift: 'Hva prisen faktisk består av',
        innhold: [
          {
            type: 'p',
            tekst:
              'Det er lett å tro at man betaler for kode. I de fleste småbedriftsprosjekter går ' +
              'under halvparten av timene til programmering. Resten er dette:',
          },
          {
            type: 'liste',
            punkter: [
              'Innhold: intervju, tekstarbeid og korrektur – ofte 30–40 % av prosjektet',
              'Design: å finne et uttrykk som passer bedriften, ikke bare en mal',
              'Bilder: fotografering, beskjæring og optimalisering',
              'Teknisk SEO: struktur, strukturerte data, sitemap, Search Console',
              'Testing: mobil, skjermleser, lastetid, skjemaer som faktisk kommer fram',
              'Lansering: domene, sertifikat, omdirigeringer fra den gamle siden',
            ],
          },
          {
            type: 'p',
            tekst:
              'Når et tilbud er påfallende billig, er det som regel én av disse postene som er ' +
              'tatt bort – og nesten alltid innhold eller testing.',
          },
        ],
      },
      {
        overskrift: 'Den løpende kostnaden er den som overrasker',
        innhold: [
          {
            type: 'p',
            tekst:
              'Mange sammenligner tilbud på oppstartspris alene og oppdager årskostnaden ' +
              'etterpå. Forskjellen mellom en statisk side og en WordPress-side er særlig stor ' +
              'her, fordi den ene har et system som må holdes i live og den andre ikke har det.',
          },
          {
            type: 'tabell',
            kolonner: ['Post', 'Statisk side', 'WordPress'],
            rader: [
              ['Domene', '100–200 kr/år', '100–200 kr/år'],
              ['Hosting', '0–1 200 kr/år', '1 200–4 000 kr/år'],
              ['Lisenser og plugins', '0 kr', '2 000–8 000 kr/år'],
              ['Oppdateringer og sikkerhet', 'Inngår eller 0 kr', '3 000–10 000 kr/år'],
              ['Typisk sum', '1 500–6 000 kr/år', '6 000–20 000 kr/år'],
            ],
          },
          {
            type: 'faktaboks',
            tittel: 'Regn på fem år',
            tekst:
              'En side til 25 000 kroner med 2 000 kroner i årlig drift koster 35 000 kroner ' +
              'over fem år. En side til 18 000 kroner med 14 000 kroner i årlig drift koster ' +
              '88 000. Oppstartsprisen er sjelden der pengene ligger.',
          },
        ],
      },
      {
        overskrift: 'Hva bør du spørre leverandøren om?',
        innhold: [
          {
            type: 'nummerert',
            punkter: [
              'Er prisen fast, eller et anslag som kan vokse?',
              'Hvem skriver tekstene – og er det med i prisen?',
              'Hva koster det å endre noe om seks måneder?',
              'Hva er den totale årlige kostnaden etter lansering?',
              'Eier jeg koden og domenet, og kan jeg flytte alt til en annen?',
              'Hvilke tall måler dere før lansering, og får jeg se dem?',
            ],
          },
          {
            type: 'p',
            tekst:
              'Spørsmål fem er det viktigste. Står domenet i leverandørens navn, eller ligger ' +
              'siden i et system bare de har tilgang til, har du ikke kjøpt en nettside – du ' +
              'har leid en.',
          },
        ],
      },
      {
        overskrift: 'Hva vi tar',
        innhold: [
          {
            type: 'p',
            tekst:
              'Vi legger prisene åpent ut fordi det sparer begge parter for tid: fra 14 900 ' +
              'kroner for opptil tre sider, og 29 900 kroner for en bedriftsside med opptil ' +
              'åtte sider. Drift koster 449 kroner i måneden. Småendringer inngår; større ' +
              'endringer har fast pris, og timepris på 1 150 kroner bruker vi bare når ' +
              'ingenting annet passer. Alt eks. mva.',
          },
          {
            type: 'p',
            tekst:
              'Du får fast pris skriftlig før vi begynner, og den står selv om arbeidet tar ' +
              'lengre tid enn vi trodde.',
          },
        ],
      },
    ],
  },

  {
    slug: 'wordpress-eller-handkodet',
    tittel: 'WordPress eller håndkodet nettside – hva passer en liten bedrift?',
    ingress:
      'WordPress driver rundt 40 % av verdens nettsteder. Det betyr ikke at det er riktig ' +
      'for en bedrift med fem ansatte og ti sider.',
    publisert: '2026-11-04',
    lesetid: 6,
    kategori: 'Teknikk',
    kortsvar:
      'WordPress passer når innholdet endres ofte av flere personer, og når du trenger ' +
      'funksjonalitet som allerede finnes ferdig – nettbutikk, medlemssider, booking. En ' +
      'håndkodet, statisk side passer når nettstedet har ti til tretti sider som endres ' +
      'noen ganger i året, og når fart, sikkerhet og lav årlig kostnad betyr mer enn å kunne ' +
      'redigere selv. For de fleste norske småbedrifter er det siste tilfellet.',
    seksjoner: [
      {
        overskrift: 'Forskjellen i én setning',
        innhold: [
          {
            type: 'p',
            tekst:
              'WordPress setter sammen siden på nytt for hver eneste besøkende, i en database ' +
              'og et PHP-program som må holdes oppdatert. En statisk side er bygget ferdig én ' +
              'gang og ligger som vanlige filer på et nett av servere rundt i verden. Alt annet ' +
              'følger av dette.',
          },
          {
            type: 'tabell',
            kolonner: ['', 'WordPress', 'Håndkodet og statisk'],
            rader: [
              ['Lastetid', 'Avhenger av tema og plugins', 'Typisk under 1 sekund'],
              ['Redigere selv', 'Ja, innebygd', 'Nei – leverandøren gjør endringen'],
              ['Angrepsflate', 'Database, PHP, plugins, innlogging', 'Ingen – det er bare filer'],
              ['Vedlikehold', 'Løpende oppdateringer', 'Ingenting som ruster'],
              ['Årlig kostnad', '6 000–20 000 kr', '1 500–6 000 kr'],
              ['Ferdig funksjonalitet', 'Enormt utvalg', 'Må bygges eller kobles på'],
            ],
          },
        ],
      },
      {
        overskrift: 'Når WordPress er riktig valg',
        innhold: [
          {
            type: 'liste',
            punkter: [
              'Flere personer skal publisere innhold hver uke',
              'Du driver nettbutikk med hundrevis av varer',
              'Du trenger medlemsinnlogging, kurs eller bookingsystem',
              'Du har noen internt som faktisk kan og vil vedlikeholde systemet',
            ],
          },
          {
            type: 'p',
            tekst:
              'Da er det dumt å bygge alt fra bunnen. Økosystemet er WordPress sin virkelige ' +
              'styrke, og det er en reell styrke.',
          },
        ],
      },
      {
        overskrift: 'Når det ikke er det',
        innhold: [
          {
            type: 'p',
            tekst:
              'Den typiske norske småbedriftssiden har en forside, noen tjenestesider, en ' +
              'om-side og en kontaktside. Den endres kanskje fire ganger i året. For den siden ' +
              'betaler du for et helt publiseringssystem du nesten ikke bruker – og du arver ' +
              'alle ulempene: oppdateringer, lisenser, sikkerhetshull og en side som blir ' +
              'tregere for hver plugin noen la til i et øyeblikks godt humør.',
          },
          {
            type: 'faktaboks',
            tittel: 'Argumentet om å redigere selv',
            tekst:
              'Det brukes oftere enn det benyttes. Og det er ikke bare et spørsmål om tid: å ' +
              'skrive innhold som både leser godt og rangerer er et fag, og sider som eieren ' +
              'skal fylle selv mellom alt annet, forfaller nesten alltid. Vår erfaring er at ' +
              'det blir både billigere og bedre å betale for timene som faktisk brukes, når de ' +
              'brukes.',
          },
        ],
      },
      {
        overskrift: 'Hva med SEO?',
        innhold: [
          {
            type: 'p',
            tekst:
              'Her er myten seiglivet: at WordPress er «bra for SEO» på grunn av Yoast eller ' +
              'Rank Math. Disse er verktøy for å fylle inn titler og beskrivelser – de gjør ' +
              'ikke noe du ikke kan gjøre direkte i koden, og de retter ikke opp det som ' +
              'faktisk teller mest, nemlig fart og innholdskvalitet.',
          },
          {
            type: 'p',
            tekst:
              'På to punkter har en statisk side en reell fordel. Core Web Vitals – Googles ' +
              'målinger av hvor raskt og stabilt siden laster – er enklere å få grønne når ' +
              'siden allerede er ferdig bygget. Og indekseringsrobotene som henter innhold til ' +
              'AI-assistenter leser rå HTML, som en statisk side per definisjon leverer.',
          },
        ],
      },
      {
        overskrift: 'Hvordan velge',
        innhold: [
          {
            type: 'nummerert',
            punkter: [
              'Tell hvor mange ganger du endret nettsiden i fjor. Under ti? Du trenger ikke et CMS.',
              'Spør hvem som faktisk skal skrive. Har du ingen som gjør det, hjelper ikke verktøyet.',
              'Regn på fem år, ikke på oppstartsprisen.',
              'Sjekk om du eier koden og domenet uansett hvilken vei du går.',
            ],
          },
          {
            type: 'p',
            tekst:
              'Lander du på at du trenger WordPress, er det et godt svar. Lander du på at du ' +
              'har ti sider som skal være raske, trygge og billige i drift – da er det vi ' +
              'bygger.',
          },
        ],
      },
    ],
  },
] as const

export function guideFor(slug: string): Guide | undefined {
  return guider.find((g) => g.slug === slug)
}

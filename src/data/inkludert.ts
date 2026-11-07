/**
 * Arbeidsfordelingen – sidens viktigste budskap.
 *
 * Målgruppen er bedriftseiere som vet at de trenger en nettside, men som
 * hverken har tid eller lyst til å lage den. Da er ikke teknologien
 * salgsargumentet. Det er at de slipper.
 *
 * Derfor står lista over hva VI gjør lang og lista over hva DU gjør kort –
 * og på forsiden er det selve forskjellen i lengde som bærer budskapet.
 * Holder lista her ærlig, så holder løftet på siden det også.
 */

export const viGjor = [
  'Kjøper domenet og setter det opp i ditt navn',
  'Finner ut hvilke sider du faktisk trenger',
  'Skriver alle tekstene, på norsk',
  'Tar bildene – også med drone om det passer',
  'Designer og koder hele siden – for mobil like mye som PC',
  'Melder deg inn hos Google og Google Maps',
  'Setter opp e-post på ditt eget domene',
  'Publiserer, drifter og passer på at alt virker',
] as const

export const duGjor = [
  'Prater med oss i én time om hva bedriften gjør',
  'Leser gjennom og sier ja når du er fornøyd',
] as const

/**
 * Tryggheten, i fire punkter. Står rett under helten, fordi det er her
 * tvilen sitter: «hva om det blir dyrt, hva om jeg blir sittende fast, hva
 * om de forsvinner».
 */
export interface Trygghet {
  tittel: string
  tekst: string
}

export const trygghet: readonly Trygghet[] = [
  {
    tittel: 'Fast pris, avtalt før vi begynner',
    tekst:
      'Ingen timer som løper mens vi bygger. Tar jobben lengre tid enn vi trodde, er det vårt ' +
      'problem.',
  },
  {
    tittel: 'Du eier alt fra dag én',
    tekst: 'Domenet står i ditt navn, og du får hele siden med deg hvis du vil bytte leverandør.',
  },
  {
    tittel: '100 % norsk – og alt på norsk',
    tekst: 'Du snakker med den som faktisk lager siden, på norsk. Ingenting settes ut til utlandet.',
  },
  {
    tittel: 'Ingen bindingstid',
    tekst: 'Driftsavtalen kan sies opp når som helst. Siden er din uansett.',
  },
]

/**
 * De vanligste innvendingene, formulert som det de er: ting folk sier høyt
 * i første samtale. Brukes i «Dette slipper du å tenke på»-seksjonen.
 */
export interface Innvending {
  sagt: string
  svar: string
}

export const innvendinger: readonly Innvending[] = [
  {
    sagt: '«Jeg vet ikke hva som skal stå på den.»',
    svar:
      'Det er vår jobb. Vi stiller spørsmålene, du svarer på norsk som du snakker, og vi gjør det ' +
      'om til ferdige sider. Du leser gjennom til slutt.',
  },
  {
    sagt: '«Jeg har ikke bilder.»',
    svar:
      'Da kommer vi og tar dem. Lokalene, produktene, folkene – og fra lufta med drone hvis det ' +
      'kler bedriften. Du eier bildene etterpå.',
  },
  {
    sagt: '«Jeg aner ikke hvordan domene og e-post fungerer.»',
    svar:
      'Du trenger ikke vite det. Vi kjøper domenet, registrerer det i ditt navn, setter opp ' +
      'e-post og kobler alt sammen. Du får brukernavn og passord når det står ferdig.',
  },
  {
    sagt: '«Jeg har ikke tid til å følge opp et prosjekt.»',
    svar:
      'Du bruker omtrent to timer til sammen: én samtale i starten og én gjennomlesing til ' +
      'slutt. Resten gjør vi, og vi maser ikke.',
  },
  {
    sagt: '«Hva om det blir dyrere enn avtalt?»',
    svar:
      'Det blir det ikke. Du får prisen skriftlig før vi begynner, og den står. Vil du ha noe i ' +
      'tillegg underveis, sier vi hva det koster før vi gjør det.',
  },
  {
    sagt: '«Hva skjer hvis jeg vil bytte senere?»',
    svar:
      'Da tar du med deg alt. Domenet er ditt, innholdet er ditt, og koden får du utlevert. Vi ' +
      'holder ingenting igjen som gjør det vanskelig å gå.',
  },
]

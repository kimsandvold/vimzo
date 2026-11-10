/**
 * Fotomalene – manifestet logoen legges på.
 *
 * Rendereren (Fotomockup.tsx) er drevet helt av disse dataene, så en ny mal
 * er en ny oppføring her og filer i public/images/logomockup/ – ingen kode.
 * Formatet, for den som genererer oppføringer (f.eks. fra PSD-er):
 *
 *   id            unik, kort, a–z og bindestrek
 *   navn          bildetekst, norsk («Kaffekopp»)
 *   base          URL til bakgrunnsfotoet (webp)
 *   bredde/hoyde  basefotoets størrelse i piksler
 *   quad          fire hjørner for flaten logoen skal på, i basefotoets
 *                 piksler: [øvre venstre, øvre høyre, nedre høyre, nedre venstre]
 *   flate         flatens virkelige sideforhold { bredde, hoyde } – f.eks. en
 *                 bilside 2.1 : 1 – så logoen ikke strekkes før perspektivet
 *   maske?        polygon i basefotoets piksler [[x, y], …] eller URL til en
 *                 PNG-maske (hvit = trykkbart). Logoen klippes til den.
 *   skygge?       URL til et gråtonekart av flaten (hvitt = ingen skygge).
 *                 Legges over logoen med `multiply`, så bretter og krumning
 *                 mørkner trykket. Uten kart bærer `multiply` på selve logoen
 *                 skyggene fra fotoet videre.
 *   lys?          URL til et høylyskart (svart = ingen refleks). Legges over
 *                 med `screen`, så glans og refleks går over trykket. Uten
 *                 kart lages et av basefotoet.
 *   materiale     papir | stoff | glass | lakk | keramikk | folie – styrer
 *                 blanding, dekning og mykhet (MATERIALER i Fotomockup.tsx)
 *   variant       'auto' velger lys eller mørk logo etter hvor lys flaten er;
 *                 ellers positiv | negativ | svart | hvit
 *   oppsett?      anbefalt lås: side | over | kun-merke
 *   luft?         hvor mye av flaten logoen kan fylle, [bredde, høyde], 0–1
 *   lyshet?       flatens lyshet 0–1, brukt av variant 'auto' (standard 0.85)
 *   boying?       hvordan trykket følger en buet flate (kun på skjermen):
 *                 { type: 'sylinder', aksen, topp: [y, r], bunn: [y, r], ellipse }
 *                 – en kopp: aksen er midtlinjen i x, radiene måles på
 *                 fotoet, `ellipse` er forholdet b/a for ringene vi ser
 *                 ovenfra. Quad-en tolkes da som den utbrettede flaten.
 *                 { type: 'foto', styrke } – stoff: forskyvningskart laget av
 *                 fotoets egne lysforskjeller, så trykket følger folder.
 *   utsnitt?      [x, y, b, h] – delen av fotoet som vises når bildet må
 *                 beskjæres (profilarket). Uten det sentreres beskjæringen.
 *
 * Bildene som ligger her nå, er generert med KI som en mellomløsning og byttes
 * mot et kjøpt pakkesett. Se README i bildemappen for kilde og lisens.
 */
export interface Fotomal {
  id: string
  navn: string
  base: string
  bredde: number
  hoyde: number
  quad: [[number, number], [number, number], [number, number], [number, number]]
  flate: { bredde: number; hoyde: number }
  maske?: [number, number][] | string
  skygge?: string
  lys?: string
  materiale: Materiale
  variant: 'auto' | 'positiv' | 'negativ' | 'svart' | 'hvit'
  oppsett?: 'side' | 'over' | 'kun-merke'
  luft?: [number, number]
  lyshet?: number
  boying?:
    | { type: 'sylinder'; aksen: number; topp: [number, number]; bunn: [number, number]; ellipse: [number, number] }
    | { type: 'foto'; styrke: number }
  utsnitt?: [number, number, number, number]
}

export type Materiale = 'papir' | 'stoff' | 'glass' | 'lakk' | 'keramikk' | 'folie' | 'akryl'

const KI = { bredde: 971, hoyde: 577 }

/**
 * Rekkefølgen er en liten fortelling: kortet du gir fra deg, vinduet
 * kundene ser, koppen over disken, nettet de bærer hjem, arbeidstøyet.
 * Det første bildet vises stort.
 */
export const FOTOMALER: readonly Fotomal[] = [
  {
    // Brukerens eget bilde. Lysskilt med mørk lakkert front: logoen er
    // utfrest, bakbelyst akryl – hvit, skarp og med en liten glød.
    id: 'skilt',
    navn: 'Slik møter kundene deg',
    base: '/images/logomockup/skilt.webp',
    bredde: 1536,
    hoyde: 1024,
    quad: [
      [641, 148],
      [1070, 208],
      [1073, 649],
      [641, 624],
    ],
    flate: { bredde: 1, hoyde: 1 },
    materiale: 'akryl',
    variant: 'hvit',
    lyshet: 0.15,
    oppsett: 'over',
    luft: [0.68, 0.62],
  },
  {
    id: 'kort',
    navn: 'Når du gir visittkortet',
    base: '/images/logomockup/kort.webp',
    bredde: 1200,
    hoyde: 1050,
    quad: [
      [513, 212],
      [976, 635],
      [667, 955],
      [204, 532],
    ],
    flate: { bredde: 1.41, hoyde: 1 },
    materiale: 'papir',
    variant: 'auto',
    oppsett: 'over',
    luft: [0.62, 0.62],
  },
  {
    id: 'vindu',
    navn: 'I vinduet',
    base: '/images/logomockup/vindu.webp',
    ...KI,
    quad: [
      [362, 150],
      [628, 150],
      [628, 300],
      [362, 300],
    ],
    flate: { bredde: 1.77, hoyde: 1 },
    materiale: 'glass',
    variant: 'hvit',
    oppsett: 'over',
    luft: [0.86, 0.78],
  },
  {
    id: 'kopp',
    navn: 'Over disken',
    base: '/images/logomockup/kopp.webp',
    ...KI,
    quad: [
      [268, 290],
      [496, 290],
      [480, 392],
      [284, 392],
    ],
    flate: { bredde: 2, hoyde: 1 },
    maske: [
      [236, 262],
      [530, 262],
      [498, 470],
      [262, 470],
    ],
    materiale: 'keramikk',
    variant: 'auto',
    oppsett: 'over',
    luft: [0.66, 0.8],
    // Målt på fotoet: midtlinjen i x = 380, radius 167 ved y 300 og 128 ved
    // y 450. Ringene ses litt ovenfra – flatere oppe, rundere nede.
    boying: { type: 'sylinder', aksen: 380, topp: [300, 167], bunn: [450, 128], ellipse: [0.09, 0.15] },
    utsnitt: [150, 150, 470, 380],
  },
  {
    id: 'veske',
    navn: 'Med kunden hjem',
    base: '/images/logomockup/veske.webp',
    bredde: 1200,
    hoyde: 800,
    quad: [
      [480, 352],
      [750, 352],
      [750, 525],
      [480, 525],
    ],
    flate: { bredde: 1.56, hoyde: 1 },
    maske: [
      [405, 244],
      [829, 244],
      [832, 735],
      [401, 739],
    ],
    materiale: 'stoff',
    variant: 'auto',
    oppsett: 'over',
    luft: [0.86, 0.86],
    boying: { type: 'foto', styrke: 4 },
  },
  {
    id: 'tskjorte',
    navn: 'På jobb',
    base: '/images/logomockup/tskjorte.webp',
    ...KI,
    // Venstre bryst (høyre i bildet), lite – slik arbeidstøy faktisk trykkes.
    quad: [
      [530, 150],
      [618, 150],
      [618, 196],
      [530, 196],
    ],
    flate: { bredde: 1.9, hoyde: 1 },
    materiale: 'stoff',
    variant: 'auto',
    oppsett: 'side',
    luft: [0.96, 0.9],
    boying: { type: 'foto', styrke: 3 },
    // Brystet, ikke hele skjorta – ellers blir trykket et frimerke.
    utsnitt: [400, 60, 330, 230],
  },
]

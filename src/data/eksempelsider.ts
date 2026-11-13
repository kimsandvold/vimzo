/**
 * Eksempelsidene i prisruten på forsiden – én per bransje.
 *
 * Navnene er oppdiktede og står merket «Eksempel» der de vises. Ingen av dem
 * er kunder, og de skal aldri brukes som om de var det.
 */

export interface Oppsett {
  navn: string
  tittel: string
  knapp: string
  farge: string
  kort: [string, string, string]
}

export const EKSEMPLER: Record<string, Oppsett> = {
  rorlegger: { navn: 'Hansen Rør', tittel: 'Lekker det? Vi kommer samme dag.', knapp: 'Få tilbud', farge: '#0B5394', kort: ['Bad', 'Varmepumpe', 'Akutt'] },
  snekker: { navn: 'Berg Bygg', tittel: 'Terrasse, tilbygg og oppussing.', knapp: 'Få et pristilbud', farge: '#7A4E2D', kort: ['Terrasse', 'Tilbygg', 'Kjøkken'] },
  elektriker: { navn: 'Lys & Kraft', tittel: 'Godkjent elektriker – fast pris.', knapp: 'Bestill elektriker', farge: '#B45309', kort: ['Elbillader', 'Sikringsskap', 'Belysning'] },
  maler: { navn: 'Malermester Dahl', tittel: 'Vi maler huset ditt – inne og ute.', knapp: 'Gratis befaring', farge: '#2E7D6B', kort: ['Fasade', 'Interiør', 'Tapet'] },
  murer: { navn: 'Nilsen Mur', tittel: 'Mur, flis og pipe – gjort riktig.', knapp: 'Få tilbud', farge: '#8B3A2B', kort: ['Flislegging', 'Pipe', 'Grunnmur'] },
  anlegg: { navn: 'Grønt Hageservice', tittel: 'Hager og uteområder som varer.', knapp: 'Bestill befaring', farge: '#3B7D2E', kort: ['Belegg', 'Plen', 'Murer'] },
  bilverksted: { navn: 'Bakken Bil', tittel: 'EU-kontroll og service på dagen.', knapp: 'Bestill time', farge: '#9F1239', kort: ['EU-kontroll', 'Service', 'Dekk'] },
  renhold: { navn: 'Rent & Pent', tittel: 'Rent kontor, hver eneste uke.', knapp: 'Få pris', farge: '#0E7490', kort: ['Kontor', 'Bolig', 'Flyttevask'] },
  transport: { navn: 'Flytt & Bær', tittel: 'Flytting uten stress – fast pris.', knapp: 'Regn ut prisen', farge: '#1D4ED8', kort: ['Flytting', 'Pianoflytting', 'Lager'] },
  frisor: { navn: 'Salong Lind', tittel: 'Klipp, farge og styling.', knapp: 'Bestill time', farge: '#9D4E6B', kort: ['Dame', 'Herre', 'Farge'] },
  fotpleie: { navn: 'Fotklinikken', tittel: 'Fotpleie og hudpleie med omsorg.', knapp: 'Bestill time', farge: '#7C5CA6', kort: ['Fotpleie', 'Ansikt', 'Gavekort'] },
  trening: { navn: 'Kraft Trening', tittel: 'Personlig trening som virker.', knapp: 'Book første time', farge: '#0F766E', kort: ['PT', 'Grupper', 'Kosthold'] },
  servering: { navn: 'Kafé Torget', tittel: 'Lunsj, middag og selskap.', knapp: 'Bestill bord', farge: '#9A3412', kort: ['Meny', 'Selskap', 'Catering'] },
  annet: { navn: 'Din Bedrift', tittel: 'Det du gjør – sagt enkelt.', knapp: 'Ta kontakt', farge: '#005CC8', kort: ['Tjenester', 'Priser', 'Om oss'] },
}

/** Navnet siden får i eksemplet når kunden ikke har skrevet sitt eget. */
export const eksempelnavn = (bransje: string) => (EKSEMPLER[bransje] ?? EKSEMPLER.annet).navn


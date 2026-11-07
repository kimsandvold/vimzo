/**
 * Merkene i logoverktøyet.
 *
 * Alle er tegnet i samme 24×24-rutenett med fyll (ikke strek), fordi et
 * fylt merke holder seg lesbart helt ned til favikon-størrelse. De er
 * bevisst geometriske og nøytrale: et verktøy som lager logoer til både
 * rørleggere og frisører kan ikke ha motiver som låser bransjen.
 */
export interface Merke {
  id: string
  navn: string
  /** Én eller flere baner. `evenodd` der formen har hull. */
  baner: readonly string[]
  evenodd?: boolean
}

export const MERKER: readonly Merke[] = [
  {
    id: 'lyn',
    navn: 'Lyn',
    baner: ['M13.4 2 5.1 13.6h5.2L9.3 22l8.6-11.9h-5.3z'],
  },
  {
    id: 'hus',
    navn: 'Hus',
    baner: ['M12 2.4 2.6 10.3v9.9c0 .8.6 1.4 1.4 1.4h4.8v-6.1h6.4v6.1H20c.8 0 1.4-.6 1.4-1.4v-9.9z'],
  },
  {
    id: 'drape',
    navn: 'Dråpe',
    baner: ['M12 2.3c4.3 5.1 7.1 8.6 7.1 11.8a7.1 7.1 0 1 1-14.2 0c0-3.2 2.8-6.7 7.1-11.8z'],
  },
  {
    id: 'ring',
    navn: 'Ring',
    baner: ['M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8zm0 4.9a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z'],
    evenodd: true,
  },
  {
    id: 'rute',
    navn: 'Rute',
    baner: ['M12 1.8 22.2 12 12 22.2 1.8 12z'],
  },
  {
    id: 'linjer',
    navn: 'Linjer',
    baner: [
      'M3.4 5.4h12.1a1.7 1.7 0 0 1 0 3.4H3.4a1.7 1.7 0 0 1 0-3.4z',
      'M3.4 10.3h17.2a1.7 1.7 0 0 1 0 3.4H3.4a1.7 1.7 0 0 1 0-3.4z',
      'M3.4 15.2h8.6a1.7 1.7 0 0 1 0 3.4H3.4a1.7 1.7 0 0 1 0-3.4z',
    ],
  },
  {
    id: 'vinkel',
    navn: 'Vinkel',
    baner: ['M2.4 12 12 2.4l3 3L8.4 12l6.6 6.6-3 3z', 'M12.6 12 19.2 5.4l3 3L18.6 12l3.6 3.6-3 3z'],
  },
  {
    id: 'sekskant',
    navn: 'Sekskant',
    baner: ['M12 2.2 21 7.3v9.4L12 21.8 3 16.7V7.3z'],
  },
] as const

export interface Farge {
  id: string
  navn: string
  hex: string
}

/** Palett. Alle farger har nok kontrast til hvit tekst på seg. */
export const PALETT: readonly Farge[] = [
  { id: 'furu', navn: 'Furu', hex: '#1F6A4C' },
  { id: 'oliven', navn: 'Oliven', hex: '#5A6B2F' },
  { id: 'teal', navn: 'Teal', hex: '#13635E' },
  { id: 'dyphav', navn: 'Dyphav', hex: '#1C4F6B' },
  { id: 'skifer', navn: 'Skifer', hex: '#3F5A6B' },
  { id: 'plomme', navn: 'Plomme', hex: '#6B3A6E' },
  { id: 'vinrod', navn: 'Vinrød', hex: '#8A2B42' },
  { id: 'terrakotta', navn: 'Terrakotta', hex: '#A8452B' },
  { id: 'rust', navn: 'Rust', hex: '#8C3A1E' },
  { id: 'honning', navn: 'Honning', hex: '#9A5B18' },
  { id: 'oker', navn: 'Oker', hex: '#B07A14' },
  { id: 'kull', navn: 'Kull', hex: '#1C1813' },
] as const

export type Oppsett = 'side' | 'over' | 'kun-merke'
export type Form = 'flis' | 'rent'

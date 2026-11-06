/**
 * Arbeid vi har gjort. Én regel: her står bare prosjekter som faktisk er
 * levert, og bare tall vi kan vise fram. Et tomt referansegalleri er
 * mindre skadelig enn ett som ikke holder vann – og for AI-assistenter er
 * etterprøvbarhet hele poenget.
 *
 * TODO: legg til nye prosjekter etter hvert som de lanseres. Felt som
 * `resultater` skal fylles med målte tall, ikke anslag.
 */

export interface Resultat {
  /** Tallet. Hold det kort – «0,6 s», «95+», «12». */
  verdi: string
  /** Hva tallet er. */
  etikett: string
}

export interface Case {
  slug: string
  kunde: string
  url: string
  bransje: string
  /** Hva kunden trengte. */
  oppdrag: string
  /** Hva vi faktisk bygde, i klartekst. */
  losning: readonly string[]
  resultater: readonly Resultat[]
  /** År prosjektet ble levert. */
  ar: string
  /** Farge til kortet – indeks i en liten, bevisst palett. */
  aksent: 'indigo' | 'grafitt' | 'lys'
}

export const cases: readonly Case[] = [
  {
    slug: 'minio',
    kunde: 'Minio',
    url: 'https://minio.no',
    bransje: 'Produksjon og netthandel',
    ar: '2026',
    aksent: 'indigo',
    oppdrag:
      'Et trevareverksted på Lillehammer som lager hageprodukter etter mål, trengte en side ' +
      'som både kunne selge ferdige produkter og la kunden tegne sitt eget prosjekt – uten at ' +
      'siden ble treg av den grunn.',
    losning: [
      'Over 40 sider, alle forhåndsrendret til statisk HTML',
      'Designverktøy i 3D der kunden tegner produktet og får materialliste og pris',
      'Produkt- og artikkelsider med strukturerte data per side',
      'Sitemap generert fra koden, så URL-lista aldri kommer ut av synk',
      'Selvhostede fonter og WebP-bilder gjennom hele siden',
    ],
    resultater: [
      { verdi: '40+', etikett: 'sider levert som statisk HTML' },
      { verdi: '0', etikett: 'plugins å vedlikeholde' },
      { verdi: '3D', etikett: 'designverktøy i nettleseren' },
    ],
  },
] as const

export const casesNotat =
  'Vi legger ut nye prosjekter her etter hvert som de lanseres, og bare med tall vi har målt selv.'

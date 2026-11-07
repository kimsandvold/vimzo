import { firma } from '../data/firma'
import { prisFor, type Tjeneste } from '../data/tjenester'
import type { Sporsmal } from '../data/faq'
import type { Guide } from '../data/guider'
import { pakker } from '../data/pakker'

const URL_BASE = firma.url

/**
 * Strukturerte data, bygget ett sted.
 *
 * Dette er sidens maskinlesbare lag: det Google bruker til å forstå hva en
 * side er, og det AI-assistenter bruker til å slippe å gjette. Hver funksjon
 * her returnerer et JSON-LD-objekt som `useSEO` skriver inn i <head>, og som
 * dermed havner i den forhåndsrendrede HTML-en.
 *
 * Regelen: vi erklærer bare ting som faktisk står i teksten på siden.
 * Strukturerte data som lover noe innholdet ikke holder, er det raskeste
 * stedet å miste tillit – hos Google og hos modellene.
 */

/** Felles `@id` slik at alle sider peker på den samme virksomheten. */
export const ORG_ID = `${URL_BASE}/#organisasjon`
const NETTSTED_ID = `${URL_BASE}/#nettsted`

export function organisasjon(): Record<string, unknown> {
  const adresse: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: firma.poststed,
    addressCountry: 'NO',
  }

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: firma.merke,
    url: `${URL_BASE}/`,
    logo: `${URL_BASE}/favicon.svg`,
    image: `${URL_BASE}/images/og/vimzo.png`,
    description:
      'Vimzo lager håndkodede, forhåndsrendrede nettsider i HTML, CSS og JavaScript for små ' +
      'og mellomstore bedrifter i Norge. Sidene er optimalisert for søkemotorer og for å bli ' +
      'sitert av AI-assistenter, og er billige i drift.',
    address: adresse,
    areaServed: firma.dekningsomrade.map((omrade) => ({ '@type': 'AdministrativeArea', name: omrade })),
    knowsAbout: [...firma.fagomrader],
    founder: {
      '@type': 'Person',
      name: firma.grunnlegger,
      jobTitle: firma.grunnleggerTittel,
    },
    priceRange: `NOK ${pakker[0].pris.fra}–${pakker[1].pris.til ?? pakker[1].pris.fra}`,
    currenciesAccepted: 'NOK',
  }

  if (firma.juridiskNavn) ld.legalName = firma.juridiskNavn
  if (firma.orgNr) ld.taxID = firma.orgNr.replace(/\s/g, '')

  // Typiske prosjekter som en katalog med prisspenn – det enkleste
  // maskinlesbare svaret på «hva koster en nettside hos dere». Spenn, ikke
  // én pris, fordi det er det siden selv sier: endelig pris etter en prat.
  ld.hasOfferCatalog = {
    '@type': 'OfferCatalog',
    name: 'Typiske nettsideprosjekter',
    itemListElement: pakker.map((p) => ({
      '@type': 'Offer',
      name: `${firma.merke} ${p.navn}`,
      description: `${p.for} ${p.omfang}. Endelig pris avtales etter en samtale.`,
      priceCurrency: 'NOK',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'NOK',
        valueAddedTaxIncluded: false,
        minPrice: p.pris.fra,
        ...(p.pris.til !== null ? { maxPrice: p.pris.til } : {}),
      },
      url: `${URL_BASE}/priser#${p.id}`,
    })),
  }

  return ld
}

export function nettsted(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': NETTSTED_ID,
    url: `${URL_BASE}/`,
    name: firma.merke,
    inLanguage: 'nb-NO',
    publisher: { '@id': ORG_ID },
  }
}

export function tjenesteLd(t: Tjeneste): Record<string, unknown> {
  // Tilleggene har egen pris; det som inngår, selges bare gjennom pakkene.
  const priser = prisFor(t).map((p) => ({
    '@type': 'Offer',
    name: p.navn,
    priceCurrency: 'NOK',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      priceCurrency: 'NOK',
      valueAddedTaxIncluded: false,
      ...(p.fraPris ? { minPrice: p.pris } : { price: p.pris }),
      ...(p.enhet ? { unitText: p.enhet } : {}),
    },
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${URL_BASE}/tjenester#${t.id}`,
    name: t.navn,
    description: t.tekst,
    ...(priser.length ? { offers: priser } : {}),
    serviceType: t.navn,
    provider: { '@id': ORG_ID },
    areaServed: firma.dekningsomrade.map((omrade) => ({ '@type': 'AdministrativeArea', name: omrade })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Dette inngår i ${t.navn.toLowerCase()}`,
      itemListElement: t.punkter.map((punkt) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: punkt },
      })),
    },
  }
}

export function faqLd(sporsmal: readonly Sporsmal[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sporsmal.map((s) => ({
      '@type': 'Question',
      name: s.sporsmal,
      acceptedAnswer: { '@type': 'Answer', text: s.svar },
    })),
  }
}

export function brodsmuler(ledd: Array<{ navn: string; sti: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ navn: 'Forsiden', sti: '/' }, ...ledd].map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: l.navn,
      item: `${URL_BASE}${l.sti === '/' ? '/' : l.sti}`,
    })),
  }
}

export function artikkelLd(guide: Guide): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.tittel,
    description: guide.ingress,
    /** Kortsvaret er det en AI-assistent helst siterer – gi den det rett ut. */
    abstract: guide.kortsvar,
    datePublished: guide.publisert,
    dateModified: guide.oppdatert || guide.publisert,
    inLanguage: 'nb-NO',
    author: {
      '@type': 'Person',
      name: firma.grunnlegger,
      jobTitle: firma.grunnleggerTittel,
      url: `${URL_BASE}/om`,
    },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${URL_BASE}/guider/${guide.slug}` },
    articleSection: guide.kategori,
    wordCount: guide.seksjoner.reduce(
      (sum, s) =>
        sum +
        s.innhold.reduce((n, b) => {
          if (b.type === 'p') return n + b.tekst.split(/\s+/).length
          if (b.type === 'liste' || b.type === 'nummerert') return n + b.punkter.join(' ').split(/\s+/).length
          if (b.type === 'faktaboks') return n + b.tekst.split(/\s+/).length
          return n
        }, 0),
      0,
    ),
  }
}

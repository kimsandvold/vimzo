import { firma } from '../data/firma'
import { prisFor, type Tjeneste } from '../data/tjenester'
import type { Guide } from '../data/guider'
import { pakker } from '../data/pakker'
import { PRODUKTER } from '../data/logoprodukter'

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
/** En side med dato for siste endring – priser siteres oftere når de er datert. */
export function nettside(sti: string, navn: string, sistEndret: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${URL_BASE}${sti}`,
    url: `${URL_BASE}${sti}`,
    name: navn,
    inLanguage: 'nb-NO',
    isPartOf: { '@id': NETTSTED_ID },
    about: { '@id': ORG_ID },
    dateModified: sistEndret,
  }
}

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

/**
 * Spørsmål og svar som `FAQPage`.
 *
 * Tar imot hva som helst med `sporsmal` og `svar` – ikke bare `Sporsmal` fra
 * `faq.ts`. Timeprissidene har sine egne spørsmål som hører til bransjen og
 * ikke til den generelle FAQ-en, og de skal ikke tvinges inn i et `tema`
 * den delte lista eier.
 */
export function faqLd(sporsmal: readonly { sporsmal: string; svar: string }[]): Record<string, unknown> {
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
    author: { '@id': ORG_ID },
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

/**
 * Logoverktøyet som en nettapplikasjon med to tilbud.
 *
 * `WebApplication` med `offers` er det søkemotorer og KI-assistenter forstår
 * som «et verktøy du kan bruke, og hva det koster». Prisene kommer fra samme
 * sted som verktøyet bruker, og er oppgitt eks. mva. med
 * `valueAddedTaxIncluded: false` – ellers ville en assistent sitert dem som
 * sluttpriser.
 */
/** Navnesjekken: et gratis verktøy, med et tilbud til 0 kr – det er slik «gratis» sies i strukturerte data. */
export function navnesjekkLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${URL_BASE}/navnesjekk#verktoy`,
    name: 'Navnesjekk for firmanavn',
    url: `${URL_BASE}/navnesjekk`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Nettleser',
    inLanguage: 'nb-NO',
    isAccessibleForFree: true,
    provider: { '@id': ORG_ID },
    description:
      'Sjekk om et firmanavn er ledig: søk i Enhetsregisteret etter samme og lignende navn, og se om ' +
      '.no-domenet er ledig – gratis og uten innlogging.',
    featureList: [
      'Samme og lignende navn i Enhetsregisteret (Brønnøysundregistrene)',
      'Ledige .no-domener for navnet (Norid)',
      'Rett videre til logo for navnet',
    ],
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'NOK' },
  }
}

export function logoverktoyLd(): Record<string, unknown> {
  const tilbud = (navn: string, pris: number, beskrivelse: string) => ({
    '@type': 'Offer',
    name: navn,
    description: beskrivelse,
    price: pris,
    priceCurrency: 'NOK',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: pris,
      priceCurrency: 'NOK',
      valueAddedTaxIncluded: false,
    },
    availability: 'https://schema.org/InStock',
    seller: { '@id': ORG_ID },
    url: `${URL_BASE}/logo`,
  })
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${URL_BASE}/logo#verktoy`,
    name: 'Vimzo logoverktøy',
    url: `${URL_BASE}/logo`,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Nettleser',
    inLanguage: 'nb-NO',
    provider: { '@id': ORG_ID },
    description:
      'Lag en profesjonell logo til bedriften din på norsk: skriv navnet, velg stil, plukk blant forslag og ' +
      'tilpass. Se logoen på skilt, visittkort og klær, og bestill filene klare for trykk, gravering og nett.',
    featureList: [
      'Forslag med abstrakte symboler, bransjesymboler og monogram',
      'Tolv skrifttyper med åpen lisens',
      'Fotorealistiske eksempler på skilt, visittkort, vindu og klær',
      'SVG og PDF for trykk, PNG opptil 4096 piksler, JPG',
      'Graveringsfil i én farge',
      'Fargekoder i HEX, RGB og CMYK, og palett for Adobe',
      'Visuell profil som PDF',
      'Filer til sosiale medier, favikon og e-postsignatur',
    ],
    offers: [
      tilbud(PRODUKTER.logo.navn, PRODUKTER.logo.pris, 'Logofilene i alle versjoner og formater.'),
      tilbud(
        PRODUKTER.profil.navn,
        PRODUKTER.profil.pris,
        'Logofilene pluss visuell profil, filer til sosiale medier og eksempler i bruk.',
      ),
    ],
  }
}

/**
 * Timepriskalkulatoren.
 *
 * `WebApplication` for selve verktøyet, og `HowTo` for framgangsmåten – det
 * siste fordi «hvordan regner jeg ut timeprisen min» er et stegvis spørsmål,
 * og fordi en assistent da kan gjengi stegene i stedet for å finne på egne.
 *
 * `slug` er satt på bransjesidene, og gir verktøyet en egen identitet per
 * bransje. Uten det ville alle sidene pekt på samme `@id`, og da hadde vi
 * fortalt Google at de er samme side – akkurat det vi vil unngå.
 */
export function timeprisLd(sti: string, navn: string, beskrivelse: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${URL_BASE}${sti}#verktoy`,
    name: navn,
    url: `${URL_BASE}${sti}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Nettleser',
    inLanguage: 'nb-NO',
    isAccessibleForFree: true,
    provider: { '@id': ORG_ID },
    description: beskrivelse,
    featureList: [
      'Regner ut minste og anbefalt timepris fra dine egne tall',
      'Skiller mellom enkeltpersonforetak og aksjeselskap',
      'Tar hensyn til feriepenger, arbeidsgiveravgift og obligatorisk tjenestepensjon',
      'Viser hvor mye ubetalt tid koster deg i timeprisen',
      'Sammenligner med det du tar i dag',
    ],
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'NOK' },
  }
}

export function fristerLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${URL_BASE}/frister#verktoy`,
    name: 'Fristkalender for bedrifter',
    url: `${URL_BASE}/frister`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Nettleser',
    inLanguage: 'nb-NO',
    isAccessibleForFree: true,
    provider: { '@id': ORG_ID },
    description:
      'Finner alle skatte- og rapporteringsfrister for en norsk bedrift ut fra organisasjonsnummeret, ' +
      'og legger dem i kalenderen med varsel.',
    featureList: [
      'Slår opp bedriften i Enhetsregisteret',
      'Mva-melding, a-melding, arbeidsgiveravgift og forskuddstrekk',
      'Forskuddsskatt, skattemelding, aksjonærregisteroppgave og årsregnskap',
      'Flytter frister som faller på helg og helligdag',
      'Kalenderfil for iPhone, Outlook og Google Kalender med varsel',
    ],
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'NOK' },
  }
}

/** Framgangsmåten, som fire steg. Brukes sammen med `timeprisLd`. */
export function timeprisHowToLd(navn: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: navn,
    inLanguage: 'nb-NO',
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'NOK', value: 0 },
    step: [
      {
        '@type': 'HowToStep',
        name: 'Bestem hva du vil sitte igjen med',
        text: 'I et enkeltpersonforetak er dette overskuddet før skatt. I et aksjeselskap er det bruttolønnen din, og da kommer feriepenger, arbeidsgiveravgift og pensjon i tillegg.',
      },
      {
        '@type': 'HowToStep',
        name: 'Summer de faste kostnadene for et helt år',
        text: 'Lokale, forsikring, verktøy, bil, regnskap, telefon og markedsføring. Alt som løper enten du har oppdrag eller ikke.',
      },
      {
        '@type': 'HowToStep',
        name: 'Regn ut hvor mange timer du faktisk kan fakturere',
        text: 'Arbeidsuker ganger timer per uke, ganget med den andelen du får betalt for. Befaring, tilbud, innkjøp, kjøring og rydding er ikke fakturerbart. De færreste kommer over 70 prosent.',
      },
      {
        '@type': 'HowToStep',
        name: 'Del summen på de fakturerbare timene, og legg på en buffer',
        text: 'Lønnskostnad pluss faste kostnader, delt på fakturerbare timer, gir minste timepris. Bufferen oppå dekker dårlige år, sykdom og nytt utstyr.',
      },
    ],
  }
}

/** /verktoy: lista over gratisverktøyene, som en ItemList søkemotorer og KI-assistenter kan lese. */
export function verktoyListeLd(liste: readonly { til: string; navn: string; tekst: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${URL_BASE}/verktoy#liste`,
    name: 'Gratis verktøy for små bedrifter',
    numberOfItems: liste.length,
    itemListElement: liste.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${URL_BASE}${v.til}`,
      name: v.navn,
      description: v.tekst,
    })),
  }
}

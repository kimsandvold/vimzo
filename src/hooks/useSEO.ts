import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://vimzo.no'
/** Raster-bilde – sosiale plattformer viser ikke SVG som og:image. */
const STANDARD_OG_BILDE = '/images/og/vimzo.png'

type JsonLdVerdi = Record<string, unknown>

interface SEOOptions {
  title: string
  description: string
  ogImage?: string
  ogImageAlt?: string
  noindex?: boolean
  jsonLd?: JsonLdVerdi | JsonLdVerdi[]
}

const JSONLD_ID = 'seo-jsonld'

function settJsonLd(verdi: JsonLdVerdi | JsonLdVerdi[] | undefined) {
  document.querySelectorAll(`script[data-managed="${JSONLD_ID}"]`).forEach((el) => el.remove())
  if (!verdi) return
  const elementer = Array.isArray(verdi) ? verdi : [verdi]
  elementer.forEach((item) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.managed = JSONLD_ID
    script.text = JSON.stringify(item)
    document.head.appendChild(script)
  })
}

function settMeta(navn: string, innhold: string, attributt = 'name') {
  let el = document.querySelector(`meta[${attributt}="${navn}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attributt, navn)
    document.head.appendChild(el)
  }
  el.content = innhold
}

function fjernMeta(navn: string) {
  document.querySelector(`meta[name="${navn}"]`)?.remove()
}

function settLenke(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Setter tittel, meta, kanonisk URL, OG/Twitter og JSON-LD for gjeldende side.
 *
 * Alt skrives til `document.head` under kjøring. Det er `scripts/prerender.mjs`
 * som fanger resultatet og skriver det som statisk HTML per rute – så det er
 * denne hooken som til syvende og sist bestemmer hva Google og AI-assistentene
 * faktisk får se.
 */
export function useSEO({ title, description, ogImage, ogImageAlt, noindex, jsonLd }: SEOOptions): void {
  const { pathname, search } = useLocation()
  // Kanonisk URL skal ikke inneholde spørrestreng (?utm=…) og ikke avsluttende
  // skråstrek – samme skrivemåte som i sitemap og i prerendret HTML.
  const kanonisk = `${SITE_URL}${pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname}`
  const bildeUrl = `${SITE_URL}${ogImage || STANDARD_OG_BILDE}`
  const jsonLdNokkel = jsonLd ? JSON.stringify(jsonLd) : ''
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stabilJsonLd = useMemo(() => jsonLd, [jsonLdNokkel])

  useEffect(() => {
    document.title = title
    window.scrollTo(0, 0)

    settMeta('description', description)
    settMeta('og:title', title, 'property')
    settMeta('og:description', description, 'property')
    settMeta('og:url', kanonisk, 'property')
    settMeta('og:image', bildeUrl, 'property')
    settMeta('twitter:title', title, 'name')
    settMeta('twitter:description', description, 'name')
    settMeta('twitter:image', bildeUrl, 'name')
    if (ogImageAlt) settMeta('og:image:alt', ogImageAlt, 'property')

    if (noindex) settMeta('robots', 'noindex, nofollow')
    else fjernMeta('robots')

    settLenke('canonical', kanonisk)
    settJsonLd(stabilJsonLd)
  }, [title, description, kanonisk, bildeUrl, ogImageAlt, noindex, stabilJsonLd, search])
}

export { SITE_URL }

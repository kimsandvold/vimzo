import { finnPalett, type Design, type Innhold } from './motor'
import { logoSvg, raster } from './eksport'

/**
 * E-postsignaturen.
 *
 * E-postprogrammer er nettlesere fra 2005: ingen stilark, ingen webfonter,
 * ingen flexbox. Derfor er signaturen én tabell med alt som `style` på hvert
 * element, Arial som skrift og logoen som et vanlig bilde.
 *
 * Bildet ligger på vimzo.no (api/signatur), ikke inni signaturen. Gmail
 * godtar ikke innebygde bilder (data:-adresser) i signaturer, og Outlook
 * gjør dem til vedlegg. Med en vanlig adresse virker den overalt.
 */

export interface Signaturdata {
  navn: string
  tittel: string
  telefon: string
  epost: string
  nettside: string
  adresse: string
}

export const TOM_SIGNATUR: Signaturdata = { navn: '', tittel: '', telefon: '', epost: '', nettside: '', adresse: '' }

export const MAKS_SIGNATUR = 120

export type Oppsett = 'klassisk' | 'stablet' | 'kompakt'

export const OPPSETT: readonly { id: Oppsett; navn: string }[] = [
  { id: 'klassisk', navn: 'Logo til venstre' },
  { id: 'stablet', navn: 'Logo under' },
  { id: 'kompakt', navn: 'Symbol' },
]

/** Bildet oppsettet bruker: hele logoen, eller bare symbolet. */
export const bildetFor = (o: Oppsett): 'logo' | 'merke' => (o === 'kompakt' ? 'merke' : 'logo')

/** Visningsstørrelsen i signaturen, i CSS-piksler. Bildet lages i dobbel størrelse for skarpe skjermer. */
export const BILDEBREDDE = { logo: 150, merke: 56 } as const

/**
 * Bildene, som PNG i dobbel størrelse: hele logoen uten slagord (slagordet
 * blir uleselig i 150 px) og symbolet alene.
 */
export async function lagSignaturbilder(design: Design, innhold: Innhold): Promise<{ logo: Blob; merke: Blob }> {
  const [logo, merke] = await Promise.all([
    logoSvg({ ...design, slagord: false }, innhold, 'positiv'),
    logoSvg({ ...design, beholder: design.beholder === 'ingen' ? 'flis' : design.beholder }, innhold, 'positiv', true),
  ])
  return {
    logo: await raster(logo, BILDEBREDDE.logo * 2),
    merke: await raster(merke, BILDEBREDDE.merke * 2),
  }
}

/** Bredde/høyde-forholdet til et PNG-bilde, så signaturen kan oppgi begge – Outlook vil ha det. */
export async function bildeforhold(png: Blob): Promise<number> {
  const bilde = await createImageBitmap(png)
  const r = bilde.height / bilde.width
  bilde.close()
  return r
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Nettsiden slik den skal se ut (uten https://) og som lenke. */
function nettsted(s: string): { vis: string; href: string } | null {
  const t = s.trim()
  if (!t) return null
  const uten = t.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  return { vis: uten, href: `https://${uten}` }
}

/**
 * Signaturen som HTML. `bilde` er adressen til logobildet – en blob-adresse i
 * forhåndsvisningen, vimzo.no-adressen i det kunden kopierer.
 */
export function signaturHtml(
  d: Signaturdata,
  oppsett: Oppsett,
  design: Design,
  innhold: Innhold,
  bilde: { src: string; forhold: number },
): string {
  const p = finnPalett(design.palett)
  const bedrift = innhold.navn.trim()
  const bredde = BILDEBREDDE[bildetFor(oppsett)]
  const hoyde = Math.round(bredde * bilde.forhold)
  const font = 'font-family:Arial,Helvetica,sans-serif'
  const lenke = `color:${p.primaer};text-decoration:none;white-space:nowrap`
  const graa = '#6B6B70'

  const web = nettsted(d.nettside)
  const tlf = d.telefon.trim()
  const kontakt = [
    tlf && `<a href="tel:${esc(tlf.replace(/[^\d+]/g, ''))}" style="${lenke}">${esc(tlf)}</a>`,
    d.epost.trim() && `<a href="mailto:${esc(d.epost.trim())}" style="${lenke}">${esc(d.epost.trim())}</a>`,
    web && `<a href="${esc(web.href)}" style="${lenke}">${esc(web.vis)}</a>`,
  ].filter(Boolean)

  const tittel = [d.tittel.trim(), oppsett === 'stablet' ? '' : bedrift].filter(Boolean).join(', ')
  const linjer = [
    `<tr><td style="${font};font-size:15px;line-height:20px;font-weight:bold;color:${p.mork};padding:0">${esc(d.navn.trim() || 'Ditt navn')}</td></tr>`,
    tittel && `<tr><td style="${font};font-size:13px;line-height:18px;color:${graa};padding:0 0 6px">${esc(tittel)}</td></tr>`,
    kontakt.length &&
      `<tr><td style="${font};font-size:13px;line-height:20px;color:${graa};padding:0">${kontakt.join(`<span style="color:${p.aksent}">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`)}</td></tr>`,
    d.adresse.trim() && `<tr><td style="${font};font-size:13px;line-height:20px;color:${graa};padding:0">${esc(d.adresse.trim())}</td></tr>`,
  ]
    .filter(Boolean)
    .join('')
  const info = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse">${linjer}</table>`
  const img = `<img src="${esc(bilde.src)}" width="${bredde}" height="${hoyde}" alt="${esc(bedrift)}" style="display:block;border:0;width:${bredde}px;min-width:${bredde}px;height:auto">`
  const tabell = (rader: string) =>
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse">${rader}</table>`

  if (oppsett === 'stablet')
    return tabell(
      `<tr><td style="padding:0 0 12px">${info}</td></tr>` +
        `<tr><td style="padding:12px 0 0;border-top:1px solid #E5E5EA">${img}</td></tr>`,
    )

  if (oppsett === 'kompakt')
    return tabell(`<tr><td valign="top" style="padding:2px 14px 0 0">${img}</td><td valign="top" style="padding:0">${info}</td></tr>`)

  return tabell(
    `<tr><td valign="middle" width="${bredde}" style="padding:0 18px 0 0;width:${bredde}px">${img}</td>` +
      `<td valign="middle" style="padding:0 0 0 18px;border-left:2px solid ${p.primaer}">${info}</td></tr>`,
  )
}

/** Signaturen som et eget HTML-dokument – til nedlasting, og til Apple Mail. */
export function signaturDokument(html: string, bedrift: string): string {
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8"><title>E-postsignatur – ${esc(bedrift)}</title></head><body>\n<!-- Laget med Vimzo – vimzo.no -->\n${html}\n</body></html>\n`
}

/**
 * Kopier signaturen som formatert tekst, så den kan limes rett inn i
 * signaturfeltet. Nettlesere uten ClipboardItem får den gamle veien: merk
 * en skjult kopi og kopier markeringen.
 */
export async function kopierFormatert(html: string, tekst: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([tekst], { type: 'text/plain' }),
      }),
    ])
    return
  }
  const holder = document.createElement('div')
  holder.contentEditable = 'true'
  holder.style.cssText = 'position:fixed;left:-99999px;top:0'
  holder.innerHTML = html
  document.body.appendChild(holder)
  const r = document.createRange()
  r.selectNodeContents(holder)
  const valg = window.getSelection()!
  valg.removeAllRanges()
  valg.addRange(r)
  const ok = document.execCommand('copy')
  valg.removeAllRanges()
  holder.remove()
  if (!ok) throw new Error('Kunne ikke kopiere')
}

/** Signaturen som ren tekst – til programmer som ikke tar HTML. */
export function signaturTekst(d: Signaturdata, innhold: Innhold): string {
  return [
    d.navn.trim(),
    [d.tittel.trim(), innhold.navn.trim()].filter(Boolean).join(', '),
    [d.telefon.trim(), d.epost.trim(), d.nettside.trim()].filter(Boolean).join(' · '),
    d.adresse.trim(),
  ]
    .filter(Boolean)
    .join('\n')
}

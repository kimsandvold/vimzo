// Genererer public/sitemap.xml og public/llms.txt fra koden, slik at hverken
// URL-lista eller maskinsammendraget kan komme ut av synk med innholdet.
//
// Kildene er src/data/*.ts. Filene pakkes i minnet med esbuild, sammen med
// det de importerer (tjenester.ts henter prisene fra pakker.ts), så vi
// slipper å vedlikeholde to sannheter.
//
// Lista brukes videre av scripts/prerender.mjs, som forhåndsrendrer nøyaktig
// de rutene som står i sitemap-en. Legger du til en guide eller et prosjekt,
// skjer resten av seg selv.

import { writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

const SITE_URL = 'https://vimzo.no'

/** Last en TS-fil som ESM-modul uten å skrive noe til disk. */
async function lastTs(sti) {
  const { outputFiles } = await build({ entryPoints: [sti], bundle: true, format: 'esm', platform: 'node', write: false })
  const code = outputFiles[0].text
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  return import(dataUrl)
}

const { guider } = await lastTs('src/data/guider.ts')
const { cases } = await lastTs('src/data/cases.ts')
const { pakker, driftsnivaer, tilleggstjenester, timepris, ANTALL_AVDRAG } = await lastTs('src/data/pakker.ts')
const { tjenester } = await lastTs('src/data/tjenester.ts')
const { faq } = await lastTs('src/data/faq.ts')

const idag = new Date().toISOString().slice(0, 10)

// --- 1. Sitemap ------------------------------------------------------------

/** Faste sider. Prioritet speiler hvor viktig siden er for salg, ikke smak. */
const faste = [
  { sti: '/', prioritet: '1.0', frekvens: 'weekly' },
  { sti: '/tjenester', prioritet: '0.9', frekvens: 'monthly' },
  { sti: '/priser', prioritet: '0.9', frekvens: 'monthly' },
  { sti: '/arrangement', prioritet: '0.8', frekvens: 'monthly' },
  { sti: '/arbeid', prioritet: '0.7', frekvens: 'monthly' },
  { sti: '/guider', prioritet: '0.7', frekvens: 'weekly' },
  { sti: '/logo', prioritet: '0.8', frekvens: 'monthly' },
  { sti: '/om', prioritet: '0.6', frekvens: 'yearly' },
  { sti: '/kontakt', prioritet: '0.8', frekvens: 'yearly' },
  { sti: '/personvern', prioritet: '0.2', frekvens: 'yearly' },
]

const blokk = ({ sti, prioritet, frekvens, dato = idag }) =>
  `  <url>
    <loc>${SITE_URL}${sti}</loc>
    <lastmod>${dato}</lastmod>
    <changefreq>${frekvens}</changefreq>
    <priority>${prioritet}</priority>
  </url>`

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generert av scripts/generate-sitemap.mjs. Ikke rediger for hånd. -->
<urlset xmlns="http://www.w3.org/1999/sitemap-image/1.1 http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${[
  ...faste.map(blokk),
  ...guider.map((g) =>
    blokk({ sti: `/guider/${g.slug}`, prioritet: '0.6', frekvens: 'monthly', dato: g.oppdatert || g.publisert }),
  ),
  ...cases.map((c) => blokk({ sti: `/arbeid/${c.slug}`, prioritet: '0.5', frekvens: 'yearly' })),
].join('\n')}
</urlset>
`
  // Riktig navnerom – skrevet ut her for å holde malen over lesbar.
  .replace(
    'xmlns="http://www.w3.org/1999/sitemap-image/1.1 http://www.sitemaps.org/schemas/sitemap/0.9"',
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  )

await writeFile('public/sitemap.xml', sitemap, 'utf-8')

// --- 2. llms.txt -----------------------------------------------------------
//
// Et kort, maskinlesbart sammendrag av hva nettstedet handler om. Standarden
// er ung, men fila koster ingenting og er nøyaktig den typen entydige fakta en
// språkmodell kan gjengi. Den genereres herfra slik at prisene i den aldri
// kan avvike fra prisene på siden.

const kr = (n) => n.toLocaleString('nb-NO').replace(/\s/g, '\u00A0')

const llms = `# Vimzo

> Vimzo lager hele nettsiden for små og mellomstore bedrifter i Norge – inkludert
> domene, tekst, bilder, design og publisering. Kunden bruker omtrent to timer på
> hele prosjektet. Hver side lages for én bedrift og leveres som ferdig HTML, så den
> er rask, billig å drifte og lett å finne både i søkemotorer og i AI-assistenter.

Leverer i hele Norge. Alt arbeid skjer digitalt.
Nettsted: ${SITE_URL}
Språk: norsk (bokmål)

## Priser (NOK, eks. mva.)

Typiske prosjekter og hvor de fleste lander. Den endelige prisen avtales etter en
samtale og gis skriftlig før arbeidet starter – da står den.

${pakker
  .map((p) =>
    p.pris.til === null
      ? `- ${p.navn}: fra ${kr(p.pris.fra)} kr — ${p.omfang.toLowerCase()}. ${p.for}`
      : `- ${p.navn}: typisk ${kr(p.pris.fra)}–${kr(p.pris.til)} kr — ${p.omfang.toLowerCase()}. ${p.for}`,
  )
  .join('\n')}
- Beløpet kan deles over ${ANTALL_AVDRAG} måneder.
${driftsnivaer.map((d) => `- ${d.navn}: ${kr(d.pris)} kr ${d.periode} — ${d.for} Ingen bindingstid.`).join('\n')}
- Timepris for endringer: ${kr(timepris)} kr
${tilleggstjenester
  .filter((t) => !t.navn.includes('Endringer etter'))
  .map((t) => `- ${t.navn}: ${t.fraPris ? 'fra ' : ''}${kr(t.pris)} kr${t.enhet ? ' ' + t.enhet : ''}`)
  .join('\n')}

Første års domene er inkludert i alle pakkene. Deretter ca. 169 kr/år, som Vimzo fornyer.

## Tjenester

${tjenester.map((t) => `- ${t.navn}${t.gruppe === 'tillegg' ? ' (tillegg)' : ''}: ${t.tekst}`).join('\n')}

## Hva kunden selv må gjøre

Omtrent to timer til sammen: én samtale i starten om hva bedriften gjør, og én
gjennomlesing før publisering. Vimzo ordner domene, tekst, bilder, design,
publisering og innmelding hos Google.

## Slik er sidene bygget

- Hver URL leveres som ferdig HTML. Ingen JavaScript må kjøres for å lese innholdet.
- Ingen WordPress, ingen plugins, ingen database å vedlikeholde.
- Strukturerte data etter schema.org på hver side.
- Universell utforming etter WCAG 2.1 AA.
- Kunden eier kildekoden, domenet og innholdet.
- Driften er én pris uansett hva siden gjør, og dekker webhotell, domene, sikkerhetskopi og overvåking.
- Endringer etter lansering faktureres med ${kr(timepris)} kr timen, per påbegynte halvtime.
- Regneverktøy og kalkulatorer bygges for den enkelte bedriften og legges inn i siden, uten lisens eller abonnement på selve verktøyet.
- Alt arbeid gjøres i Norge, på norsk, av Kim Sandvold.

## Viktige sider

- [Tjenester](${SITE_URL}/tjenester): hva som inngår i hver tjeneste
- [Priser](${SITE_URL}/priser): pakkepriser, drift og tillegg
- [Arrangementssider](${SITE_URL}/arrangement): kortvarige sider til messer, konferanser og kampanjer
- [Arbeid](${SITE_URL}/arbeid): leverte prosjekter
- [Guider](${SITE_URL}/guider): fagartikler om nettsider, pris og AI-synlighet
- [Lag logo](${SITE_URL}/logo): gratis logoverktøy, last ned SVG og PNG
${guider.map((g) => `- [${g.tittel}](${SITE_URL}/guider/${g.slug}): ${g.ingress}`).join('\n')}
- [Kontakt](${SITE_URL}/kontakt): be om tilbud

## Vanlige spørsmål

${faq.map((s) => `### ${s.sporsmal}\n${s.svar}`).join('\n\n')}

---
Generert fra kildekoden ${idag}. Oppdateres automatisk ved hvert bygg.
`

await writeFile('public/llms.txt', llms, 'utf-8')

const antall = faste.length + guider.length + cases.length
console.log(`[sitemap] ${antall} URL-er skrevet til public/sitemap.xml`)
console.log(`[llms] public/llms.txt oppdatert (${(llms.length / 1024).toFixed(1)} kB)`)

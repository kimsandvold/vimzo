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
const { PRODUKTER, OPPGRADERING } = await lastTs('src/data/logoprodukter.ts')

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
  { sti: '/navnesjekk', prioritet: '0.7', frekvens: 'monthly' },
  { sti: '/kontakt', prioritet: '0.8', frekvens: 'yearly' },
  { sti: '/personvern', prioritet: '0.2', frekvens: 'yearly' },
  { sti: '/vilkar/logo', prioritet: '0.2', frekvens: 'yearly' },
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

## Logoverktøyet

Kunden lager logoen selv på ${SITE_URL}/logo, på norsk. Innlogging kreves; å designe koster ingenting.
Verktøyet gir forslag med abstrakte symboler, bransjesymboler og monogram, tolv skrifttyper med åpen
lisens, og viser logoen fotorealistisk på skilt, visittkort, vindu og klær.

- ${PRODUKTER.logo.navn}: ${kr(PRODUKTER.logo.pris)} kr eks. mva. Alle logoversjoner (liggende, stående, symbol, navn)
  i farger, svart, hvitt og to farger på mørk bakgrunn – som SVG og PDF for trykk, PNG opptil 4096 px og JPG.
  Graveringsfil i én farge, fargekoder (HEX, RGB, CMYK, Adobe-palett), skriftfilene, favikon og webikoner.
- ${PRODUKTER.profil.navn}: ${kr(PRODUKTER.profil.pris)} kr eks. mva. Alt over, pluss visuell profil som PDF,
  filer til sosiale medier, e-postsignatur og bilder av logoen i bruk.
- ${OPPGRADERING.navn}: ${kr(OPPGRADERING.pris)} kr eks. mva, for den som alt har kjøpt logoen.
- Filene lastes ned med en gang; betaling med faktura etterpå (14 dagers forfall).
- Logoen kan velges i nettsidekalkulatoren på forsiden. Da faktureres den sammen med nettsiden, ikke før siden er ferdig.
- Kunden får tidsubegrenset bruksrett. Symboler og skrifter har åpne lisenser, så det gis ikke enerett til selve symbolet.

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
- Alt arbeid gjøres i Norge, på norsk.

## Viktige sider

- [Tjenester](${SITE_URL}/tjenester): hva som inngår i hver tjeneste
- [Priser](${SITE_URL}/priser): pakkepriser, drift og tillegg
- [Arrangementssider](${SITE_URL}/arrangement): kortvarige sider til messer, konferanser og kampanjer
- [Arbeid](${SITE_URL}/arbeid): leverte prosjekter
- [Guider](${SITE_URL}/guider): fagartikler om nettsider, pris og AI-synlighet
- [Lag logo](${SITE_URL}/logo): logoverktøy på norsk – design gratis etter innlogging, kjøp logo (${kr(PRODUKTER.logo.pris)} kr) eller logo med visuell profil (${kr(PRODUKTER.profil.pris)} kr)
- [Navnesjekk](${SITE_URL}/navnesjekk): gratis sjekk av om et firmanavn er ledig – samme og lignende navn i Brønnøysundregistrene, og ledige .no-domener
- [Kjøpsvilkår for logoverktøyet](${SITE_URL}/vilkar/logo)
- [Maskinlesbare priser](${SITE_URL}/priser.json): alle priser som JSON, datert
${guider.map((g) => `- [${g.tittel}](${SITE_URL}/guider/${g.slug}): ${g.ingress}`).join('\n')}
- [Kontakt](${SITE_URL}/kontakt): be om tilbud
- [Fullt innhold](${SITE_URL}/llms-full.txt): alle guidene og svarene i ren tekst

## Vanlige spørsmål

${faq.map((s) => `### ${s.sporsmal}\n${s.svar}`).join('\n\n')}

---
Generert fra kildekoden ${idag}. Oppdateres automatisk ved hvert bygg.
`

await writeFile('public/llms.txt', llms, 'utf-8')

// --- 2b. priser.json ---------------------------------------------------------
//
// Alle priser som maskinlesbar JSON, datert. Få nettsteder har dette, men det
// er nøyaktig det en KI-assistent eller et sammenligningsverktøy trenger for å
// sitere riktig pris i stedet for å gjette ut fra løpende tekst. Den lenkes fra
// llms.txt og fra <head> (rel="alternate"), og genereres herfra så den aldri
// kan avvike fra prisene på siden.

const priser = {
  kilde: `${SITE_URL}/priser`,
  oppdatert: idag,
  valuta: 'NOK',
  mva: { inkludert: false, sats: 0.25, merknad: 'Alle beløp er eks. mva.' },
  nettsider: pakker.map((p) => ({
    navn: p.navn,
    omfang: p.omfang,
    for: p.for,
    fra: p.pris.fra,
    til: p.pris.til,
    url: `${SITE_URL}/priser#${p.id}`,
  })),
  delbetaling: { antallManeder: ANTALL_AVDRAG },
  drift: driftsnivaer.map((d) => ({ navn: d.navn, pris: d.pris, periode: d.periode, bindingstid: 'ingen' })),
  timepris,
  tillegg: tilleggstjenester.map((t) => ({ navn: t.navn, pris: t.pris, fraPris: !!t.fraPris, enhet: t.enhet ?? null })),
  logoverktoy: {
    url: `${SITE_URL}/logo`,
    vilkar: `${SITE_URL}/vilkar/logo`,
    produkter: Object.entries(PRODUKTER).map(([id, p]) => ({ id, navn: p.navn, pris: p.pris })),
    oppgradering: { id: 'oppgradering', navn: OPPGRADERING.navn, pris: OPPGRADERING.pris, gjelder: 'Kunder som har kjøpt logo' },
    betaling: 'Faktura etter nedlasting, 14 dagers forfall',
  },
}

await writeFile('public/priser.json', JSON.stringify(priser, null, 2) + '\n', 'utf-8')
console.log('[priser] public/priser.json oppdatert')

// --- 3. llms-full.txt -------------------------------------------------------
//
// Hele innholdet i guidene, som ren tekst. llms.txt er sammendraget; denne er
// det en språkmodell faktisk kan sitere fra, uten å måtte tolke HTML.

const blokkTilTekst = (b) => {
  if (b.type === 'p') return b.tekst
  if (b.type === 'liste') return b.punkter.map((p) => `- ${p}`).join('\n')
  if (b.type === 'nummerert') return b.punkter.map((p, i) => `${i + 1}. ${p}`).join('\n')
  if (b.type === 'faktaboks') return `> **${b.tittel}**\n> ${b.tekst}`
  if (b.type === 'tabell')
    return [
      `| ${b.kolonner.join(' | ')} |`,
      `| ${b.kolonner.map(() => '---').join(' | ')} |`,
      ...b.rader.map((r) => `| ${r.join(' | ')} |`),
    ].join('\n')
  return ''
}

const llmsFull = `${llms.replace(/\n---\nGenerert fra kildekoden[\s\S]*$/, '')}

# Guider i fulltekst

${guider
  .map(
    (g) => `## ${g.tittel}

Kilde: ${SITE_URL}/guider/${g.slug}
Forfatter: Vimzo · Publisert ${g.publisert}${g.oppdatert ? ` · Oppdatert ${g.oppdatert}` : ''}

**Kort svar:** ${g.kortsvar}

${g.seksjoner.map((sek) => `### ${sek.overskrift}\n\n${sek.innhold.map(blokkTilTekst).join('\n\n')}`).join('\n\n')}`,
  )
  .join('\n\n---\n\n')}

---
Generert fra kildekoden ${idag}. Oppdateres automatisk ved hvert bygg.
`

await writeFile('public/llms-full.txt', llmsFull, 'utf-8')
console.log(`[llms] public/llms-full.txt oppdatert (${(Buffer.byteLength(llmsFull) / 1024).toFixed(1)} kB)`)

const antall = faste.length + guider.length + cases.length
console.log(`[sitemap] ${antall} URL-er skrevet til public/sitemap.xml`)
console.log(`[llms] public/llms.txt oppdatert (${(llms.length / 1024).toFixed(1)} kB)`)

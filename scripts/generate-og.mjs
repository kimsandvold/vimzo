// Lager delingsbildene (Open Graph / Twitter) som PNG.
//
// Kjøres med `npm run og`, ikke ved hvert bygg – bildene endrer seg sjelden,
// og resultatet sjekkes inn. De tegnes i samme palett og typografi som
// nettstedet, så delingskortet ser ut som siden det peker til.
//
// Hver kalkulator har sitt eget bilde, og bildet viser TALLET. Et delingskort
// som bare sier «gratis kalkulator» blir hoppet over; ett som sier «770 kr i
// timen» blir klikket på. Tallene regnes ut av den samme koden som siden
// bruker, lastet med esbuild – så bildet og siden kan aldri si hver sin ting.
//
// Geist bakes inn som base64 slik at Chromium ikke trenger nettverk.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rot = join(__dirname, '..')

const BREDDE = 1200
const HOYDE = 630

/* ------------------------------------------------------ palett og fonter */

const FARGE = {
  bunn: '#1D1D1F',
  blekk: '#FFFFFF',
  dempet: 'rgba(255,255,255,.58)',
  aksent: '#6CB4FF',
  glod: 'rgba(0,92,200,.55)',
}

const font = async (fil) =>
  `data:font/woff2;base64,${(await readFile(join(rot, 'public/fonts/geist', fil))).toString('base64')}`

const geist = await font('geist-latin.woff2')
const geistMono = await font('geist-mono-latin.woff2')

/* --------------------------------------------------------- tallgrunnlaget */

async function lastTs(sti) {
  const { outputFiles } = await build({
    entryPoints: [sti],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  })
  const dataUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
  return import(dataUrl)
}

const { BRANSJEPROFILER } = await lastTs('src/data/timeprisbransjer.ts')
const { STANDARD } = await lastTs('src/data/timepris.ts')
const { beregnKalkyle } = await lastTs('src/lib/timepris.ts')
const { beregnAnsattkostnad } = await lastTs('src/lib/ansatt.ts')
const { beregnOmsetningskrav } = await lastTs('src/lib/omsetning.ts')
const { kronerTilOre, formaterKroner } = await lastTs('src/lib/kroner.ts')

/** Samme tall som bransjesiden viser når den åpnes. */
const bransjetall = (profil) =>
  beregnKalkyle({
    ...STANDARD,
    fakturerbarAndel: profil.typisk.fakturerbarAndel,
    arbeidsuker: profil.typisk.arbeidsuker,
    timerPerUke: profil.typisk.timerPerUke,
    fasteKostnader: profil.typisk.fasteKostnader,
  }).anbefaltAvrundet

const ansatt = beregnAnsattkostnad({
  bruttolonn: kronerTilOre(600_000),
  agaSone: '1',
  feriepengesats: 12,
  pensjonssats: 2,
  andreKostnader: kronerTilOre(50_000),
  arbeidstimer: 1750,
  fakturerbarAndel: 70,
})

const fakturere = beregnOmsetningskrav({
  driftsform: 'enk',
  onsketInntekt: kronerTilOre(600_000),
  agaSone: '1',
  fasteKostnader: kronerTilOre(150_000),
  timepris: kronerTilOre(650),
  fakturerbarAndel: 65,
  arbeidsuker: 46,
  snittOppdrag: 0,
})

/* ------------------------------------------------------------- kortene */

const KORT = [
  {
    fil: 'vimzo.png',
    tittel: 'Laget for din bedrift.<em>Med åpne priser.</em>',
    bunn: 'Håndlaget · Fast pris etter en prat · Hele Norge',
  },
  {
    fil: 'timepris.png',
    tittel: 'Hva må du <em>egentlig</em> ta i timen?',
    stat: '54 %',
    statTekst: 'høyere enn arbeidstimene tilsier,<br/>fordi ikke all tid kan faktureres',
    bunn: 'Gratis kalkulator · Ingen innlogging',
  },
  ...BRANSJEPROFILER.map((p) => ({
    fil: `timepris-${p.slug}.png`,
    tittel: p.tittel.replace(/^Hva skal (en|et) /, 'Hva skal <em>$1 ').replace(/ ta i timen\?$/, '</em><br/>ta i timen?'),
    stat: formaterKroner(bransjetall(p)),
    statTekst: `typisk timepris for ${p.ubestemt},<br/>eks. mva.`,
    bunn: 'Gratis kalkulator · Ingen innlogging',
  })),
  {
    fil: 'hva-koster-en-ansatt.png',
    tittel: 'Hva koster <em>en ansatt</em>?',
    stat: formaterKroner(ansatt.sumPerAr),
    statTekst: 'i året, ved 600 000 i lønn.<br/>38 % mer enn lønnsslippen',
    bunn: 'Gratis kalkulator · Ingen innlogging',
  },
  {
    fil: 'hva-ma-du-fakturere.png',
    tittel: 'Hvor mye må du <em>fakturere</em> for å gå rundt?',
    stat: formaterKroner(fakturere.omsetningPerManed),
    statTekst: 'i måneden, eks. mva.<br/>Det er 96 fakturerbare timer',
    bunn: 'Gratis kalkulator · Ingen innlogging',
  },
]

const MERKE = `
  <svg width="44" height="44" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="150" fill="#080808"/>
    <g fill="#fff">
      <path d="M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z"/>
      <path d="M678 367L718 435L500 795L461 721Z"/>
    </g>
  </svg>`

const side = (kort) => `<!DOCTYPE html>
<html lang="nb"><head><meta charset="utf-8" />
<style>
  @font-face { font-family: 'Geist'; font-weight: 300 800; src: url(${geist}) format('woff2'); }
  @font-face { font-family: 'Geist Mono'; font-weight: 400 600; src: url(${geistMono}) format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${BREDDE}px; height: ${HOYDE}px;
    background: ${FARGE.bunn}; color: ${FARGE.blekk};
    font-family: 'Geist', sans-serif;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 64px 72px;
  }
  .glod {
    position: absolute; top: -48%; right: -20%;
    width: 860px; height: 860px; border-radius: 50%;
    background: radial-gradient(circle, ${FARGE.glod} 0%, rgba(0,92,200,0) 66%);
  }
  .rutenett {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 72px 72px;
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 25% 45%, #000 20%, transparent 78%);
  }
  .merke { position: relative; display: flex; align-items: center; gap: 14px; }
  .merke span { font-size: 31px; font-weight: 600; letter-spacing: -.045em; }
  .midt { position: relative; display: flex; align-items: flex-end; gap: 56px; }
  h1 {
    flex: 1;
    font-size: ${kort.stat ? '62px' : '76px'}; font-weight: 600;
    line-height: 1.05; letter-spacing: -.04em; max-width: 15ch;
  }
  h1 em { font-style: normal; color: ${FARGE.aksent}; }
  .stat { text-align: right; flex-shrink: 0; }
  .stat .tall {
    font-family: 'Geist Mono', monospace; font-size: 88px; font-weight: 600;
    letter-spacing: -.05em; line-height: 1; color: ${FARGE.aksent};
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .stat .tekst { margin-top: 14px; font-size: 21px; line-height: 1.4; color: ${FARGE.dempet}; }
  .bunn {
    position: relative; display: flex; align-items: center; justify-content: space-between;
    padding-top: 26px; border-top: 1px solid rgba(255,255,255,.14);
    font-family: 'Geist Mono', monospace; font-size: 19px; letter-spacing: .06em;
    color: ${FARGE.dempet}; text-transform: uppercase;
  }
  .bunn .url { color: ${FARGE.blekk}; }
</style></head>
<body>
  <div class="glod"></div><div class="rutenett"></div>
  <div class="merke">${MERKE}<span>vimzo</span></div>
  <div class="midt">
    <h1>${kort.tittel}</h1>
    ${kort.stat ? `<div class="stat"><div class="tall">${kort.stat}</div><div class="tekst">${kort.statTekst}</div></div>` : ''}
  </div>
  <div class="bunn"><span>${kort.bunn}</span><span class="url">vimzo.no</span></div>
</body></html>`

/* ----------------------------------------------------------- tegningen */

const puppeteer = (await import('puppeteer')).default
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const utDir = join(rot, 'public/images/og')
await mkdir(utDir, { recursive: true })

const fane = await browser.newPage()
await fane.setViewport({ width: BREDDE, height: HOYDE, deviceScaleFactor: 1 })

for (const kort of KORT) {
  await fane.setContent(side(kort), { waitUntil: 'load' })
  await fane.evaluateHandle('document.fonts.ready')
  await fane.screenshot({ path: join(utDir, kort.fil), type: 'png' })
  console.log(`[og] public/images/og/${kort.fil}`)
}

// Apple-ikonet tegnes fra det samme merket. iOS viser ikke SVG-favicon, så
// dette er den ene rasterkopien som faktisk trengs.
const ikonSide = await browser.newPage()
await ikonSide.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 })
await ikonSide.setContent(
  `<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0 }
    body { width:180px; height:180px; background:#080808; display:flex; align-items:center; justify-content:center }
  </style></head><body><svg width="180" height="180" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#080808"/>
    <g fill="#fff">
      <path d="M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z"/>
      <path d="M678 367L718 435L500 795L461 721Z"/>
    </g>
  </svg></body></html>`,
  { waitUntil: 'load' },
)
await ikonSide.screenshot({ path: join(rot, 'public/apple-touch-icon.png'), type: 'png' })

await browser.close()
console.log(`[og] ${KORT.length} delingsbilder + apple-touch-icon.png skrevet`)

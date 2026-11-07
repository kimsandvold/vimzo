// Lager delingsbildet (Open Graph / Twitter) som PNG.
//
// Kjøres ved behov med `npm run og`, ikke ved hvert bygg – bildet endrer seg
// sjelden, og resultatet sjekkes inn. Det tegnes i den samme paletten og
// typografien som nettstedet, så delingskortet ser ut som siden det peker til.
//
// Geist bakes inn som base64 slik at Chromium ikke trenger nettverk eller en
// base-URL for å finne fonten.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rot = join(__dirname, '..')

const BREDDE = 1200
const HOYDE = 630

const font = async (fil) =>
  `data:font/woff2;base64,${(await readFile(join(rot, 'public/fonts/geist', fil))).toString('base64')}`

const geist = await font('geist-latin.woff2')
const geistMono = await font('geist-mono-latin.woff2')

const html = `<!DOCTYPE html>
<html lang="nb"><head><meta charset="utf-8" />
<style>
  @font-face { font-family: 'Geist'; font-weight: 300 800; src: url(${geist}) format('woff2'); }
  @font-face { font-family: 'Geist Mono'; font-weight: 400 600; src: url(${geistMono}) format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${BREDDE}px; height: ${HOYDE}px;
    background: #0C0D0C; color: #FCFCFA;
    font-family: 'Geist', sans-serif;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 76px;
  }
  .glod {
    position: absolute; top: -45%; right: -18%;
    width: 820px; height: 820px; border-radius: 50%;
    background: radial-gradient(circle, rgba(31,106,76,.6) 0%, rgba(31,106,76,0) 66%);
  }
  .rutenett {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(247,248,250,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(247,248,250,.04) 1px, transparent 1px);
    background-size: 72px 72px;
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 25% 45%, #000 20%, transparent 78%);
  }
  .merke { position: relative; display: flex; align-items: center; gap: 16px; }
  .merke span { font-size: 34px; font-weight: 600; letter-spacing: -.045em; }
  h1 {
    position: relative;
    font-size: 78px; font-weight: 600; line-height: 1.04; letter-spacing: -.04em;
    max-width: 17ch;
  }
  h1 em { font-style: normal; color: #F0B45F; }
  .bunn {
    position: relative; display: flex; align-items: center; justify-content: space-between;
    padding-top: 28px; border-top: 1px solid rgba(247,248,250,.14);
    font-family: 'Geist Mono', monospace; font-size: 20px; letter-spacing: .06em;
    color: rgba(247,248,250,.56); text-transform: uppercase;
  }
  .bunn .pris { color: #FBF7F0; }
</style></head>
<body>
  <div class="glod"></div><div class="rutenett"></div>

  <div class="merke">
    <svg width="48" height="48" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx="150" fill="#080808"/>
      <g fill="#fff">
        <path d="M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z"/>
        <path d="M678 367L718 435L500 795L461 721Z"/>
      </g>
    </svg>
    <span>vimzo</span>
  </div>

  <h1>Laget for din bedrift.<br/><em>Med åpne priser.</em></h1>

  <div class="bunn">
    <span>Håndlaget · Fast pris etter en prat · Hele Norge</span>
    <span class="pris">vimzo.no</span>
  </div>
</body></html>`

const puppeteer = (await import('puppeteer')).default
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const side = await browser.newPage()
await side.setViewport({ width: BREDDE, height: HOYDE, deviceScaleFactor: 1 })
await side.setContent(html, { waitUntil: 'networkidle0' })
await side.evaluateHandle('document.fonts.ready')

const utDir = join(rot, 'public/images/og')
await mkdir(utDir, { recursive: true })
await side.screenshot({ path: join(utDir, 'vimzo.png'), type: 'png' })

console.log('[og] public/images/og/vimzo.png skrevet (1200×630)')

// Apple-ikonet tegnes fra det samme merket. iOS viser ikke SVG-favicon, så
// dette er den ene rasterkopien som faktisk trengs.
const ikonHtml = `<!DOCTYPE html><html><head><style>
  * { margin:0; padding:0 }
  body { width:180px; height:180px; background:#080808; display:flex; align-items:center; justify-content:center }
</style></head><body>
  <svg width="180" height="180" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#080808"/>
    <g fill="#fff">
      <path d="M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z"/>
      <path d="M678 367L718 435L500 795L461 721Z"/>
    </g>
  </svg>
</body></html>`

const ikonSide = await browser.newPage()
await ikonSide.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 })
await ikonSide.setContent(ikonHtml, { waitUntil: 'load' })
await ikonSide.screenshot({ path: join(rot, 'public/apple-touch-icon.png'), type: 'png' })

await browser.close()
console.log('[og] public/apple-touch-icon.png skrevet (180×180)')

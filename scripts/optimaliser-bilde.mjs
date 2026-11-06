// Konverterer et stort fotografi til WebP i flere bredder.
//
// Vi selger raske sider, så et heltebilde kan ikke være et 3 MB JPEG. Her
// skaleres originalen ned til de breddene nettleseren faktisk trenger, og
// kodes som WebP – som regel 60–80 % mindre enn JPEG ved samme opplevd
// kvalitet.
//
// Kodingen skjer i Chromium via canvas. Det sparer oss for en bildemotor som
// avhengighet, og Chromiums WebP-koder er den samme som brukerne dekoder med.
//
// Bruk:  node scripts/optimaliser-bilde.mjs <kilde> <navn> [bredder…] [kvalitet]
// Eks.:  node scripts/optimaliser-bilde.mjs ~/Bilder/vinter.jpg vinter 1920 1280 800 0.7
//
// Ligger bildet bak et slør, tåler det lavere kvalitet enn du tror – 0.6–0.7
// er som regel umulig å skille fra 0.85 når halve kontrasten er lagt over.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rot = join(__dirname, '..')

const [, , kilde, navn, ...rest] = process.argv
// Siste argument kan være kvalitet (0–1). Alt annet er bredder.
const kvalitetArg = rest.length && Number(rest[rest.length - 1]) < 1 ? Number(rest.pop()) : null
const breddeArg = rest
if (!kilde || !navn) {
  console.error('Bruk: node scripts/optimaliser-bilde.mjs <kilde> <navn> [bredder…]')
  process.exit(1)
}
const bredder = breddeArg.length ? breddeArg.map(Number) : [1920, 1280, 800]
const KVALITET = kvalitetArg ?? 0.82

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const data = await readFile(kilde)
const dataUrl = `data:${MIME[extname(kilde).toLowerCase()] || 'image/jpeg'};base64,${data.toString('base64')}`

const puppeteer = (await import('puppeteer')).default
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const side = await browser.newPage()
await side.setContent('<body></body>')

const utDir = join(rot, 'public/images/hero')
await mkdir(utDir, { recursive: true })

const resultat = await side.evaluate(
  async (url, bredder, kvalitet) => {
    const bilde = new Image()
    await new Promise((ok, feil) => {
      bilde.onload = ok
      bilde.onerror = () => feil(new Error('kunne ikke dekode kildebildet'))
      bilde.src = url
    })

    const ut = []
    for (const bredde of bredder) {
      const skala = Math.min(1, bredde / bilde.naturalWidth)
      const w = Math.round(bilde.naturalWidth * skala)
      const h = Math.round(bilde.naturalHeight * skala)
      const lerret = document.createElement('canvas')
      lerret.width = w
      lerret.height = h
      const ctx = lerret.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bilde, 0, 0, w, h)
      ut.push({ bredde: w, hoyde: h, data: lerret.toDataURL('image/webp', kvalitet) })
    }
    return { original: { w: bilde.naturalWidth, h: bilde.naturalHeight }, ut }
  },
  dataUrl,
  bredder,
  KVALITET,
)

console.log(`[bilde] original ${resultat.original.w}×${resultat.original.h}, ${(data.length / 1024 / 1024).toFixed(1)} MB`)
for (const { bredde, hoyde, data: d } of resultat.ut) {
  const bytes = Buffer.from(d.split(',')[1], 'base64')
  const fil = join(utDir, `${navn}-${bredde}.webp`)
  await writeFile(fil, bytes)
  console.log(`[bilde] ✓ ${navn}-${bredde}.webp  ${bredde}×${hoyde}  ${(bytes.length / 1024).toFixed(0)} kB`)
}

await browser.close()

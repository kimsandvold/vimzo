// Forhåndsrendrer alle offentlige ruter etter `vite build`.
//
// Appen rendres klient-side (createRoot().render), så søkemotorer, delings-
// roboter og indekseringsrobotene som henter innhold til AI-assistenter ville
// ellers sett et tomt skall. Her tas et øyeblikksbilde av ferdig rendret DOM –
// inkludert <title>, meta, canonical, OG/Twitter og JSON-LD satt av useSEO – i
// en headless Chromium, og det skrives som statisk HTML per rute:
//
//   dist/index.html                      (forsiden)
//   dist/priser/index.html
//   dist/guider/hva-koster-en-nettside/index.html   osv.
//
// Rutene leses fra dist/sitemap.xml, så lista holder seg i synk. Vanlige
// besøkende får fortsatt hele appen, som overtar ved lasting.
//
// Feiler trinnet (f.eks. uten nettverk for å hente Chromium), logges en
// advarsel og bygget fortsetter – da faller man tilbake til ren klient-
// rendring. Men da er halve produktet borte, så feilen skal tas på alvor.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const PORT = 4179
const SITE_URL = 'https://vimzo.no'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

async function lesRuter() {
  try {
    const xml = await readFile(join(distDir, 'sitemap.xml'), 'utf-8')
    const adresser = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
    const ruter = adresser
      .filter((u) => u.startsWith(SITE_URL))
      .map((u) => new URL(u).pathname)
      .filter((p) => !p.endsWith('.html'))
    // Unik liste, forsiden først.
    return [...new Set(ruter)].sort((a, b) => a.length - b.length)
  } catch (e) {
    console.warn('[prerender] kunne ikke lese sitemap.xml – hopper over:', e.message)
    return []
  }
}

// Liten statisk server med fallback til index.html.
//
// Fallbacken er det UBERØRTE Vite-skallet, lest inn én gang før noe rendres.
// Forsiden rendres først og overskriver dist/index.html; leste vi fila på nytt,
// ville alle andre ruter startet fra forsidens øyeblikksbilde og arvet det den
// la inn i <head>.
function startServer(skall) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let filsti = join(distDir, url)
        let ext = extname(filsti)
        let data
        if (!ext) {
          data = skall
          ext = '.html'
        } else {
          data = await readFile(filsti).catch(() => {
            ext = '.html'
            return skall
          })
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(500)
        res.end('feil')
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function main() {
  const ruter = await lesRuter()
  if (ruter.length === 0) return

  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch (e) {
    console.warn('[prerender] puppeteer ikke tilgjengelig – hopper over:', e.message)
    return
  }

  const skall = await readFile(join(distDir, 'index.html'))
  const server = await startServer(skall)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      protocolTimeout: 90000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch (e) {
    console.warn('[prerender] kunne ikke starte Chromium – hopper over:', e.message)
    server.close()
    return
  }

  let ok = 0
  const feilet = []
  for (const rute of ruter) {
    let side
    try {
      side = await browser.newPage()
      await lagOyeblikksbilde(side, rute)
      ok++
      console.log(`[prerender] ✓ ${rute}`)
    } catch (e) {
      console.warn(`[prerender] ✗ ${rute}: ${e.message}`)
      feilet.push(rute)
    } finally {
      await side?.close().catch(() => {})
    }
  }

  await browser.close()
  server.close()
  console.log(`[prerender] ferdig – ${ok}/${ruter.length} ruter forhåndsrendret`)
  if (feilet.length) {
    console.warn(`[prerender] IKKE forhåndsrendret: ${feilet.join(', ')}`)
    process.exitCode = 1
  }
}

async function lagOyeblikksbilde(side, rute) {
  await side.goto(`http://localhost:${PORT}${rute}`, { waitUntil: 'networkidle2', timeout: 60000 })

  // Bekreft at useSEO har kjørt for nettopp DENNE ruta: canonical-pathname skal
  // matche, og appen skal ha rendret innhold i #root.
  await side.waitForFunction(
    (forventet) => {
      const rot = document.querySelector('#root')
      const kanonisk = document.querySelector('link[rel="canonical"]')
      if (!rot || rot.children.length === 0 || !kanonisk) return false
      try {
        return new URL(kanonisk.href).pathname === forventet
      } catch {
        return false
      }
    },
    { timeout: 15000 },
    rute,
  )

  // Liten margin så resten av JSON-LD og meta rekker å settes.
  await new Promise((r) => setTimeout(r, 250))

  // styled-components bruker CSSOM insertRule i produksjon («speedy mode»), så
  // <style data-styled> står tom i outerHTML. Da ville den statiske HTML-en
  // lastet helt ustilt til JS-bunten rakk å injisere stilene på nytt – et hvitt
  // blink ved hver lasting. Skriv reglene tilbake som tekst før vi tar bildet.
  await side.evaluate(() => {
    document.querySelectorAll('style[data-styled]').forEach((tag) => {
      const ark = tag.sheet
      if (!ark || ark.cssRules.length === 0) return
      const css = Array.from(ark.cssRules)
        .map((regel) => regel.cssText)
        .join('')
      if (tag.textContent !== css) tag.textContent = css
    })
  })

  const html = await side.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML)
  const utDir = rute === '/' ? distDir : join(distDir, rute)
  await mkdir(utDir, { recursive: true })
  await writeFile(join(utDir, 'index.html'), html, 'utf-8')
}

main().catch((e) => {
  console.warn('[prerender] uventet feil:', e.message)
  process.exitCode = 1
})

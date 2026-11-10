// Varsler søkemotorene om at sidene er oppdatert, via IndexNow.
//
// IndexNow er en åpen protokoll som Bing, Yandex, Seznam og Naver følger.
// Bing er det som teller mest her: ChatGPT-søk og Copilot henter fra Bings
// indeks, så en side Bing vet om i dag, kan bli sitert i dag – ikke om tre
// uker når roboten kommer innom av seg selv.
//
// Kjøres ETTER at en deploy er ute (ikke i bygget – lokale bygg skal ikke
// sende noe):  npm run indexnow
// Nøkkelen ligger i public/dbeb780bb2aeae7d160ae55a77bb3f3c.txt, så søkemotoren kan sjekke at
// varselet kommer fra eieren av domenet.

import { readFile } from 'node:fs/promises'

const VERT = 'vimzo.no'
const NOKKEL = 'dbeb780bb2aeae7d160ae55a77bb3f3c'

const sitemap = await readFile('public/sitemap.xml', 'utf-8')
const urler = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
urler.push('https://vimzo.no/llms.txt', 'https://vimzo.no/llms-full.txt', 'https://vimzo.no/priser.json')

const svar = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: VERT, key: NOKKEL, keyLocation: `https://${VERT}/${NOKKEL}.txt`, urlList: urler }),
})

console.log(`[indexnow] ${urler.length} adresser sendt – svar ${svar.status} ${svar.statusText}`)
if (!svar.ok && svar.status !== 202) process.exitCode = 1

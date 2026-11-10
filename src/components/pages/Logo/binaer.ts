/**
 * Små binærformater pakken trenger, skrevet for hånd så vi slipper et
 * bibliotek for hvert av dem: PNG-biter (metadata og oppløsning),
 * favicon.ico og skriftfiler pakket ut av WOFF.
 */

/* ------------------------------------------------------------------- crc32 */

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(b: Uint8Array) {
  let c = 0xffffffff
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/* ------------------------------------------------------------------ lerret */

/**
 * Lerretet som fil (PNG eller JPEG).
 *
 * Ikke `toBlob`: Chrome koder den i ledige stunder på hovedtråden, og har
 * siden noe annet å gjøre (en animasjon, mockupene på profilsiden), venter
 * hver fil på en tidsgrense – målt til nesten ett sekund per bilde, over et
 * minutt for hele pakken. `toDataURL` koder med en gang. Den blokkerer litt,
 * men kunden venter på filene uansett, og tiden er forutsigbar.
 */
export function lerretTilBlob(c: HTMLCanvasElement, type = 'image/png', kvalitet?: number): Blob {
  const url = c.toDataURL(type, kvalitet)
  const bin = atob(url.slice(url.indexOf(',') + 1))
  const ut = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) ut[i] = bin.charCodeAt(i)
  return new Blob([ut], { type })
}

/* --------------------------------------------------------------------- png */

const enc = new TextEncoder()

function pngBit(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const t = enc.encode(type)
  const ut = new Uint8Array(12 + data.length)
  const dv = new DataView(ut.buffer)
  dv.setUint32(0, data.length)
  ut.set(t, 4)
  ut.set(data, 8)
  const kropp = new Uint8Array(4 + data.length)
  kropp.set(t)
  kropp.set(data, 4)
  dv.setUint32(8 + data.length, crc32(kropp))
  return ut
}

/**
 * tEXt der teksten er ren latin-1 (det alle programmer leser), ellers iTXt
 * i UTF-8 – så æøå i et bedriftsnavn kommer fram som æøå.
 */
function tekstbit(nokkel: string, tekst: string): Uint8Array<ArrayBuffer> {
  if (/^[\x20-\x7e]*$/.test(tekst)) return pngBit('tEXt', new Uint8Array([...enc.encode(nokkel), 0, ...enc.encode(tekst)]))
  return pngBit('iTXt', new Uint8Array([...enc.encode(nokkel), 0, 0, 0, 0, 0, ...enc.encode(tekst)]))
}

/** pHYs: piksler per meter. 300 dpi = 11811 ppm. */
function physBit(dpi: number) {
  const ppm = Math.round(dpi / 0.0254)
  const d = new Uint8Array(9)
  const dv = new DataView(d.buffer)
  dv.setUint32(0, ppm)
  dv.setUint32(4, ppm)
  d[8] = 1
  return pngBit('pHYs', d)
}

/**
 * Legg oppløsning og metadata inn i en PNG fra canvas, som ikke gir noen av
 * delene selv. Alt settes rett etter IHDR – pHYs må stå før bildedataene,
 * ellers overser programmene den.
 */
export async function pngMedMetadata(png: Blob, felter: [string, string][], dpi = 300): Promise<Blob> {
  const b = new Uint8Array(await png.arrayBuffer())
  const ihdrSlutt = 8 + 8 + new DataView(b.buffer).getUint32(8) + 4
  // Fjern eventuelle pHYs/tEXt/iTXt nettleseren har lagt inn, så de ikke står dobbelt.
  const resten: Uint8Array<ArrayBuffer>[] = []
  for (let o = ihdrSlutt; o < b.length; ) {
    const n = new DataView(b.buffer).getUint32(o)
    const type = String.fromCharCode(...b.slice(o + 4, o + 8))
    if (!['pHYs', 'tEXt', 'iTXt', 'zTXt'].includes(type)) resten.push(b.slice(o, o + 12 + n))
    o += 12 + n
  }
  return new Blob([b.slice(0, ihdrSlutt), physBit(dpi), ...felter.map(([k, v]) => tekstbit(k, v)), ...resten], {
    type: 'image/png',
  })
}

/* --------------------------------------------------------------------- ico */

/**
 * favicon.ico med PNG-bilder inni (lovlig siden Windows Vista, og det alle
 * nettlesere leser). Seks byte hode, seksten per bilde, så bildene.
 */
export async function lagIco(bilder: { side: number; png: Blob }[]): Promise<Blob> {
  const data = await Promise.all(bilder.map(async (b) => new Uint8Array(await b.png.arrayBuffer())))
  const hode = new Uint8Array(6 + 16 * bilder.length)
  const dv = new DataView(hode.buffer)
  dv.setUint16(0, 0, true)
  dv.setUint16(2, 1, true) // 1 = ikon
  dv.setUint16(4, bilder.length, true)
  let offset = hode.length
  bilder.forEach((b, i) => {
    const o = 6 + i * 16
    hode[o] = b.side >= 256 ? 0 : b.side
    hode[o + 1] = b.side >= 256 ? 0 : b.side
    hode[o + 2] = 0 // ingen palett
    hode[o + 3] = 0
    dv.setUint16(o + 4, 1, true) // fargeplan
    dv.setUint16(o + 6, 32, true) // bit per piksel
    dv.setUint32(o + 8, data[i].length, true)
    dv.setUint32(o + 12, offset, true)
    offset += data[i].length
  })
  return new Blob([hode, ...data], { type: 'image/x-icon' })
}

/* -------------------------------------------------------------------- woff */

/**
 * Skriftfilen slik den var før den ble pakket til WOFF: hver tabell er
 * bare zlib-komprimert, så å pakke ut gir de samme bytene tilbake – en
 * vanlig .ttf (eller .otf) som kan installeres i Word og PowerPoint.
 */
export async function woffTilSfnt(woff: ArrayBuffer): Promise<{ data: Uint8Array<ArrayBuffer>; endelse: 'ttf' | 'otf' }> {
  const v = new DataView(woff)
  if (v.getUint32(0) !== 0x774f4646) throw new Error('Ikke en WOFF-fil')
  const smak = v.getUint32(4)
  const antall = v.getUint16(12)
  const tabeller: { tag: number; sjekk: number; data: Uint8Array<ArrayBuffer> }[] = []
  for (let i = 0; i < antall; i++) {
    const o = 44 + i * 20
    const [tag, offset, komp, orig, sjekk] = [0, 4, 8, 12, 16].map((k) => v.getUint32(o + k))
    const raa = new Uint8Array(woff, offset, komp)
    const data =
      komp < orig
        ? new Uint8Array(await new Response(new Blob([raa]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())
        : raa.slice()
    if (data.length !== orig) throw new Error('WOFF-tabellen har feil lengde')
    tabeller.push({ tag, sjekk, data })
  }
  let p = 1
  let e = 0
  while (p * 2 <= antall) {
    p *= 2
    e++
  }
  const hode = 12 + antall * 16
  const total = tabeller.reduce((s, t) => s + ((t.data.length + 3) & ~3), hode)
  const ut = new Uint8Array(total)
  const dv = new DataView(ut.buffer)
  dv.setUint32(0, smak)
  dv.setUint16(4, antall)
  dv.setUint16(6, p * 16)
  dv.setUint16(8, e)
  dv.setUint16(10, antall * 16 - p * 16)
  let o = hode
  tabeller.forEach((t, i) => {
    const r = 12 + i * 16
    dv.setUint32(r, t.tag)
    dv.setUint32(r + 4, t.sjekk)
    dv.setUint32(r + 8, o)
    dv.setUint32(r + 12, t.data.length)
    ut.set(t.data, o)
    o += (t.data.length + 3) & ~3
  })
  return { data: ut, endelse: smak === 0x4f54544f ? 'otf' : 'ttf' }
}

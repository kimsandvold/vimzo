/**
 * Adobe Swatch Exchange (.ase) – fargepaletten som en fil Illustrator,
 * Photoshop, InDesign og Affinity kan importere direkte.
 *
 * Formatet er lite og godt kjent: «ASEF», versjon 1.0, antall blokker, og så
 * blokkene. En gruppe åpnes (0xC001) og lukkes (0xC002), og hver farge
 * (0x0001) har navn i UTF-16 big-endian med null til slutt, fargemodell
 * («RGB ») og tre 32-bits flyttall mellom 0 og 1. Alt er big-endian.
 */

export interface Fargeprove {
  navn: string
  hex: string
}

const GRUPPE_START = 0xc001
const GRUPPE_SLUTT = 0xc002
const FARGE = 0x0001
/** Fargetypen: 0 global, 1 spot, 2 normal. Vi lager «global» – endres den, følger alt med. */
const GLOBAL = 0

/** Navnet som UTF-16BE med null til slutt, med lengden (i tegn, null medregnet) foran. */
function navnebytes(navn: string): Uint8Array {
  const enheter = [...navn].flatMap((t) => {
    const k = t.codePointAt(0)!
    if (k < 0x10000) return [k]
    const v = k - 0x10000
    return [0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff)]
  })
  const ut = new Uint8Array(2 + (enheter.length + 1) * 2)
  const dv = new DataView(ut.buffer)
  dv.setUint16(0, enheter.length + 1)
  enheter.forEach((e, i) => dv.setUint16(2 + i * 2, e))
  return ut
}

function blokk(type: number, data: Uint8Array): Uint8Array {
  const ut = new Uint8Array(6 + data.length)
  const dv = new DataView(ut.buffer)
  dv.setUint16(0, type)
  dv.setUint32(2, data.length)
  ut.set(data, 6)
  return ut
}

function fargeblokk(f: Fargeprove): Uint8Array {
  const navn = navnebytes(f.navn)
  const data = new Uint8Array(navn.length + 4 + 12 + 2)
  const dv = new DataView(data.buffer)
  data.set(navn, 0)
  let o = navn.length
  data.set([0x52, 0x47, 0x42, 0x20], o) // «RGB »
  o += 4
  for (const i of [1, 3, 5]) {
    dv.setFloat32(o, parseInt(f.hex.slice(i, i + 2), 16) / 255)
    o += 4
  }
  dv.setUint16(o, GLOBAL)
  return blokk(FARGE, data)
}

/** Hele filen: én gruppe med gruppenavnet, og fargene i den. */
export function lagAse(gruppe: string, farger: Fargeprove[]): Uint8Array<ArrayBuffer> {
  const blokker = [blokk(GRUPPE_START, navnebytes(gruppe)), ...farger.map(fargeblokk), blokk(GRUPPE_SLUTT, new Uint8Array(0))]
  const lengde = 12 + blokker.reduce((s, b) => s + b.length, 0)
  const ut = new Uint8Array(lengde)
  const dv = new DataView(ut.buffer)
  ut.set([0x41, 0x53, 0x45, 0x46], 0) // «ASEF»
  dv.setUint16(4, 1)
  dv.setUint16(6, 0)
  dv.setUint32(8, blokker.length)
  let o = 12
  for (const b of blokker) {
    ut.set(b, o)
    o += b.length
  }
  return ut
}

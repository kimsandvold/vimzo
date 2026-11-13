import { describe, expect, it } from 'vitest'
import { STARTSTEG, gaTil, skalVidere, videreFra, type Stegtilstand } from './kalkulatorSteg'

const N = 5

describe('gaTil', () => {
  it('går fram og tilbake, og husker hvor langt man har vært', () => {
    let t = gaTil(STARTSTEG, 1, N)
    expect(t).toEqual({ steg: 1, lengst: 1, retning: 1 })
    t = gaTil(t, 3, N)
    expect(t).toEqual({ steg: 3, lengst: 3, retning: 1 })
    t = gaTil(t, 0, N)
    expect(t).toEqual({ steg: 0, lengst: 3, retning: -1 })
  })

  it('klemmer utenfor rekken', () => {
    expect(gaTil(STARTSTEG, 9, N).steg).toBe(4)
    expect(gaTil(gaTil(STARTSTEG, 2, N), -3, N).steg).toBe(0)
  })

  it('samme steg gir samme tilstand', () => {
    const t = gaTil(STARTSTEG, 2, N)
    expect(gaTil(t, 2, N)).toBe(t)
  })
})

describe('skalVidere', () => {
  it('første gang et steg besvares: videre', () => {
    expect(skalVidere(STARTSTEG, 0, N)).toBe(true)
    expect(skalVidere(gaTil(STARTSTEG, 1, N), 1, N)).toBe(true)
  })

  it('tilbake for å endre bransje fra steg 4: blir stående', () => {
    const t = gaTil(gaTil(STARTSTEG, 4, N), 0, N)
    expect(skalVidere(t, 0, N)).toBe(false)
  })

  it('aldri videre fra siste steg, eller fra et steg som ikke vises', () => {
    const siste = gaTil(STARTSTEG, 4, N)
    expect(skalVidere(siste, 4, N)).toBe(false)
    expect(skalVidere(STARTSTEG, 1, N)).toBe(false)
  })
})

describe('videreFra', () => {
  it('fyrer når kunden står der den ble satt', () => {
    expect(videreFra(STARTSTEG, 0, N).steg).toBe(1)
  })

  it('kunden har selv gått videre før tidtakeren fyrte: ingen hopp tilbake', () => {
    // Valgte bransje (videre satt fra 0), trykket så «Innhold» (2) med en gang.
    const t: Stegtilstand = gaTil(STARTSTEG, 2, N)
    expect(videreFra(t, 0, N)).toBe(t)
  })

  it('kunden har gått tilbake før tidtakeren fyrte: blir der', () => {
    const t = gaTil(gaTil(STARTSTEG, 1, N), 0, N)
    expect(videreFra(t, 1, N)).toBe(t)
  })

  it('dobbel fyring flytter bare ett steg', () => {
    const en = videreFra(STARTSTEG, 0, N)
    expect(videreFra(en, 0, N)).toBe(en)
  })
})

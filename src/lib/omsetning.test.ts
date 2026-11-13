import { describe, expect, it } from 'vitest'
import { beregnOmsetningskrav, type Omsetningsgrunnlag } from './omsetning'
import { kronerTilOre } from './kroner'

function grunnlag(endringer: Partial<Omsetningsgrunnlag> = {}): Omsetningsgrunnlag {
  return {
    driftsform: 'enk',
    onsketInntekt: kronerTilOre(600_000),
    agaSone: '1',
    fasteKostnader: kronerTilOre(150_000),
    timepris: kronerTilOre(650),
    fakturerbarAndel: 65,
    arbeidsuker: 46,
    snittOppdrag: 0,
    ...endringer,
  }
}

describe('hvor mye må du fakturere', () => {
  const k = beregnOmsetningskrav(grunnlag())

  it('summerer lønn og faste kostnader til nødvendig omsetning', () => {
    expect(k.nodvendigOmsetning).toBe(kronerTilOre(750_000))
    expect(k.omsetningPerManed).toBe(kronerTilOre(62_500))
  })

  it('regner om til fakturerbare timer', () => {
    // 750 000 / 650
    expect(k.fakturerbareTimerPerAr).toBeCloseTo(1153.85, 2)
    expect(k.fakturerbareTimerPerManed).toBeCloseTo(96.15, 2)
    expect(k.fakturerbareTimerPerUke).toBeCloseTo(25.08, 2)
  })

  it('oversetter fakturerbare timer til faktisk arbeidstid', () => {
    // 1 153,85 / 0,65 = 1 775,15 arbeidstimer, fordelt på 46 uker
    expect(k.arbeidstimerPerUke).toBeCloseTo(38.59, 2)
  })

  it('sier ingenting om oppdrag før en snittpris er oppgitt', () => {
    expect(k.oppdragPerAr).toBeNull()
    expect(k.oppdragPerManed).toBeNull()
  })
})

describe('oppdrag', () => {
  it('regner om til antall oppdrag når snittprisen er kjent', () => {
    const k = beregnOmsetningskrav(grunnlag({ snittOppdrag: kronerTilOre(25_000) }))
    expect(k.oppdragPerAr).toBe(30)
    expect(k.oppdragPerManed).toBe(2.5)
  })
})

describe('aksjeselskap koster mer å fôre', () => {
  it('krever høyere omsetning for samme uttak', () => {
    const enk = beregnOmsetningskrav(grunnlag())
    const as = beregnOmsetningskrav(grunnlag({ driftsform: 'as' }))
    expect(as.nodvendigOmsetning).toBeGreaterThan(enk.nodvendigOmsetning)
    // 780 444 i lønnskostnad + 150 000 i faste kostnader
    expect(as.nodvendigOmsetning).toBe(kronerTilOre(930_444))
  })
})

describe('nulltilfeller', () => {
  it('gir null i stedet for Infinity når timeprisen er null', () => {
    const k = beregnOmsetningskrav(grunnlag({ timepris: 0 }))
    expect(k.fakturerbareTimerPerAr).toBeNull()
    expect(k.arbeidstimerPerUke).toBeNull()
  })

  it('gir null arbeidstid når ingenting er fakturerbart', () => {
    expect(beregnOmsetningskrav(grunnlag({ fakturerbarAndel: 0 })).arbeidstimerPerUke).toBeNull()
  })

  it('deler aldri på null uker', () => {
    expect(Number.isFinite(beregnOmsetningskrav(grunnlag({ arbeidsuker: 0 })).arbeidstimerPerUke!)).toBe(true)
  })
})

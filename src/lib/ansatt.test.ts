import { describe, expect, it } from 'vitest'
import { beregnAnsattkostnad, type Ansattgrunnlag } from './ansatt'
import { kronerTilOre } from './kroner'

/**
 * Tallene er regnet for hånd. Avviker koden, er det koden som tar feil.
 * Endrer noen en sats i `data/timepris.ts`, skal disse testene feile – det er
 * meningen, for da må tallene godkjennes på nytt.
 */

function grunnlag(endringer: Partial<Ansattgrunnlag> = {}): Ansattgrunnlag {
  return {
    bruttolonn: kronerTilOre(600_000),
    agaSone: '1',
    feriepengesats: 12,
    pensjonssats: 2,
    andreKostnader: kronerTilOre(50_000),
    arbeidstimer: 1750,
    fakturerbarAndel: 70,
    ...endringer,
  }
}

describe('hva en ansatt koster', () => {
  const k = beregnAnsattkostnad(grunnlag())

  it('legger 12 % feriepenger på lønnen', () => {
    expect(k.feriepenger).toBe(kronerTilOre(72_000))
  })

  it('setter pensjonen til 2 % av lønnen', () => {
    expect(k.pensjon).toBe(kronerTilOre(12_000))
  })

  it('regner arbeidsgiveravgift av lønn, feriepenger og pensjon', () => {
    // 14,1 % av 684 000
    expect(k.arbeidsgiveravgift).toBe(kronerTilOre(96_444))
  })

  it('kommer fram til 830 444 kroner i året', () => {
    // 600 000 + 72 000 + 96 444 + 12 000 + 50 000
    expect(k.sumPerAr).toBe(kronerTilOre(830_444))
    expect(k.sumPerManed).toBe(kronerTilOre(69_203.67))
  })

  it('gir en faktor på 1,38 – ansatte koster 38 % mer enn lønnen', () => {
    expect(k.faktor).toBeCloseTo(1.384, 3)
  })

  it('fordeler kostnaden på arbeidstimene', () => {
    // 830 444 / 1 750
    expect(k.kostnadPerArbeidstime).toBe(47_454)
  })

  it('sier hva den ansatte må fakturere for å bære seg selv', () => {
    // 1 750 × 70 % = 1 225 fakturerbare timer. 830 444 / 1 225
    expect(k.fakturerbareTimer).toBe(1225)
    expect(k.nullpunktTimepris).toBe(67_791)
  })
})

describe('sone og satser slår gjennom', () => {
  it('fjerner arbeidsgiveravgiften i sone 5', () => {
    const k = beregnAnsattkostnad(grunnlag({ agaSone: '5' }))
    expect(k.arbeidsgiveravgift).toBe(0)
    expect(k.sumPerAr).toBe(kronerTilOre(734_000))
  })

  it('tar hensyn til lavere feriepengesats', () => {
    const k = beregnAnsattkostnad(grunnlag({ feriepengesats: 10.2 }))
    expect(k.feriepenger).toBe(kronerTilOre(61_200))
  })

  it('tar hensyn til høyere pensjonssats', () => {
    const k = beregnAnsattkostnad(grunnlag({ pensjonssats: 5 }))
    expect(k.pensjon).toBe(kronerTilOre(30_000))
  })
})

describe('nulltilfeller', () => {
  it('gir null i stedet for Infinity når ingen timer er fakturerbare', () => {
    const k = beregnAnsattkostnad(grunnlag({ fakturerbarAndel: 0 }))
    expect(k.nullpunktTimepris).toBeNull()
    expect(k.fakturerbareTimer).toBe(0)
  })

  it('gir null når den ansatte ikke har arbeidstimer', () => {
    expect(beregnAnsattkostnad(grunnlag({ arbeidstimer: 0 })).kostnadPerArbeidstime).toBeNull()
  })

  it('tåler lønn på null uten å dele på null', () => {
    expect(beregnAnsattkostnad(grunnlag({ bruttolonn: 0 })).faktor).toBe(0)
  })
})

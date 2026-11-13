import { describe, expect, it } from 'vitest'
import { beregnKalkyle, beregnLonnskostnad, type FasteKostnader, type Grunnlag } from './timepris'
import { kronerTilOre, rundOppTilTier } from './kroner'

/**
 * Testvektorene fra spesifikasjonen.
 *
 * Tallene er regnet for hånd. Avviker koden fra dem, er det koden som tar
 * feil – ikke testen. Endrer noen en sats i `satser.ts`, skal AS-vektoren
 * feile, og det er meningen: da må tallet regnes om og godkjennes på nytt.
 */

const INGEN_KOSTNADER: FasteKostnader = {
  lokale: 0,
  forsikring: 0,
  verktoy: 0,
  transport: 0,
  regnskap: 0,
  kontor: 0,
  annet: 0,
}

function grunnlag(endringer: Partial<Grunnlag> = {}): Grunnlag {
  return {
    driftsform: 'enk',
    onsketInntekt: kronerTilOre(600_000),
    agaSone: '1',
    fasteKostnader: { ...INGEN_KOSTNADER, annet: kronerTilOre(120_000) },
    arbeidsuker: 46,
    timerPerUke: 40,
    fakturerbarAndel: 65,
    buffer: 15,
    dagensTimepris: null,
    ...endringer,
  }
}

describe('vektor 1 – enkeltpersonforetak', () => {
  const k = beregnKalkyle(grunnlag())

  it('regner ut arbeidstimer og fakturerbare timer', () => {
    expect(k.arbeidstimer).toBe(1840)
    expect(k.fakturerbareTimer).toBe(1196)
  })

  it('legger ingenting på inntekten for ENK', () => {
    expect(k.lonnskostnad.sum).toBe(kronerTilOre(600_000))
    expect(k.lonnskostnad.arbeidsgiveravgift).toBe(0)
  })

  it('kommer fram til 720 000 i nødvendig dekning', () => {
    expect(k.nodvendigDekning).toBe(kronerTilOre(720_000))
  })

  it('gir 602,01 kr som minste timepris', () => {
    expect(k.minsteTimepris).toBe(60_201)
  })

  it('gir 692,31 kr anbefalt, avrundet til 700 kr', () => {
    expect(k.anbefaltTimepris).toBe(69_231)
    expect(k.anbefaltAvrundet).toBe(kronerTilOre(700))
  })

  it('sier at timeprisen må være 54 % høyere enn arbeidstimene tilsier', () => {
    expect(k.pastandOmUbetaltTid).toBe(54)
  })

  it('regner omsetningen av den avrundede prisen, så kvitteringen går opp', () => {
    // 700 kr × 1 196 timer. Ganger brukeren opp det store tallet selv, skal
    // hen få nøyaktig dette – ikke et tall regnet av 692,31.
    expect(k.omsetningPerAr).toBe(kronerTilOre(837_200))
    expect(k.omsetningPerManed).toBe(kronerTilOre(69_766.67))
  })
})

describe('vektor 2 – alt er fakturerbart', () => {
  const k = beregnKalkyle(grunnlag({ fakturerbarAndel: 100 }))

  it('har like mange fakturerbare timer som arbeidstimer', () => {
    expect(k.fakturerbareTimer).toBe(1840)
  })

  it('gir 391,30 kr som minste timepris', () => {
    expect(k.minsteTimepris).toBe(39_130)
  })

  it('har ingen påstand om ubetalt tid å komme med', () => {
    expect(k.pastandOmUbetaltTid).toBeNull()
  })
})

describe('vektor 3 – aksjeselskap', () => {
  const k = beregnKalkyle(grunnlag({ driftsform: 'as' }))

  it('legger feriepenger, arbeidsgiveravgift og pensjon på lønnen', () => {
    expect(k.lonnskostnad.feriepenger).toBe(kronerTilOre(72_000))
    expect(k.lonnskostnad.pensjon).toBe(kronerTilOre(12_000))
    // 14,1 % av (600 000 + 72 000 + 12 000)
    expect(k.lonnskostnad.arbeidsgiveravgift).toBe(kronerTilOre(96_444))
    expect(k.lonnskostnad.sum).toBe(kronerTilOre(780_444))
  })

  it('gir 752,88 kr som minste timepris – 151 kr mer enn de samme tallene som ENK', () => {
    expect(k.minsteTimepris).toBe(75_288)
  })

  it('gir 865,81 kr anbefalt, avrundet til 870 kr', () => {
    expect(k.anbefaltTimepris).toBe(86_581)
    expect(k.anbefaltAvrundet).toBe(kronerTilOre(870))
  })

  it('regner arbeidsgiveravgift av feriepenger og pensjon, ikke bare av lønn', () => {
    // 14,1 % av 684 000, ikke av 600 000. Forskjellen er 11 844 kr i året.
    const bareAvLonn = Math.round((kronerTilOre(600_000) * 14.1) / 100)
    expect(k.lonnskostnad.arbeidsgiveravgift - bareAvLonn).toBe(kronerTilOre(11_844))
  })

  it('følger sonen, så sone 5 ikke får arbeidsgiveravgift', () => {
    const sone5 = beregnLonnskostnad('as', kronerTilOre(600_000), '5')
    expect(sone5.arbeidsgiveravgift).toBe(0)
  })
})

describe('vektor 4 – nulltilfeller', () => {
  it('gir null, ikke Infinity, når ingen timer er fakturerbare', () => {
    const k = beregnKalkyle(grunnlag({ fakturerbarAndel: 0 }))
    expect(k.fakturerbareTimer).toBe(0)
    expect(k.minsteTimepris).toBeNull()
    expect(k.anbefaltTimepris).toBeNull()
    expect(k.anbefaltAvrundet).toBeNull()
    expect(k.omsetningPerAr).toBeNull()
  })

  it('gir null når brukeren ikke jobber noen uker', () => {
    expect(beregnKalkyle(grunnlag({ arbeidsuker: 0 })).minsteTimepris).toBeNull()
  })

  it('tåler at alt er null', () => {
    const k = beregnKalkyle(
      grunnlag({ onsketInntekt: 0, fasteKostnader: INGEN_KOSTNADER, buffer: 0 }),
    )
    expect(k.nodvendigDekning).toBe(0)
    expect(k.minsteTimepris).toBe(0)
  })

  it('uten buffer er anbefalt og minste timepris det samme', () => {
    const k = beregnKalkyle(grunnlag({ buffer: 0 }))
    expect(k.anbefaltTimepris).toBe(k.minsteTimepris)
  })
})

describe('avviket fra dagens timepris', () => {
  it('sier fra når brukeren tar for lite', () => {
    const k = beregnKalkyle(grunnlag({ dagensTimepris: kronerTilOre(550) }))
    expect(k.avvik?.tarForLite).toBe(true)
    expect(k.avvik?.perTime).toBe(kronerTilOre(150))
    // 150 kr × 1 196 timer = 179 400 kr i året.
    expect(k.avvik?.perAr).toBe(kronerTilOre(179_400))
  })

  it('sier fra når brukeren tar mer enn nok', () => {
    const k = beregnKalkyle(grunnlag({ dagensTimepris: kronerTilOre(900) }))
    expect(k.avvik?.tarForLite).toBe(false)
    expect(k.avvik?.perTime).toBe(kronerTilOre(-200))
  })

  it('sier ingenting når feltet står tomt', () => {
    expect(beregnKalkyle(grunnlag()).avvik).toBeNull()
  })
})

describe('avrundingsregelen', () => {
  it('runder opp, aldri ned', () => {
    expect(rundOppTilTier(kronerTilOre(692.31))).toBe(kronerTilOre(700))
    expect(rundOppTilTier(kronerTilOre(700))).toBe(kronerTilOre(700))
    expect(rundOppTilTier(kronerTilOre(700.01))).toBe(kronerTilOre(710))
  })
})

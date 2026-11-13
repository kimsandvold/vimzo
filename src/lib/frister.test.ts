import { describe, expect, it } from 'vitest'
import { erVirkedag, fristerFor, nesteVirkedag, paskedag, type Profil } from './frister'

/**
 * Datoene er sjekket for hånd mot kalenderen for 2027 (påske 28. mars,
 * 2. pinsedag 17. mai) og mot fristene Skatteetaten og andre oppga for 2026.
 * Feiler en test, er det koden som tar feil – ikke testen.
 */

const ENK: Profil = { form: 'enk', mva: 'tomaaned', lonn: false, lonningsdag: 20 }
const AS: Profil = { form: 'as', mva: 'tomaaned', lonn: true, lonningsdag: 20 }

function datoer(profil: Profil, tittel: string, ar = 2027): string[] {
  return fristerFor(profil, `${ar}-01-01`, `${ar}-12-31`)
    .filter((f) => f.tittel === tittel)
    .map((f) => f.dato)
}

describe('påske og helligdager', () => {
  it('finner første påskedag', () => {
    expect(paskedag(2024)).toBe('2024-03-31')
    expect(paskedag(2025)).toBe('2025-04-20')
    expect(paskedag(2026)).toBe('2026-04-05')
    expect(paskedag(2027)).toBe('2027-03-28')
  })

  it('kjenner virkedager', () => {
    expect(erVirkedag('2027-03-25')).toBe(false) // skjærtorsdag
    expect(erVirkedag('2027-03-26')).toBe(false) // langfredag
    expect(erVirkedag('2027-03-29')).toBe(false) // 2. påskedag
    expect(erVirkedag('2027-05-06')).toBe(false) // Kristi himmelfart
    expect(erVirkedag('2027-05-17')).toBe(false) // 17. mai og 2. pinsedag
    expect(erVirkedag('2027-12-24')).toBe(true) // julaften er virkedag
    expect(erVirkedag('2027-03-24')).toBe(true)
  })

  it('flytter til neste virkedag', () => {
    expect(nesteVirkedag('2027-05-15')).toBe('2027-05-18') // lør → (søn, 17. mai) → tir
    expect(nesteVirkedag('2027-03-25')).toBe('2027-03-30')
    expect(nesteVirkedag('2027-03-24')).toBe('2027-03-24')
  })
})

describe('kjente frister fra 2026', () => {
  it('aksjonærregisteroppgaven 31. januar 2026 (lørdag) ble 2. februar', () => {
    expect(datoer(AS, 'Aksjonærregisteroppgaven', 2026)).toEqual(['2026-02-02'])
  })

  it('skattemeldingen 31. mai 2026 (søndag) ble 1. juni', () => {
    expect(datoer(ENK, 'Skattemelding for næringsdrivende', 2026)).toEqual(['2026-06-01'])
  })
})

describe('mva', () => {
  it('tomånedlig termin i 2027', () => {
    expect(datoer(ENK, 'Mva-melding')).toEqual([
      '2027-02-10',
      '2027-04-12', // 10. april er lørdag
      '2027-06-10',
      '2027-08-31',
      '2027-10-11', // 10. oktober er søndag
      '2027-12-10',
    ])
  })

  it('årstermin', () => {
    expect(datoer({ ...ENK, mva: 'aar' }, 'Mva-melding for hele året')).toEqual(['2027-03-10'])
    expect(datoer({ ...ENK, mva: 'aar' }, 'Mva-melding')).toEqual([])
  })

  it('ingen mva-frister uten mva-registrering', () => {
    const alle = fristerFor({ ...ENK, mva: 'ingen' }, '2027-01-01', '2027-12-31')
    expect(alle.filter((f) => f.kategori === 'mva')).toEqual([])
  })
})

describe('lønn', () => {
  it('ingen lønnsfrister når bedriften ikke betaler lønn', () => {
    const alle = fristerFor(ENK, '2027-01-01', '2027-12-31')
    expect(alle.filter((f) => f.kategori === 'lonn')).toEqual([])
  })

  it('a-melding den 5., flyttet ved helg', () => {
    const d = datoer(AS, 'A-melding')
    expect(d).toHaveLength(12)
    expect(d[5]).toBe('2027-06-07') // 5. juni er lørdag
    expect(d[8]).toBe('2027-09-06') // 5. september er søndag
    expect(d[11]).toBe('2027-12-06')
  })

  it('arbeidsgiveravgift annenhver måned', () => {
    expect(datoer(AS, 'Arbeidsgiveravgift')).toEqual([
      '2027-01-15',
      '2027-03-15',
      '2027-05-18', // lør 15. → søn → 17. mai/2. pinsedag → tir
      '2027-07-15',
      '2027-09-15',
      '2027-11-15',
    ])
  })

  it('forskuddstrekk første virkedag etter lønningsdag', () => {
    const d = datoer(AS, 'Forskuddstrekk')
    expect(d[2]).toBe('2027-03-22') // lønn 20. mars (lør) går ut fre 19. → man 22.
    expect(d[3]).toBe('2027-04-21')
  })

  it('lønningsdag i påsken', () => {
    const d = datoer({ ...AS, lonningsdag: 25 }, 'Forskuddstrekk')
    // 25. mars er skjærtorsdag: lønn ut ons 24., neste virkedag er tir 30.
    expect(d[2]).toBe('2027-03-30')
    // 25. desember: lønn ut fre 24., neste virkedag er man 27.
    expect(d[11]).toBe('2027-12-27')
  })

  it('lønningsdag 31 i februar blir siste dag i måneden', () => {
    const d = datoer({ ...AS, lonningsdag: 31 }, 'Forskuddstrekk')
    // 28. februar er søndag: lønn ut fre 26., trekk man 1. mars
    expect(d[1]).toBe('2027-03-01')
  })
})

describe('skatt og årsoppgjør', () => {
  it('forskuddsskatt for ENK fire ganger i året', () => {
    expect(datoer(ENK, 'Forskuddsskatt')).toEqual(['2027-03-15', '2027-06-15', '2027-09-15', '2027-12-15'])
  })

  it('forskuddsskatt for AS to ganger, året etter', () => {
    expect(datoer(AS, 'Forskuddsskatt for selskapet')).toEqual(['2027-02-15', '2027-04-15'])
  })

  it('AS-frister i 2027', () => {
    expect(datoer(AS, 'Aksjonærregisteroppgaven')).toEqual(['2027-02-01']) // 31. jan er søndag
    expect(datoer(AS, 'Skattemelding for selskapet')).toEqual(['2027-05-31'])
    expect(datoer(AS, 'Ordinær generalforsamling')).toEqual(['2027-06-30'])
    // 31. juli er lørdag, men vi flytter ikke det vi ikke har bekreftet.
    expect(datoer(AS, 'Årsregnskap til Brønnøysund')).toEqual(['2027-07-31'])
  })

  it('ENK har ingen AS-frister', () => {
    const titler = fristerFor(ENK, '2027-01-01', '2027-12-31').map((f) => f.tittel)
    expect(titler).not.toContain('Aksjonærregisteroppgaven')
    expect(titler).not.toContain('Årsregnskap til Brønnøysund')
  })
})

describe('periode', () => {
  it('tar med frister over årsskiftet, sortert', () => {
    const alle = fristerFor(AS, '2026-11-13', '2027-11-13')
    expect(alle[0].dato >= '2026-11-13').toBe(true)
    expect(alle.at(-1)!.dato <= '2027-11-13').toBe(true)
    const sortert = [...alle].sort((a, b) => a.dato.localeCompare(b.dato))
    expect(alle.map((f) => f.dato)).toEqual(sortert.map((f) => f.dato))
  })

  it('id-ene er unike', () => {
    const alle = fristerFor(AS, '2026-01-01', '2028-12-31')
    expect(new Set(alle.map((f) => f.id)).size).toBe(alle.length)
  })
})

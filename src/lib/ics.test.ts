import { describe, expect, it } from 'vitest'
import { lagIcs } from './ics'
import { fristerFor } from './frister'

describe('kalenderfil', () => {
  const frister = fristerFor({ form: 'as', mva: 'tomaaned', lonn: true, lonningsdag: 20 }, '2027-01-01', '2027-12-31')
  const ics = lagIcs(frister, 'Test, AS; med tegn', new Date('2026-11-13T12:00:00Z'))
  const linjer = ics.split('\r\n')

  it('har én hendelse per frist, som heldag', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(frister.length)
    expect(ics).toContain('DTSTART;VALUE=DATE:20270412')
    expect(ics).toContain('DTEND;VALUE=DATE:20270413')
  })

  it('escaper komma og semikolon', () => {
    expect(ics).toContain('X-WR-CALNAME:Frister – Test\\, AS\\; med tegn')
  })

  it('bretter linjer over 75 byte', () => {
    const enc = new TextEncoder()
    for (const l of linjer) expect(enc.encode(l).length).toBeLessThanOrEqual(75)
  })

  it('bruker CRLF og slutter riktig', () => {
    expect(linjer[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})

import type { Frist } from './frister'

/**
 * Kalenderfil (iCalendar, RFC 5545) for fristene.
 *
 * Heldagshendelser, ikke klokkeslett: en frist er en dato, og en hendelse kl.
 * 00:00 UTC havner på feil dag i halve verden. Hver hendelse har et varsel
 * tre dager før kl. 09, så det er tid til å gjøre noe med den.
 *
 * UID-en er fristens id pluss domenet. Importerer noen fila på nytt etter en
 * oppdatering, erstatter kalenderen de gamle hendelsene i stedet for å
 * legge inn dobbelt.
 */

function escape(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Linjer over 75 byte skal brytes, med mellomrom først på fortsettelseslinjen. */
function brett(linje: string): string {
  const bytes = new TextEncoder()
  if (bytes.encode(linje).length <= 75) return linje
  const deler: string[] = []
  let gjeldende = ''
  for (const tegn of linje) {
    const grense = deler.length === 0 ? 75 : 74
    if (bytes.encode(gjeldende + tegn).length > grense) {
      deler.push(gjeldende)
      gjeldende = tegn
    } else {
      gjeldende += tegn
    }
  }
  deler.push(gjeldende)
  return deler.join('\r\n ')
}

const kompakt = (dato: string) => dato.replace(/-/g, '')

function dagenEtter(dato: string): string {
  const [a, m, d] = dato.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10)
}

export function lagIcs(frister: readonly Frist[], navn: string, stempel = new Date()): string {
  const dtstamp = stempel.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const linjer = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vimzo//Fristkalender//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(`Frister – ${navn}`)}`,
    'X-WR-TIMEZONE:Europe/Oslo',
  ]

  for (const f of frister) {
    const beskrivelse = `${f.hva}\n\n${f.lenke}\n\nFra fristkalenderen på vimzo.no/frister`
    linjer.push(
      'BEGIN:VEVENT',
      `UID:${f.id}@vimzo.no`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${kompakt(f.dato)}`,
      `DTEND;VALUE=DATE:${kompakt(dagenEtter(f.dato))}`,
      `SUMMARY:${escape(`Frist: ${f.tittel}`)}`,
      `DESCRIPTION:${escape(beskrivelse)}`,
      `URL:${f.lenke}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(`${f.tittel} om tre dager`)}`,
      // Heldag starter 00:00; −P2DT15H er kl. 09 tre dager før.
      'TRIGGER:-P2DT15H',
      'END:VALARM',
      'END:VEVENT',
    )
  }

  linjer.push('END:VCALENDAR')
  return linjer.map(brett).join('\r\n') + '\r\n'
}

/** Lager fila og starter nedlastingen i nettleseren. */
export function lastNedIcs(frister: readonly Frist[], navn: string): void {
  const blob = new Blob([lagIcs(frister, navn)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `frister-${navn.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '') || 'bedrift'}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

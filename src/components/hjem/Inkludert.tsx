import styled from 'styled-components'
import { Innsig, Seksjon, Stikkord, Tittel, Wrap } from '../../ui'

/**
 * «Alt er inkludert» som et stort, skjevt ordfelt.
 *
 * Grepet er at mengden ord ER argumentet. Ingen ikoner, ingen kort, ingen
 * forklaringer – bare ti ting, satt så stort at de leses på et halvt sekund
 * fra en telefon. Ordene får ulik grad slik at feltet leser som en sky av
 * ting du slipper, ikke som en kravspesifikasjon.
 */
const ALT = [
  { ord: 'Domene', vekt: 2 },
  { ord: 'Tekster', vekt: 3 },
  { ord: 'Bilder', vekt: 2 },
  { ord: 'Dronefoto', vekt: 1 },
  { ord: 'Design', vekt: 3 },
  { ord: 'E-post', vekt: 1 },
  { ord: 'Google', vekt: 2 },
  { ord: 'Kart', vekt: 1 },
  { ord: 'Skjema', vekt: 1 },
  { ord: 'Drift', vekt: 2 },
] as const

export default function Inkludert() {
  return (
    <Seksjon $flate="surface" id="inkludert">
      <Wrap>
        <Innsig>
          <Topp>
            <Stikkord>Alt inkludert</Stikkord>
            <Tittel>Du trenger ikke skaffe noe.</Tittel>
          </Topp>
        </Innsig>

        <Innsig forsinkelse={90}>
          <Ordfelt>
            {ALT.map((a) => (
              <Ord key={a.ord} $vekt={a.vekt}>
                {a.ord}
              </Ord>
            ))}
          </Ordfelt>
        </Innsig>

        <Innsig forsinkelse={160}>
          <Fot>
            <Tall>2 timer</Tall>
            <span>er alt du bidrar med. Én prat, én gjennomlesing.</span>
          </Fot>
        </Innsig>
      </Wrap>
    </Seksjon>
  )
}

const Topp = styled.div`
  margin-bottom: clamp(2rem, 4vw, 3rem);
`

const Ordfelt = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em 0.75em;
  list-style: none;
`

/** Tre grader. De tyngste ordene er de som koster kunden mest å skaffe selv. */
const Ord = styled.li<{ $vekt: number }>`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  letter-spacing: -0.012em;
  line-height: 1.05;
  font-size: ${({ $vekt }) =>
    $vekt === 3 ? 'clamp(2rem, 5.2vw, 3.6rem)' : $vekt === 2 ? 'clamp(1.6rem, 4vw, 2.8rem)' : 'clamp(1.3rem, 3vw, 2.1rem)'};
  color: ${({ theme, $vekt }) => ($vekt === 3 ? theme.colors.accent : $vekt === 2 ? theme.colors.ink : theme.colors.neutral[400])};
`

const Fot = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Tall = styled.strong`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.1em;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.ink};
`

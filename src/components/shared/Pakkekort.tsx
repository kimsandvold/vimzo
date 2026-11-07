import styled from 'styled-components'
import Belop, { Ramme } from './Belop'
import Icon from './Icon'
import { Knapp } from '../../ui'
import { ANTALL_AVDRAG, avdragRamme, drift, eieOver, type Pakke } from '../../data/pakker'

/**
 * Et typisk prosjekt på prissiden.
 *
 * Kortet viser et spenn, ikke en pris: der de fleste prosjekter av denne
 * typen lander. Under står det som oftest flytter tallet, så kunden ser
 * hvorfor prisen blir hans egen – og hva han kan påvirke selv.
 */
export default function Pakkekort({ pakke }: { pakke: Pakke }) {
  return (
    <Kort id={pakke.id}>
      <Navn>{pakke.navn}</Navn>
      <For>{pakke.for}</For>

      <Pris>
        <strong>
          <Ramme verdi={pakke.pris} />
        </strong>
        <span>kr</span>
      </Pris>
      {pakke.driftInkludertMnd ? (
        <>
          <Samlet>Typisk spenn · klar på 1–2 uker</Samlet>
          <Deretter>
            <strong>{pakke.driftInkludertMnd} måneders drift</strong> er med i prisen.
          </Deretter>
        </>
      ) : (
        <>
          <Samlet>
            Typisk spenn · kan deles over {ANTALL_AVDRAG} mnd: <Ramme verdi={avdragRamme(pakke.pris)} /> kr/mnd
          </Samlet>
          <Deretter>
            Drift etterpå <strong><Belop verdi={drift.pris} /> kr/mnd</strong>. Å eie siden i tre år:{' '}
            <strong><Ramme verdi={eieOver(pakke.pris)} /> kr</strong>
          </Deretter>
        </>
      )}

      <Fakta>
        <span>{pakke.omfang}</span>
        {!pakke.driftInkludertMnd && <span>Leveringsdato avtales i tilbudet</span>}
      </Fakta>

      <Punkter>
        {pakke.punkter.map((p) => (
          <li key={p}>
            <Icon navn="sjekk" storrelse={14} tykkelse={2.6} />
            {p}
          </li>
        ))}
      </Punkter>

      <Drivere>
        <h4>Dette flytter prisen</h4>
        <ul>
          {pakke.drivere.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Drivere>

      <Bunn>
        <Knapp til={pakke.driftInkludertMnd ? '/arrangement' : '/kontakt'} variant="myk">
          {pakke.driftInkludertMnd ? 'Les mer om arrangementssider' : 'Ta en prat om dette'}
        </Knapp>
      </Bunn>
    </Kort>
  )
}

const Kort = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 7rem;
`


const Navn = styled.h3`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 650;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const For = styled.p`
  margin-top: 0.4rem;
  font-size: 0.925rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
  min-height: 3em;
`

const Pris = styled.p`
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-top: 1.25rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(1.6rem, 2.4vw, 2.1rem);
    font-weight: 500;
    letter-spacing: -0.05em;
  }

  /* Direkte barn – ellers arver <Belop> sine spans denne graden. */
  > span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

/** Driften og treårstotalen – det siden koster å ha, ikke bare å lage. */
const Deretter = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.accent};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    letter-spacing: -0.03em;
  }
`


const Samlet = styled.p`
  margin-top: 0.35rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSubtle};

  b {
    font-weight: 650;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Fakta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin: 1.25rem 0;
  padding: 0.75rem 0;
  box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.neutral[200]}, inset 0 -1px 0 ${({ theme }) => theme.colors.neutral[200]};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Punkter = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.75rem;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.925rem;
    font-weight: 500;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Bunn = styled.div`
  margin-top: auto;
  a { width: 100%; }
`

/** Hva som flytter tallet. Det er her «skreddersøm» blir konkret. */
const Drivere = styled.div`
  margin-bottom: 1.75rem;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};

  h4 {
    margin: 0 0 0.4rem;
    font-size: 0.8125rem;
    font-weight: 650;
    color: ${({ theme }) => theme.colors.ink};
  }

  ul {
    margin: 0;
    padding-left: 1.1rem;
  }

  li {
    font-size: 0.875rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

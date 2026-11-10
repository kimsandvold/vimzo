import styled from 'styled-components'
import Belop, { Ramme } from './Belop'
import Icon from './Icon'
import { Knapp } from '../../ui'
import { ANTALL_AVDRAG, avdragRamme, drift, type Pakke } from '../../data/pakker'

/**
 * Et typisk prosjekt på prissiden.
 *
 * Kortet viser et spenn, ikke en pris: der de fleste prosjekter av denne
 * typen lander. Det hadde tre linjer småtall under prisen og en grå boks
 * om hva som flytter den – men det står samlet lenger ned på siden, og i
 * kortet ble det støy. Nå: navn, pris, én linje om betaling, hva som er med.
 */
export default function Pakkekort({ pakke }: { pakke: Pakke }) {
  return (
    <Kort id={pakke.id}>
      <Navn>
        {pakke.navn} <span>· {pakke.omfang}</span>
      </Navn>
      <For>{pakke.for}</For>

      <Pris>
        <strong>
          <Ramme verdi={pakke.pris} />
        </strong>
        <span>kr</span>
      </Pris>
      <Samlet>
        {pakke.driftInkludertMnd ? (
          <>Klar på 1–2 uker · {pakke.driftInkludertMnd} måneders drift med i prisen</>
        ) : (
          <>
            Eller <Ramme verdi={avdragRamme(pakke.pris)} /> kr/mnd i {ANTALL_AVDRAG} mnd · drift{' '}
            <Belop verdi={drift.pris} /> kr/mnd
          </>
        )}
      </Samlet>

      <Punkter>
        {pakke.punkter.map((p) => (
          <li key={p}>
            <Icon navn="sjekk" storrelse={14} tykkelse={2.6} />
            {p}
          </li>
        ))}
      </Punkter>

      <Bunn>
        <Knapp til={pakke.driftInkludertMnd ? '/arrangement' : `/kontakt?pakke=${pakke.id}`} variant="myk">
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


const Navn = styled.h2`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: var(--fs-lead);
  font-weight: 600;
  letter-spacing: var(--ls-lead);
  color: ${({ theme }) => theme.colors.ink};

  span {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const For = styled.p`
  margin-top: 0.4rem;
  font-size: var(--fs-body);
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
    font-size: var(--fs-title);
    font-weight: 500;
    letter-spacing: var(--ls-title);
  }

  /* Direkte barn – ellers arver <Belop> sine spans denne graden. */
  > span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`


const Samlet = styled.p`
  margin-top: 0.35rem;
  font-size: var(--fs-small);
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSubtle};

  b {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Punkter = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 1.5rem 0 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--fs-body);
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


import styled from 'styled-components'
import { Knapp, Wrap } from '../../ui'

/**
 * Siste skjerm før foten. Én setning, sentrert, og to veier videre.
 *
 * Den var mørk med en lilla glød under, og sammen med en mørk fot ble
 * bunnen av siden en tung, svart blokk. Nå er den lys og stille – det er
 * setningen som skal bære, ikke flaten.
 */
export default function Avslutt({
  tittel = 'Skal vi lage den?',
  tekst = '30 minutter på telefon. Skriftlig tilbud etterpå. Ingen forpliktelser.',
  til = '/kontakt',
}: {
  tittel?: string
  tekst?: string
  /** Hvor «Ta en prat» går – med forhåndsvalg når siden vet hva det gjelder. */
  til?: string
}) {
  return (
    <Flate>
      <Wrap>
        <Innhold>
          <h2>{tittel}</h2>
          <p>{tekst}</p>
          <Knapper>
            <Knapp til={til} variant="aksent" stor>
              Ta en prat
            </Knapp>
            <Knapp til="/priser" variant="myk" stor>
              Se prisene
            </Knapp>
          </Knapper>
        </Innhold>
      </Wrap>
    </Flate>
  )
}

const Flate = styled.section`
  padding: clamp(6rem, 12vw, 10rem) 0;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  text-align: center;
`

const Innhold = styled.div`
  max-width: 52rem;
  margin: 0 auto;

  h2 {
    margin: 0;
    font-size: var(--fs-heading);
    font-weight: 600;
    line-height: 1.04;
    letter-spacing: var(--ls-heading);
  }

  p {
    margin-top: 1rem;
    font-size: var(--fs-lead);
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Knapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    flex-direction: column;

    > * {
      width: 100%;
    }
  }
`

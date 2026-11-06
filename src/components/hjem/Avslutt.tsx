import styled from 'styled-components'
import { Knapp, Wrap } from '../../ui'
import { epost } from '../../data/firma'

/**
 * Siste skjerm før foten. Én stor setning, to veier videre.
 *
 * Den deler flate med foten, så bunnen av siden leser som ett mørkt felt i
 * stedet for to – det er roligere, og det gjør at avslutningen får bære
 * tyngden alene.
 */
export default function Avslutt({
  tittel = 'Skal vi lage den?',
  tekst = '30 minutter på telefon. Skriftlig tilbud etterpå. Ingen forpliktelser.',
}: {
  tittel?: string
  tekst?: string
}) {
  return (
    <Flate data-surface="dark">
      <Sky aria-hidden="true" />
      <Wrap>
        <Innhold>
          <h2>{tittel}</h2>
          <p>{tekst}</p>
          <Knapper>
            <Knapp til="/kontakt" variant="hvit" stor>
              Få et tilbud
            </Knapp>
            <Knapp href={`mailto:${epost()}`} variant="glass" stor>
              {epost()}
            </Knapp>
          </Knapper>
        </Innhold>
      </Wrap>
    </Flate>
  )
}

const Flate = styled.section`
  position: relative;
  overflow: hidden;
  padding: clamp(5rem, 9vw, 8rem) 0 clamp(4rem, 7vw, 6rem);
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
`

const Sky = styled.div`
  position: absolute;
  bottom: -55%;
  left: 50%;
  transform: translateX(-50%);
  width: 85vw;
  height: 60vw;
  max-width: 1100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(108, 92, 255, 0.45) 0%, rgba(108, 92, 255, 0) 66%);
  pointer-events: none;
`

const Innhold = styled.div`
  position: relative;
  max-width: 44rem;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.038em;
  }

  p {
    margin-top: 1.1rem;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }
`

const Knapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2.25rem;
`

import styled from 'styled-components'
import Icon from '../shared/Icon'
import { duGjor, viGjor } from '../../data/inkludert'
import { Innsig, Seksjon, Tittel, Wrap } from '../../ui'

/**
 * Arbeidsfordelingen, satt opp som to lister ved siden av hverandre.
 *
 * Her sto det et ordfelt før – ti ord i tilfeldige grader og farger. Det var
 * ment som en sky av ting kunden slipper, men leste som plassholdertekst
 * noen hadde glemt å gjøre ferdig. Tilfeldig variasjon ser ikke ut som
 * valgt vektlegging; den ser ut som en side som ikke ble ferdig.
 *
 * Nå står det som det alltid skulle ha stått: åtte ting vi gjør, to ting du
 * gjør. Forskjellen i lengde ER argumentet, og den trenger ingen forklaring
 * – du ser den før du har lest et eneste punkt.
 *
 * Listene kommer fra `inkludert.ts`, der de har ligget ubrukt hele tiden.
 */
export default function Inkludert() {
  return (
    <Seksjon $flate="surface" id="inkludert">
      <Wrap>
        <Innsig>
          <Topp>
            <Tittel>Du trenger ikke skaffe noe.</Tittel>
          </Topp>
        </Innsig>

        <Innsig forsinkelse={90}>
          <Kolonner>
            <Spalte>
              <Overskrift>
                Vi gjør
              </Overskrift>
              <Liste>
                {viGjor.map((p) => (
                  <li key={p}>
                    <Icon navn="sjekk" storrelse={15} tykkelse={2.6} />
                    <span>{p}</span>
                  </li>
                ))}
              </Liste>
            </Spalte>

            {/* Den korte spalta er poenget. Den skal se kort ut. */}
            <Spalte $din>
              <Overskrift>
                Du gjør
              </Overskrift>
              <Liste>
                {duGjor.map((p) => (
                  <li key={p}>
                    <Icon navn="sjekk" storrelse={15} tykkelse={2.6} />
                    <span>{p}</span>
                  </li>
                ))}
              </Liste>
              <Sum>
                <strong>2 timer</strong>
                <span>til sammen. Resten hører du ingenting om.</span>
              </Sum>
            </Spalte>
          </Kolonner>
        </Innsig>
      </Wrap>
    </Seksjon>
  )
}

const Topp = styled.div`
  margin-bottom: clamp(2rem, 4vw, 3rem);
`

/**
 * To spalter som ikke er like brede.
 *
 * «Vi gjør» får mest plass fordi den har mest i seg. Hadde de vært like
 * brede, ville den korte lista sett tynn ut i stedet for kort – og det er
 * en viktig forskjell: kort er en god nyhet, tynn er en mangel.
 */
const Kolonner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`

const Spalte = styled.div<{ $din?: boolean }>`
  padding: clamp(1.4rem, 2.4vw, 2rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme, $din }) => ($din ? 'rgba(91, 74, 232, 0.16)' : theme.colors.border)};
  background: ${({ theme, $din }) => ($din ? theme.colors.accentSoft : theme.colors.sunken)};
`

const Overskrift = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.1rem;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 650;
  letter-spacing: -0.025em;
`


const Liste = styled.ul`
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.ink};
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.3rem;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Sum = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin: 1.3rem 0 0;
  padding-top: 1.1rem;
  border-top: 1px solid rgba(91, 74, 232, 0.16);
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.ink};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1.15em;
    font-weight: 600;
    letter-spacing: -0.03em;
  }
`

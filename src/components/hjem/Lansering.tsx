import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Innsig, Knapp, Seksjon, Wrap } from '../../ui'
import Icon from '../shared/Icon'
import { lansering } from '../../data/lansering'

/**
 * «Vi er nye» – sagt rett ut, og gjort om til en grunn til å velge oss nå.
 *
 * Uten kundeomtaler å vise til er ærlighet det sterkeste vi har: et konkret
 * tilbud med et tak, og hva vi ber om tilbake. Under: én linje til
 * gratisverktøyene, som før fylte en hel seksjon her. De har sin egen side
 * nå, og forsiden handler om nettsiden.
 */
export default function Lansering() {
  return (
    <Seksjon $flate="surface" $tett>
      <Wrap>
        {lansering.aktiv && (
          <Innsig>
            <Kort>
              <div>
                <Stikk>For de {lansering.antall} første kundene</Stikk>
                <h2>
                  Vi er nye. Derfor får du {lansering.rabattProsent} % rabatt – og full oppmerksomhet.
                </h2>
                <p>
                  Vi har ennå ikke mange ferdige sider å vise deg. Derfor gir vi de {lansering.antall} første
                  kundene {lansering.rabattProsent} % på nettsiden, mot to ting: en ærlig omtale når siden er
                  ferdig, og lov til å vise den som eksempel. Du betaler fortsatt ingenting før du har
                  godkjent siden.
                </p>
              </div>
              <Handling>
                <Knapp til="/kontakt" ikon="pilHoyre">
                  Spør om en plass
                </Knapp>
                <small>Rabatten står i tilbudet.</small>
              </Handling>
            </Kort>
          </Innsig>
        )}

        <Verktoylinje to="/verktoy">
          <Icon navn="klokke" storrelse={18} tykkelse={1.8} />
          <span>
            <strong>Gratis verktøy for bedriften din:</strong> fristkalender, timepris, hva en ansatt koster og
            mer.
          </span>
          <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
        </Verktoylinje>
      </Wrap>
    </Seksjon>
  )
}

const Kort = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem 3rem;
  align-items: center;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  h2 {
    max-width: 26ch;
    margin: 0.5rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.title};
    font-weight: 600;
    letter-spacing: var(--ls-title);
    line-height: 1.2;
    text-wrap: balance;
  }

  p {
    max-width: 60ch;
    margin: 0.75rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.body};
    line-height: 1.6;
  }

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Stikk = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.micro};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Handling = styled.div`
  display: grid;
  justify-items: start;
  gap: 0.5rem;

  small {
    font-size: ${({ theme }) => theme.fontSizes.small};
    opacity: 0.8;
  }
`

const Verktoylinje = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.fontSizes.small};
  text-decoration: none;
  transition: border-color ${({ theme }) => theme.transitions.default};

  > svg:first-child {
    flex: none;
    color: ${({ theme }) => theme.colors.accent};
  }

  span {
    flex: 1;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  strong {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: 600;
  }

  > svg:last-child {
    flex: none;
    color: ${({ theme }) => theme.colors.accent};
    transition: transform ${({ theme }) => theme.transitions.default};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:hover > svg:last-child {
    transform: translateX(3px);
  }
`

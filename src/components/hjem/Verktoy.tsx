import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Hode, Innsig, Seksjon, Stikkord, Tittel, Wrap } from '../../ui'
import { gratisverktoy, verktoy } from '../../data/verktoy'
import Icon from '../shared/Icon'

/**
 * Regneverktøyene, satt som en liste – ikke som kort.
 *
 * En liste med store, klikkbare rader leser raskere enn et rutenett av bokser, og den
 * tåler at vi legger til flere eksempler uten at gitteret blir rotete.
 * Bransjen står til venstre som en kolonne, så leseren finner sin egen med
 * øynene i stedet for å lese alle.
 */
export default function Verktoy() {
  return (
    <Seksjon $flate="surface" id="verktoy">
      <Wrap>
        <Innsig>
          <Hode>
            <div>
              <Stikkord>Regneverktøy · bygget for det du selger</Stikkord>
              <Tittel $niva="medium">La kunden regne ut prisen selv.</Tittel>
            </div>

          </Hode>
        </Innsig>

        <Liste>
          {verktoy.map((v, i) => (
            <li key={v.navn}>
              <Innsig forsinkelse={i * 50}>
                <Rad>
                  <Bransje>{v.bransje}</Bransje>
                  <Navn>{v.navn}</Navn>
                </Rad>
              </Innsig>
            </li>
          ))}
        </Liste>

        <Innsig>
          <Egne>
            <h3>Fem vi har bygget – prøv dem gratis</h3>
            <p>
              Ingen innlogging, ingenting lagres. De ligger her fordi de er nyttige, og fordi de
              viser hva et regneverktøy kan gjøre på en side.
            </p>
          </Egne>
        </Innsig>

        <Rutenett>
          {gratisverktoy.map((v, i) => (
            <li key={v.til}>
              <Innsig forsinkelse={i * 40}>
                <Verktoykort to={v.til}>
                  <span className="navn">
                    {v.navn}
                    <Icon navn="pilHoyre" storrelse="1em" tykkelse={2} />
                  </span>
                  <span className="tekst">{v.tekst}</span>
                </Verktoykort>
              </Innsig>
            </li>
          ))}
        </Rutenett>
      </Wrap>
    </Seksjon>
  )
}

const Egne = styled.div`
  margin: clamp(3rem, 6vw, 4.5rem) 0 1.75rem;

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.028em;
  }

  p {
    margin: 0.6rem 0 0;
    max-width: 52ch;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
  }
`

/**
 * Verktøyene som kort, ikke som en lenkerad.
 *
 * Hvert kort er én lenke med beskrivende lenketekst og en setning om hva
 * verktøyet svarer på. Det gir leseren nok til å velge, og søkemotoren nok
 * til å forstå hva som ligger i den andre enden.
 */
const Rutenett = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
`

const Verktoykort = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  padding: 1.1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  transition:
    border-color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  .navn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accent};
  }

  .navn svg {
    width: 15px;
    height: 15px;
    transition: transform ${({ theme }) => theme.transitions.default};
  }

  .tekst {
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.5;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:hover .navn svg {
    transform: translateX(3px);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover .navn svg {
      transform: none;
    }
  }
`

const Liste = styled.ul`
  list-style: none;
  /* Én hårfin skillelinje mellom rader er det eneste stedet på siden der en
     strek gjør jobben bedre enn luft. */
  box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.neutral[200]};
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: baseline;
  padding: clamp(1.1rem, 2vw, 1.6rem) 0;
  box-shadow: inset 0 -1px 0 ${({ theme }) => theme.colors.neutral[200]};

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.3rem;
  }
`

const Bransje = styled.span`
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Navn = styled.span`
  /* Grotesk, ikke serif. Radnavn i displayserif leste som
     overskrifter stablet oppå hverandre – da betyr ikke serifen noe lenger. */
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: var(--fs-lead);
  font-weight: 500;
  letter-spacing: var(--ls-lead);
  line-height: 1.25;
`

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Innsig, Pil, Seksjon, Stikkord, Wrap } from '../../ui'
import { Ramme } from '../shared/Belop'
import { pakker, drift } from '../../data/pakker'

/**
 * «Slik blir prisen til» – forsidens prisseksjon.
 *
 * Her sto tre pakkekort med eksakte beløp og «Mest valgt». Det gjentok
 * kalkulatoren rett over, og det fikk siden til å se ut som en hyllevare man
 * bestiller med to klikk. Det er det ikke: hver side lages for én bedrift.
 *
 * Nå forteller seksjonen hvordan prisen blir til – anslag, samtale, skriftlig
 * fast pris – og viser spennene som det de er: der de fleste lander. Prisene
 * står fortsatt åpent. Det er rammen rundt dem som er ærligere.
 */
const STEG = [
  {
    tittel: 'Et anslag her',
    tekst: 'Kalkulatoren og spennene under viser hvor de fleste lander. Ingen e-post, ingen forpliktelser.',
  },
  {
    tittel: 'En halvtime sammen',
    tekst: 'Vi snakker om hva bedriften gjør, hvem du vil nå og hva siden skal gjøre. Det er her prisen blir din.',
  },
  {
    tittel: 'Fast pris, skriftlig',
    tekst: 'Du får et tilbud med pris og leveringsdato. Takker du ja, står prisen – også om jobben tar lengre tid.',
  },
] as const

export default function Priser() {
  return (
    <Seksjon $flate="tint" id="priser">
      <Wrap>
        <Innsig>
          <Topp>
            <Stikkord>Pris</Stikkord>
            <h2>Slik blir prisen til</h2>
            <p>
              Hver side lages for én bedrift, så den endelige prisen setter vi etter en prat. Men du skal
              vite omtrent hva det koster før du tar kontakt.
            </p>
          </Topp>
        </Innsig>

        <Steg>
          {STEG.map((s, i) => (
            <Innsig key={s.tittel} forsinkelse={i * 80}>
              <Kort>
                <h3>{s.tittel}</h3>
                <p>{s.tekst}</p>
              </Kort>
            </Innsig>
          ))}
        </Steg>

        <Innsig forsinkelse={240}>
          <Spenn>
            <h3>Typiske prosjekter</h3>
            <ul>
              {pakker.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.driftInkludertMnd ? (
                      <Link to="/arrangement">
                        <strong>{p.navn}</strong>
                      </Link>
                    ) : (
                      <strong>{p.navn}</strong>
                    )}{' '}
                    · {p.omfang}
                  </span>
                  <b>
                    <Ramme verdi={p.pris} /> kr
                  </b>
                </li>
              ))}
            </ul>
            <Bunnlinje>
              <span>
                Drift {drift.pris} kr/mnd · kan deles over 12 måneder · eks. mva.
              </span>
              <Pil til="/priser">Hva som påvirker prisen</Pil>
            </Bunnlinje>
          </Spenn>
        </Innsig>
      </Wrap>
    </Seksjon>
  )
}

const Topp = styled.div`
  max-width: 44rem;
  margin: 0 auto clamp(2rem, 4vw, 3rem);
  text-align: center;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    line-height: 1.08;
  }

  p {
    margin: 1rem auto 0;
    max-width: 52ch;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Steg = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;

  > * {
    height: 100%;
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Kort = styled.div`
  height: 100%;
  padding: 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  h3 {
    margin: 0;
    font-size: 1.1875rem;
    font-weight: 650;
    letter-spacing: -0.025em;
  }

  p {
    margin: 0.6rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

/** Spennene, som en rolig liste – ikke som tre kort som konkurrerer om oppmerksomheten. */
const Spenn = styled.div`
  margin-top: 1.1rem;
  padding: 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  h3 {
    margin: 0 0 0.6rem;
    font-size: 1.1875rem;
    font-weight: 650;
    letter-spacing: -0.025em;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  li strong {
    font-weight: 650;
    color: ${({ theme }) => theme.colors.ink};
  }

  li a strong {
    color: ${({ theme }) => theme.colors.accent};
  }

  li b {
    flex-shrink: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    letter-spacing: -0.03em;
    color: ${({ theme }) => theme.colors.ink};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    li {
      flex-direction: column;
      gap: 0.2rem;
    }
  }
`

const Bunnlinje = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

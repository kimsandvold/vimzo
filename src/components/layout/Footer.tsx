import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Wrap } from '../../ui'
import Logo from '../shared/Logo'
import Icon from '../shared/Icon'
import { firma } from '../../data/firma'
import { analyseKlar, apneSamtykke } from '../../lib/analytics'
import { tjenester } from '../../data/tjenester'
import { gratisverktoy } from '../../data/verktoy'

/**
 * Foten er sidens siste sjanse til å svare på «hvem er dette egentlig».
 * Derfor står foretaksopplysningene her i klartekst – både fordi norske
 * bedriftssider skal ha dem, og fordi det er nøyaktig den typen entydige
 * fakta en AI-assistent kan feste en setning til.
 *
 * Ingen e-post, ingen telefon, ingen adresse – verken her eller noe annet
 * sted. Alt går gjennom kontaktskjemaet. Heller ikke poststedet står her:
 * det finnes ikke et kontor å besøke, og arbeidet skjer digitalt.
 *
 * Felter som ikke er fylt ut i `firma.ts` skjuler seg selv. Siden skal aldri
 * publisere en opplysning vi ikke har.
 */
export default function Footer() {
  const ar = new Date().getFullYear()

  return (
    <Fot>
      <Wrap>
        <Topp>
          <Merke>
            <Link to="/" aria-label="Vimzo – til forsiden">
              <Logo />
            </Link>
            <p>Nettsider for små bedrifter, med åpne priser. Vi skriver, designer og drifter – du driver bedriften.</p>
            <Kontaktrad>
              <Link to="/kontakt">
                <Icon navn="epost" storrelse={17} />
                <span>Send oss en melding</span>
              </Link>
            </Kontaktrad>
          </Merke>

          <Spalter>
            <Spalte>
              <h2>Tjenester</h2>
              <ul>
                {tjenester
                  .filter((t) => t.gruppe === 'inngar')
                  .map((t) => (
                    <li key={t.id}>
                      <Link to={`/tjenester#${t.id}`}>{t.navn}</Link>
                    </li>
                  ))}
                <li>
                  <Link to="/tjenester#tillegg">Tillegg med fast pris</Link>
                </li>
              </ul>
            </Spalte>

            <Spalte>
              <h2>Gratis verktøy</h2>
              <ul>
                {gratisverktoy.map((v) => (
                  <li key={v.til}>
                    <Link to={v.til}>{v.navn}</Link>
                  </li>
                ))}
                <li>
                  <Link to="/verktoy">Alle verktøyene →</Link>
                </li>
              </ul>
            </Spalte>

            <Spalte>
              <h2>Vimzo</h2>
              <ul>
                <li>
                  <Link to="/priser">Priser</Link>
                </li>
                <li>
                  <Link to="/arbeid">Arbeid</Link>
                </li>
                <li>
                  <Link to="/arrangement">Arrangementssider</Link>
                </li>
                <li>
                  <Link to="/guider">Guider</Link>
                </li>
                <li>
                  <Link to="/kontakt">Kontakt</Link>
                </li>
                <li>
                  <Link to="/min-side">Min side</Link>
                </li>
                <li>
                  <Link to="/personvern">Personvern</Link>
                </li>
                <li>
                  <Link to="/vilkar/logo">Kjøpsvilkår</Link>
                </li>
              </ul>
            </Spalte>
          </Spalter>
        </Topp>

        <Bunn>
          <p>
            © {ar} {firma.juridiskNavn || firma.merke}
            {firma.orgNr && ` · Org.nr ${firma.orgNr}`}
          </p>
          <p className="sitat">
            {analyseKlar && (
              <Samtykkelenke type="button" onClick={apneSamtykke}>
                Informasjonskapsler
              </Samtykkelenke>
            )}
          </p>
        </Bunn>
      </Wrap>
    </Fot>
  )
}

/**
 * Foten, på en egen grå.
 *
 * Den sto på samme svake grå som kortene på siden, og da gled den inn i
 * innholdet over – man så ikke helt hvor siden sluttet. Et hakk dypere grå
 * og mørkere tekst gir en tydelig bunn uten å bli en tung, svart blokk.
 * Alle tekstfarger er målt mot denne flaten: lenkene 10:1, brødteksten 6.2:1.
 */
const Fot = styled.footer`
  background: #ececf0;
  color: ${({ theme }) => theme.colors.inkMuted};
  padding: 5rem 0 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3.5rem 0 2rem;
  }
`

const Topp = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
  gap: 4rem;
  padding-bottom: 3.5rem;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 3rem;
  }
`

const Merke = styled.div`
  max-width: 42ch;

  p {
    margin-top: 1.25rem;
    font-size: var(--fs-body);
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Kontaktrad = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;
    width: fit-content;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Spalter = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 1.5rem;
  }
`

const Spalte = styled.div`
  h2 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.ink};
    margin-bottom: 1.1rem;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  a {
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.neutral[700]};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.ink};
    }
  }
`

const Bunn = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderStrong};

  p {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  .sitat {
    max-width: 48ch;
    text-align: right;
  }

  @media (max-width: 960px) {
    flex-direction: column;
    gap: 0.75rem;

    .sitat {
      text-align: left;
    }
  }
`

const Samtykkelenke = styled.button`
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
`

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Wrap } from '../../ui'
import Logo from '../shared/Logo'
import Icon from '../shared/Icon'
import { firma } from '../../data/firma'
import { tjenester } from '../../data/tjenester'

/**
 * Foten er sidens siste sjanse til å svare på «hvem er dette egentlig».
 * Derfor står foretaksopplysningene her i klartekst – både fordi norske
 * bedriftssider skal ha dem, og fordi det er nøyaktig den typen entydige
 * fakta en AI-assistent kan feste en setning til.
 *
 * E-postadressen står IKKE her. En adresse i klartekst i foten er det
 * letteste en høstebot finner, og den står på hver eneste side. Veien inn
 * er kontaktskjemaet; adressen oppgir vi i svaret.
 *
 * Postnummeret er også ute – det sier ingenting en leser trenger når
 * poststedet står der, og foten skal ikke være et firmaattest.
 *
 * Felter som ikke er fylt ut i `firma.ts` skjuler seg selv. Siden skal aldri
 * publisere en opplysning vi ikke har.
 */
export default function Footer() {
  const ar = new Date().getFullYear()
  const sted = [firma.poststed, firma.land].filter(Boolean).join(', ')

  return (
    <Fot data-surface="dark">
      <Wrap>
        <Topp>
          <Merke>
            <Link to="/" aria-label="Vimzo – til forsiden">
              <Logo mork />
            </Link>
            <p>
              Håndkodede, forhåndsrendrede nettsider for små og mellomstore bedrifter. Raske å
              laste, billige å drifte, og bygget for å bli funnet – både av Google og av
              AI-assistenter.
            </p>
            <Kontaktrad>
              <Link to="/kontakt">
                <Icon navn="epost" storrelse={17} />
                <span>Send oss en melding</span>
              </Link>
              {firma.telefon && (
                <a href={`tel:${firma.telefon}`}>
                  <Icon navn="samtale" storrelse={17} />
                  <span>{firma.telefonVist || firma.telefon}</span>
                </a>
              )}
              {sted && (
                <span className="sted">
                  <Icon navn="kart" storrelse={17} />
                  <span>{sted}</span>
                </span>
              )}
            </Kontaktrad>
          </Merke>

          <Spalter>
            <Spalte>
              <h3>Tjenester</h3>
              <ul>
                {tjenester.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tjenester#${t.id}`}>{t.navn}</Link>
                  </li>
                ))}
              </ul>
            </Spalte>

            <Spalte>
              <h3>Nettstedet</h3>
              <ul>
                <li>
                  <Link to="/priser">Priser</Link>
                </li>
                <li>
                  <Link to="/arbeid">Arbeid</Link>
                </li>
                <li>
                  <Link to="/guider">Guider</Link>
                </li>
                <li>
                  <Link to="/logo">Lag logo (gratis)</Link>
                </li>
                <li>
                  <Link to="/om">Om oss</Link>
                </li>
                <li>
                  <Link to="/kontakt">Kontakt</Link>
                </li>
                <li>
                  <Link to="/personvern">Personvern</Link>
                </li>
              </ul>
            </Spalte>

            <Spalte>
              <h3>For maskiner</h3>
              <ul>
                <li>
                  <a href="/llms.txt">llms.txt</a>
                </li>
                <li>
                  <a href="/sitemap.xml">sitemap.xml</a>
                </li>
                <li>
                  <a href="/robots.txt">robots.txt</a>
                </li>
              </ul>
            </Spalte>
          </Spalter>
        </Topp>

        <Bunn>
          <p>
            © {ar} {firma.juridiskNavn || firma.merke}
            {firma.orgNr && ` · Org.nr ${firma.orgNr}`}
            {sted && ` · ${sted}`}
          </p>
          <p className="sitat">
            Denne siden er bygget på samme måte som dem vi selger: håndkodet, forhåndsrendret og
            uten et eneste tredjeparts-script.
          </p>
        </Bunn>
      </Wrap>
    </Fot>
  )
}

const Fot = styled.footer`
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  padding: 5rem 0 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3.5rem 0 2rem;
  }
`

const Topp = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.8fr);
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
    font-size: 0.9375rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }
`

const Kontaktrad = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;

  a,
  .sted {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.inkInverted};
    text-decoration: none;
    width: fit-content;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accentLight};
  }

  svg {
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const Spalter = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 1.5rem;
  }
`

const Spalte = styled.div`
  h3 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    /* Foten står på den mørke flaten: inkSubtle er en tone for LYS bakgrunn
       og målte 3.7:1 her. Den inverterte varianten gir 8.7:1. */
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    margin-bottom: 1.1rem;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  a {
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.inkInverted};
    }
  }
`

const Bunn = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};

  p {
    font-size: 0.8125rem;
    /* Mørk flate – samme grunn som overskriftene over. */
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
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

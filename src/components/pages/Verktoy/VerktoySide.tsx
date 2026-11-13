import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, verktoyListeLd } from '../../../lib/jsonLd'
import { VERKTOYGRUPPER, gratisverktoy } from '../../../data/verktoy'
import { guider } from '../../../data/guider'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import Icon from '../../shared/Icon'
import { Prosa } from '../Timepris/felles'

/**
 * /verktoy – alle gratisverktøyene på ett sted.
 *
 * Før lå de bare på forsiden og i bunnteksten, og den som kom inn på
 * timeprisen fant aldri fristkalenderen. Nå har de en egen side i menyen,
 * gruppert etter hva man prøver å få orden på – ikke etter hva vi kaller dem.
 */

const SPORSMAL = [
  {
    sporsmal: 'Er verktøyene gratis?',
    svar:
      'Ja. Alle verktøyene på denne siden er gratis å bruke, uten innlogging. Bare logoen koster noe – ' +
      'og først når du vil laste ned de ferdige filene.',
  },
  {
    sporsmal: 'Lagrer dere det jeg skriver inn?',
    svar:
      'Nei. Kalkulatorene regner i nettleseren din, og tallene ligger bare i adressefeltet. Fristkalenderen ' +
      'spør Brønnøysundregistrene direkte fra nettleseren. Vil du ha det lagret, kan du lage en gratis konto ' +
      'på Min side – da fyller profilen ut verktøyene for deg.',
  },
  {
    sporsmal: 'Hvorfor lager et webbyrå gratisverktøy?',
    svar:
      'Fordi de er nyttige, og fordi de viser hva en nettside kan gjøre når den jobber i stedet for å stå ' +
      'der. Vi lager tilsvarende verktøy for kundene våre – prisanslag, timebestilling og tilbudsskjema – ' +
      'bygget rett inn i siden.',
  },
]

export default function VerktoySide() {
  useSEO({
    title: 'Gratis verktøy for små bedrifter | Vimzo',
    description:
      'Fristkalender, timepriskalkulator, hva du må fakturere, hva en ansatt koster, navnesjekk og logo. ' +
      'Gratis verktøy for norske småbedrifter, uten innlogging.',
    ogImage: '/images/og/verktoy.png',
    ogImageAlt: 'Gratis verktøy for små bedrifter fra Vimzo.',
    jsonLd: [brodsmuler([{ navn: 'Verktøy', sti: '/verktoy' }]), verktoyListeLd(gratisverktoy), faqLd(SPORSMAL)],
  })

  return (
    <>
      <Sidehode
        motiv="verktoy"
        smuler={[{ navn: 'Verktøy' }]}
        stikkord="Gratis for norske småbedrifter"
        tittel="Mindre regning. Ingen glemte frister."
        ingress={
          'Seks verktøy for det alle små bedrifter må ha kontroll på: fristene, prisen, lønnsomheten og ' +
          'navnet. Gratis, på norsk, og uten innlogging.'
        }
      />

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Rutenett>
            {gratisverktoy.map((v) => (
              <li key={v.til}>
                <Kort to={v.til}>
                  <Topp>
                    <Merke aria-hidden="true">
                      <Icon navn={v.ikon} storrelse={22} tykkelse={1.8} />
                    </Merke>
                    <small>{VERKTOYGRUPPER.find((g) => g.id === v.gruppe)?.navn}</small>
                  </Topp>
                  <strong>{v.navn}</strong>
                  <span className="tekst">{v.tekst}</span>
                  <Bunn>
                    <em>{v.gir}</em>
                    <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
                  </Bunn>
                </Kort>
              </li>
            ))}
          </Rutenett>

          <Konto>
            <div>
              <strong>Lagre alt på ett sted</strong>
              <p>
                Med en gratis konto fyller profilen ut verktøyene for deg, og de neste fristene ligger
                klare på Min side hver gang du logger inn.
              </p>
            </div>
            <Knapp til="/min-side" ikon="pilHoyre">
              Lag gratis konto
            </Knapp>
          </Konto>
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>Guider</h2>
            <p>Lengre svar på det småbedrifter lurer på om nettsider, pris og synlighet.</p>
          </Prosa>
          <Guideliste>
            {guider.map((g) => (
              <li key={g.slug}>
                <Link to={`/guider/${g.slug}`}>
                  <strong>{g.tittel}</strong>
                  <span>{g.ingress}</span>
                </Link>
              </li>
            ))}
          </Guideliste>

          <Prosa>
            <h2>Vanlige spørsmål</h2>
            {SPORSMAL.map((s) => (
              <div key={s.sporsmal}>
                <h3>{s.sporsmal}</h3>
                <p>{s.svar}</p>
              </div>
            ))}
            <p>
              Trenger du et verktøy som dette på din egen nettside? <Link to="/kontakt">Fortell oss hva du tenker på</Link>.
            </p>
          </Prosa>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

const Rutenett = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Kort = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
  padding: 1.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  transition:
    border-color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.soft},
    box-shadow ${({ theme }) => theme.transitions.soft};

  > strong {
    margin-top: 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.lead};
    font-weight: 600;
    letter-spacing: var(--ls-lead);
  }

  > .tekst {
    flex: 1;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.55;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-3px);
  }

  &:hover > strong {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Topp = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  small {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: ${({ theme }) => theme.fontSizes.micro};
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`

const Merke = styled.span`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accent};
`

const Bunn = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.accent};

  em {
    font-size: ${({ theme }) => theme.fontSizes.small};
    font-style: normal;
    font-weight: 500;
  }
`

const Konto = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.25rem, 3vw, 2rem);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.lead};
    font-weight: 600;
  }

  p {
    max-width: 56ch;
    margin: 0.3rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.55;
  }
`

const Guideliste = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 0.75rem;
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;

  a {
    display: grid;
    gap: 0.35rem;
    height: 100%;
    padding: 1.1rem 1.25rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;
    transition: border-color ${({ theme }) => theme.transitions.default};

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderStrong};
    }

    &:hover strong {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  strong {
    font-weight: 600;
  }

  span {
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.5;
  }
`

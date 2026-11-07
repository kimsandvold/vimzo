import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Stikkord, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import Pakkekort from '../../shared/Pakkekort'
import Sporsmalsliste from '../../shared/Sporsmalsliste'
import Icon from '../../shared/Icon'
import { faqFor } from '../../../data/faq'
import { firma } from '../../../data/firma'
import { arrangement, formaterPris, formaterRamme, tillegg } from '../../../data/pakker'

/**
 * Hva en arrangementsside inneholder. Konkret, og bare det vi faktisk lager.
 */
const INNHOLD = [
  {
    tittel: 'Program og praktisk info',
    tekst: 'Tid, sted, program, talere eller utstillere, parkering og det folk ellers spør om – samlet ett sted.',
  },
  {
    tittel: 'Eget design',
    tekst: 'I arrangementets farger og uttrykk, ikke en mal. Siden skal kjennes igjen fra plakaten og standen.',
  },
  {
    tittel: 'Påmelding eller billetter',
    tekst: 'Lenke til billettsystemet dere bruker, eller vårt eget påmeldingsskjema med bekreftelse på e-post.',
  },
  {
    tittel: 'Laget for å deles',
    tekst: 'Eget delingsbilde til Facebook og LinkedIn, og en QR-kode til plakaten, rollupen og messestanden.',
  },
  {
    tittel: 'Rask på mobil',
    tekst: 'De fleste åpner den fra en lenke eller en QR-kode på telefonen. Den laster med én gang, også på dårlig dekning.',
  },
  {
    tittel: 'Etter arrangementet',
    tekst: 'Blir en «takk for i år»-side med bilder og ny dato, eller tas ned. Neste år gjenbruker vi designet.',
  },
] as const

/** Fra første prat til siden står. Ærlige tall – de blir et løfte. */
const STEG = [
  { tid: 'Dag 1', tittel: 'En kort prat', tekst: 'Hva er arrangementet, hvem skal komme, og hva skal de gjøre på siden?' },
  { tid: 'Dag 2–7', tittel: 'Vi lager siden', tekst: 'Du følger med på en testadresse og sender program og bilder når du har dem.' },
  { tid: 'Uke 1–2', tittel: 'Siden går live', tekst: 'Med delingsbilde og QR-kode, klar til invitasjonen og plakaten.' },
  { tid: 'Etterpå', tittel: 'Takk for i år', tekst: 'Siden oppdateres med bilder og neste dato – eller tas ned.' },
] as const

/**
 * Arrangementssider – kortvarige sider til messer, konferanser og kampanjer.
 *
 * Egen side og ikke bare et kort på tjenestesiden, fordi det er et eget behov
 * med egne søk («nettside til messe», «påmeldingsside»). Siden svarer på det
 * de lurer på: hva får vi, hva koster det, hvor fort, og hva skjer etterpå.
 * Eksempelsiden gjør løftet konkret.
 */
export default function ArrangementSide() {
  const sporsmal = faqFor('arrangement')
  const pamelding = tillegg('Påmelding til arrangement')
  const nyUtgave = tillegg('Ny utgave av arrangementsside')

  useSEO({
    title: 'Nettside til arrangement, messe eller konferanse | Vimzo',
    description:
      `En egen side til arrangementet, laget på 1–2 uker. Program, påmelding, delingsbilde og QR-kode. ` +
      `Typisk ${formaterRamme(arrangement.pris)} kr med ${arrangement.driftInkludertMnd} måneders drift inkludert.`,
    jsonLd: [
      brodsmuler([{ navn: 'Arrangementssider', sti: '/arrangement' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${firma.url}/arrangement#tjeneste`,
        name: 'Nettside til arrangement, messe eller konferanse',
        serviceType: 'Arrangementsside',
        description: arrangement.for,
        provider: { '@id': `${firma.url}/#organisasjon` },
        areaServed: { '@type': 'Country', name: 'Norge' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NOK',
          priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'NOK',
            valueAddedTaxIncluded: false,
            minPrice: arrangement.pris.fra,
            maxPrice: arrangement.pris.til,
          },
        },
      },
      faqLd(sporsmal),
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Arrangementssider' }]}
        stikkord="Arrangementssider"
        tittel="En egen side til arrangementet"
        ingress="Til messen, konferansen, lanseringen eller kampanjen. En side som ser ordentlig ut den perioden den gjelder – laget på 1–2 uker, uten at dere må bygge en hel nettside."
        handlinger={
          <Knapp til="/arrangement/eksempel" variant="hvit" ikon="pilHoyre">
            Se et eksempel
          </Knapp>
        }
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Topp>
            <Stikkord>Dette får dere</Stikkord>
            <h2>Alt deltakerne trenger, på én side</h2>
          </Topp>
          <Rutenett>
            {INNHOLD.map((i) => (
              <Kort key={i.tittel}>
                <h3>{i.tittel}</h3>
                <p>{i.tekst}</p>
              </Kort>
            ))}
          </Rutenett>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Eksempel>
            <div>
              <Stikkord>Eksempel</Stikkord>
              <h2>Slik kan det se ut</h2>
              <p>
                Vi har laget en eksempelside for en oppdiktet fagdag, så du kan se hvordan en
                arrangementsside oppfører seg – på skjerm og på mobil. Arrangementet finnes ikke, men
                siden er ekte.
              </p>
              <Knapp til="/arrangement/eksempel" variant="aksent" ikon="pilHoyre">
                Åpne eksempelsiden
              </Knapp>
            </div>
            <Forhand to="/arrangement/eksempel" aria-label="Åpne eksempelsiden">
              <Nettleserlinje aria-hidden="true">
                <i />
                <i />
                <i />
                <span>fagdag.eksempel.no</span>
              </Nettleserlinje>
              <Smak aria-hidden="true">
                <small>Torsdag 22. april 2027 · Lillehammer</small>
                <strong>Fagdag for håndverkere</strong>
                <em>Ett døgn med faget, folka og det som kommer.</em>
                <b>Meld deg på</b>
              </Smak>
            </Forhand>
          </Eksempel>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Pris>
            <div>
              <Stikkord>Pris</Stikkord>
              <h2>Hva det koster</h2>
              <p>
                Jobben er avgrenset, så spennet er trangt. Den endelige prisen avtaler vi etter en kort
                prat, og du får den skriftlig før vi begynner.
              </p>
              <Tillegg>
                <li>
                  <span>Egen påmelding med bekreftelse</span>
                  <b>fra {formaterPris(pamelding.pris)} kr</b>
                </li>
                <li>
                  <span>Ny utgave neste år</span>
                  <b>fra {formaterPris(nyUtgave.pris)} kr</b>
                </li>
                <li>
                  <span>Foto eller drone på arrangementet</span>
                  <b>fra {formaterPris(tillegg('Foto og dronevideo').pris)} kr</b>
                </li>
              </Tillegg>
              <small>Alle beløp eks. mva.</small>
            </div>
            <Pakkekort pakke={arrangement} />
          </Pris>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="paper" $tett>
        <Wrap>
          <Topp>
            <Stikkord>Tidslinje</Stikkord>
            <h2>Fra første prat til siden står</h2>
          </Topp>
          <Tidslinje>
            {STEG.map((s) => (
              <li key={s.tittel}>
                <small>{s.tid}</small>
                <h3>{s.tittel}</h3>
                <p>{s.tekst}</p>
              </li>
            ))}
          </Tidslinje>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Smal>
            <Topp>
              <Stikkord>Spørsmål og svar</Stikkord>
              <h2>Det folk pleier å lure på</h2>
            </Topp>
            <Sporsmalsliste sporsmal={sporsmal} />
            <Videre>
              Trenger dere en side som skal leve over tid?{' '}
              <Link to="/priser">
                Se nettsider for bedrifter <Icon navn="pilHoyre" storrelse={14} tykkelse={2} />
              </Link>
            </Videre>
          </Smal>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Har dere et arrangement på gang?"
        tekst="Fortell kort hva det er og når, så sier vi hva vi ville laget – og hva det koster."
      />
    </>
  )
}

/* ------------------------------------------------------------------ stil */

const Topp = styled.div`
  max-width: 44rem;
  margin: 0 auto clamp(2rem, 4vw, 3rem);
  text-align: center;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    line-height: 1.08;
  }
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Kort = styled.article`
  padding: 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.paper};

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

/** Tekst til venstre, et lite utsnitt av eksempelsiden til høyre. */
const Eksempel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;

  /* Bare tekstspalten – kortet ved siden av har sine egne stiler. */
  > div > h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    line-height: 1.08;
  }

  > div > p {
    margin: 1rem 0 1.5rem;
    max-width: 46ch;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

/**
 * Et utsnitt av eksempelsiden, tegnet i CSS. I eksempelets egne farger –
 * ikke Vimzos – fordi poenget er at siden ser ut som arrangementet, ikke som oss.
 */
const Forhand = styled(Link)`
  display: block;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  text-decoration: none;
  transition: transform ${({ theme }) => theme.transitions.soft};

  &:hover {
    transform: translateY(-4px);
  }
`

const Nettleserlinje = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.9rem;
  background: #e9e4da;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c9c1b3;
  }

  span {
    margin-left: 0.6rem;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    background: #f6f2ea;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75rem;
    color: #6b6255;
  }
`

const Smak = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 2.4rem 2rem 2.6rem;
  background:
    radial-gradient(90% 120% at 100% 0%, rgba(232, 116, 52, 0.35) 0%, rgba(232, 116, 52, 0) 60%),
    #1f2a24;
  color: #f6f2ea;

  small {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #f0a46e;
  }

  strong {
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 750;
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  em {
    font-style: normal;
    font-size: 0.9375rem;
    color: rgba(246, 242, 234, 0.75);
  }

  b {
    margin-top: 0.6rem;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    background: #e87434;
    color: #1f2a24;
    font-size: 0.875rem;
  }
`

const Pris = styled(Eksempel)`
  align-items: start;

  > div > small {
    display: block;
    margin-top: 0.9rem;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Tillegg = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  b {
    flex-shrink: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    letter-spacing: -0.03em;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Tidslinje = styled.ol`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 1.4rem 1.4rem 1.5rem;
    border-top: 3px solid ${({ theme }) => theme.colors.accentVivid};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.surface};
  }

  small {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  h3 {
    margin: 0.4rem 0 0;
    font-size: 1.0625rem;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Smal = styled.div`
  max-width: 48rem;
  margin: 0 auto;
`

const Videre = styled.p`
  margin: 2rem 0 0;
  text-align: center;
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.inkMuted};

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accent};
  }
`

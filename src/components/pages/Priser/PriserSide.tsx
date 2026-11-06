import styled from 'styled-components'
import { Ingress, Innsig, Seksjon, Stikkord, Tittel, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, organisasjon } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Pakkekort from '../../shared/Pakkekort'
import Sporsmalsliste from '../../shared/Sporsmalsliste'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import Belop from '../../shared/Belop'
import {
  pakker,
  driftsnivaer,
  drift,
  tilleggstjenester,
  prisnotat,
  delbetalingsnotat,
  endringsnotat,
  markedsabonnement,
  totaltOver,
  SAMMENLIGNINGSPERIODE,
} from '../../../data/pakker'
import { faqFor } from '../../../data/faq'

/**
 * Prissiden. Den finnes først og fremst fordi den sparer alle for tid – og
 * fordi en konkret pris er det eneste en AI-assistent kan gjengi når noen
 * spør hva en nettside koster.
 */
export default function PriserSide() {
  const sporsmal = faqFor('pris', 'prosess')

  useSEO({
    title: 'Priser – nettside fra 1 290 kr/mnd | Vimzo',
    description:
      'Fast pris, alt inkludert – også domenet. Fra 1 290 kr/mnd eller 14 900 kr samlet. ' +
      'Bedriftsside 29 900 kr, større jobber etter avtale. Drift 449 kr/mnd. Ingen skjulte kostnader.',
    jsonLd: [brodsmuler([{ navn: 'Priser', sti: '/priser' }]), organisasjon(), faqLd(sporsmal)],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Priser' }]}
        stikkord="Priser"
        tittel="Hva en nettside koster hos oss"
        ingress="Vi legger prisene åpent ut, og du kan dele beløpet over tolv måneder. Alt er inkludert – også domenet det første året. Tilbudet får du skriftlig før vi begynner, og prisen står."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Gitter>
            {pakker.map((p) => (
              <Pakkekort key={p.id} pakke={p} />
            ))}
          </Gitter>
          <Notat>{prisnotat}</Notat>
          <Notat>{delbetalingsnotat}</Notat>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="paper" $tett>
        <Wrap>
          <Innsig>
  <SeksjonsHode>
    <Stikkord>Etter lansering</Stikkord>
    <Tittel>Det er her de fleste leverandører blir dyre</Tittel>
    <Ingress>Én driftspris, uansett hva siden gjør. Databasen deles av alle kundene våre og koster i praksis ingenting ekstra per side, så vi tar ikke betalt for et nivå du ikke har grunnlag for å velge.</Ingress>
  </SeksjonsHode>
</Innsig>

          {/* Regnestykket konkurrentene ikke viser.
              Vårt avdrag stopper etter tolv måneder; et abonnement gjør aldri
              det. Over tre år er det den forskjellen som avgjør, og den er
              umulig å se på en månedspris alene. Tallene regnes ut fra
              pakkene over, så de kan ikke bli stående feil. */}
          <Innsig forsinkelse={80}>
            <Regnestykke>
              <h3>Hva siden koster å eie i tre år</h3>
              <Sammenligning>
                {pakker.map((p) => {
                  const total = totaltOver(p, SAMMENLIGNINGSPERIODE)
                  if (total === null) return null
                  return (
                    <li key={p.id}>
                      <span className="navn">{p.navn}</span>
                      <span className="belop">
                        <Belop verdi={total} /> kr
                      </span>
                    </li>
                  )
                })}
                <li className="andre">
                  <span className="navn">
                    Nettside-abonnement, {markedsabonnement.lav}–{markedsabonnement.hoy} kr/mnd
                  </span>
                  <span className="belop">
                    <Belop verdi={markedsabonnement.lav * SAMMENLIGNINGSPERIODE} />–
                    <Belop verdi={markedsabonnement.hoy * SAMMENLIGNINGSPERIODE} /> kr
                  </span>
                </li>
              </Sammenligning>
              <p>
                Alt inkludert: bygget én gang, pluss {drift.pris} kroner i måneden i drift. Et
                abonnement ser billigere ut i måneden, men beløpet løper så lenge du er kunde – og
                slutter du å betale, slutter som regel siden å finnes. Hos oss er siden din fra
                dag én, og etter tolv avdrag er den betalt.
              </p>
              <small>
                Spennet er oppgitte månedspriser hos norske abonnementsleverandører, hentet{' '}
                {markedsabonnement.hentet}. Alle beløp eks. mva.
              </small>
            </Regnestykke>
          </Innsig>

          <Toseksjon>
            <Driftsspalte>
              {driftsnivaer.map((niva) => (
                <Driftskort key={niva.id} $anbefalt={!!niva.anbefalt}>
                  <Driftstopp>
                    <h3>{niva.navn}</h3>
                    <Pris>
                      <strong>
                        <Belop verdi={niva.pris} />
                      </strong>
                      <span>kr {niva.periode}</span>
                    </Pris>
                  </Driftstopp>
                  <Driftsfor>{niva.for}</Driftsfor>
                  <ul>
                    {niva.punkter.map((p) => (
                      <li key={p}>
                        <Icon navn="sjekk" storrelse={15} tykkelse={2.4} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </Driftskort>
              ))}
            </Driftsspalte>

            <Tilleggsliste>
              <h3>Tillegg</h3>
              {/* Står før prislista, ikke etter. Den som leser «1 150 per time»
                  uten å vite at småendringer er gratis, regner feil på hele
                  avtalen – og tør ikke sende e-posten når noe må rettes. */}
              <Endringer>{endringsnotat}</Endringer>
              <dl>
                {tilleggstjenester.map((t) => (
                  <Rad key={t.navn}>
                    <dt>
                      <span className="navn">{t.navn}</span>
                      <span className="belop">
                        {t.fraPris && <em>fra </em>}
                        <Belop verdi={t.pris} /> kr
                        {t.enhet && <em> {t.enhet}</em>}
                      </span>
                    </dt>
                    <dd>{t.beskrivelse}</dd>
                  </Rad>
                ))}
              </dl>
            </Tilleggsliste>
          </Toseksjon>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Smal>
            <Innsig>
  <SeksjonsHode>
    <Stikkord>Spørsmål og svar</Stikkord>
    <Tittel>Om pris, tid og det som kommer etterpå</Tittel>
  </SeksjonsHode>
</Innsig>
            <Sporsmalsliste sporsmal={sporsmal} />
          </Smal>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Vil du vite hva akkurat din side vil koste?"
        tekst="Fortell kort hva bedriften gjør, så får du et skriftlig tilbud med fast pris – vanligvis innen to virkedager."
      />
    </>
  )
}

const Gitter = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: stretch;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
  }
`

const Notat = styled.p`
  max-width: 76ch;
  margin-top: 2rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Toseksjon = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Driftsspalte = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Driftstopp = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`

const Driftsfor = styled.p`
  margin-top: 0.35rem;
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Driftskort = styled.div<{ $anbefalt: boolean }>`
  padding: 1.75rem;
  border: 1px solid ${({ theme, $anbefalt }) => ($anbefalt ? theme.colors.accent : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme, $anbefalt }) => ($anbefalt ? theme.shadows.md : theme.shadows.sm)};

  h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1.25rem;
    letter-spacing: -0.02em;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    list-style: none;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  li {
    display: flex;
    gap: 0.65rem;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.3em;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Pris = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.35rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1.9rem;
    font-weight: 500;
    letter-spacing: -0.045em;
  }

  span {
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Tilleggsliste = styled.div`
  padding: 2rem 1.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  > h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1.25rem;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
  }
`

const Rad = styled.div`
  padding: 1.1rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  dt {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 0.35rem;
  }

  .navn {
    font-weight: 550;
    letter-spacing: -0.01em;
  }

  .belop {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.9375rem;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.ink};
  }

  .belop em {
    font-style: normal;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  dd {
    font-size: 0.9rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 68ch;
  }
`

const Smal = styled.div`
  max-width: 48rem;
`

const Endringer = styled.p`
  margin: 0 0 1.4rem;
  padding: 0.9rem 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.accentInk};
`

const Regnestykke = styled.div`
  margin: 2.5rem 0 0;
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};

  h3 {
    margin: 0 0 1.1rem;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  p {
    margin: 1.1rem 0 0;
    max-width: 68ch;
    font-size: ${({ theme }) => theme.fontSizes.base};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  small {
    display: block;
    margin-top: 0.9rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.25rem;
  }
`

/**
 * Radene i regnestykket.
 *
 * Abonnementsraden står nederst og tonet ned, ikke fordi den er mindre
 * viktig, men fordi den er sammenligningsgrunnlaget – ikke et tilbud.
 */
const Sammenligning = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  li:last-child {
    border-bottom: 0;
  }

  .navn {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 550;
    letter-spacing: -0.01em;
  }

  .belop {
    flex-shrink: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  li.andre {
    margin-top: 0.4rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.inkSubtle};

    .navn,
    .belop {
      font-weight: 500;
    }
  }
`

const SeksjonsHode = styled.div`
  margin-bottom: clamp(2rem, 4vw, 3rem);
`

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
  formaterRamme,
} from '../../../data/pakker'
import { faqFor } from '../../../data/faq'

/**
 * Hva som oftest flytter prisen, uansett prosjekt.
 *
 * Dette er det tydeligste tegnet på at siden er skreddersøm og ikke en
 * hyllevare – og det er samtidig nyttig: kunden ser hva han selv kan gjøre
 * for å holde prisen nede. Står også som tekst AI-assistenter kan sitere når
 * noen spør hvorfor nettsider koster så forskjellig.
 */
const PRISDRIVERE = [
  { tittel: 'Hvor mye som skal skrives', tekst: 'Vi skriver alle tekstene. Tre sider om én tjeneste er en annen jobb enn åtte sider om fem.' },
  { tittel: 'Bilder', tekst: 'Har du gode bilder, bruker vi dem. Må vi ut og fotografere – med drone eller uten – kommer det i tillegg.' },
  { tittel: 'Hva siden skal gjøre', tekst: 'En side som informerer er én ting. En som regner ut priser, tar imot bestillinger eller har innlogging, er en annen.' },
  { tittel: 'En gammel side som skal flyttes', tekst: 'Eksisterende domene, e-post og lenker som må tas vare på, krever litt ekstra arbeid – men det er arbeid som må gjøres riktig.' },
] as const

/**
 * Prissiden.
 *
 * Den viser typiske prosjekter med spenn, ikke en prisliste. Prisene står
 * åpent – det sparer alle for tid, og det er det eneste en AI-assistent kan
 * gjengi – men den endelige prisen avtales etter en prat, og det sier siden
 * rett ut i stedet for å late som om man bestiller med to klikk.
 */
export default function PriserSide() {
  const sporsmal = faqFor('pris', 'prosess')
  const [start, bedrift] = pakker

  useSEO({
    title: 'Priser – hva en nettside koster for en liten bedrift | Vimzo',
    description:
      `En liten side lander typisk på ${formaterRamme(start.pris)} kr, en bedriftsside på ` +
      `${formaterRamme(bedrift.pris)} kr. Endelig pris avtales etter en prat, skriftlig. ` +
      `Drift ${drift.pris} kr/mnd, eks. mva.`,
    jsonLd: [brodsmuler([{ navn: 'Priser', sti: '/priser' }]), organisasjon(), faqLd(sporsmal)],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Priser' }]}
        stikkord="Priser"
        tittel="Hva en nettside koster hos oss"
        ingress="Hver side lages for én bedrift, så den endelige prisen setter vi etter en prat. Her ser du hvor de fleste prosjektene lander – og hva som flytter tallet. Tilbudet får du skriftlig, og da står prisen."
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
              <Stikkord>Skreddersøm</Stikkord>
              <Tittel>Hvorfor prisen blir din egen</Tittel>
              <Ingress>
                To bedrifter i samme bransje trenger sjelden den samme siden. Dette er det som oftest
                avgjør hvor i spennet du lander.
              </Ingress>
            </SeksjonsHode>
          </Innsig>
          <Drivergitter>
            {PRISDRIVERE.map((d) => (
              <li key={d.tittel}>
                <h3>{d.tittel}</h3>
                <p>{d.tekst}</p>
              </li>
            ))}
          </Drivergitter>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Innsig>
            <SeksjonsHode>
              <Stikkord>Etter lansering</Stikkord>
              <Tittel>Lite å drifte, derfor lav driftspris</Tittel>
              <Ingress>
                Siden er ferdige filer – ingen database som må oppdateres, ingen tillegg som må lappes,
                ingen servere å passe på. Det er derfor driften koster {drift.pris} kroner i måneden, og
                derfor den sjelden går i stykker.
              </Ingress>
            </SeksjonsHode>
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
              {/* Står før prislista, ikke etter. Den som leser timeprisen uten
                  å vite at småendringer inngår, regner feil på hele avtalen –
                  og tør ikke si fra når noe må rettes. */}
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
        tekst="Fortell kort hva bedriften gjør, så tar vi en prat. Etterpå får du et skriftlig tilbud med fast pris – vanligvis innen to virkedager."
      />
    </>
  )
}

/** Prisdriverne som enkle kort, i samme uttrykk som tjenestesiden. */
const Drivergitter = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 1.6rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    background: ${({ theme }) => theme.colors.surface};
  }

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

  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

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



const SeksjonsHode = styled.div`
  margin-bottom: clamp(2rem, 4vw, 3rem);
`

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, timeprisLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import Felt from '../Timepris/Felt'
import { Bransjelenke, Bransjeliste, Kortsvar, Prosa } from '../Timepris/felles'
import Del from '../Timepris/Del'
import Sammendrag from '../Timepris/Sammendrag'
import { beregnOmsetningskrav, type Omsetningsgrunnlag } from '../../../lib/omsetning'
import { formaterKroner, formaterTall, kronerTilOre, oreTilKroner } from '../../../lib/kroner'
import type { Driftsform } from '../../../lib/timepris'
import { AGA_SONER, DRIFTSFORMER, SATSER_GJELDENDE_FRA, SATSER_KILDE } from '../../../data/timepris'

/**
 * /hva-ma-du-fakturere
 *
 * Timepriskalkulatoren svarer på hva én time må koste. Denne svarer på hvor
 * mange av dem du må selge – og oversetter det til arbeidstimer per uke, som
 * er der regnestykket pleier å bli ubehagelig.
 *
 * Logikken ligger i `src/lib/omsetning.ts` og er testet for seg.
 */

const STANDARD: Omsetningsgrunnlag = {
  driftsform: 'enk',
  onsketInntekt: kronerTilOre(600_000),
  agaSone: '1',
  fasteKostnader: kronerTilOre(150_000),
  timepris: kronerTilOre(650),
  fakturerbarAndel: 65,
  arbeidsuker: 46,
  snittOppdrag: 0,
}

const SPORSMAL = [
  {
    sporsmal: 'Hvor mye må jeg omsette for å ta ut 600 000 i året?',
    svar:
      'I et enkeltpersonforetak må omsetningen dekke uttaket pluss alle faste kostnader. Vil du ta ' +
      'ut 600 000 og har 150 000 i faste kostnader, må du fakturere 750 000 kroner eks. mva. I et ' +
      'aksjeselskap må du opp i over 930 000 for det samme uttaket, fordi lønn utløser feriepenger, ' +
      'arbeidsgiveravgift og pensjon.',
  },
  {
    sporsmal: 'Hvorfor må jeg jobbe flere timer enn jeg fakturerer?',
    svar:
      'Fordi befaring, tilbud, innkjøp, kjøring, rydding og regnskap ikke er fakturerbart. Skal du ' +
      'fakturere 96 timer i måneden og bare 65 prosent av tiden din er fakturerbar, må du være på ' +
      'jobb rundt 148 timer. Det er forskjellen mellom en kalkyle som går opp på papiret og et år ' +
      'som går opp i praksis.',
  },
  {
    sporsmal: 'Er omsetningen med eller uten mva.?',
    svar:
      'Uten. Merverdiavgift er penger du krever inn på vegne av staten og betaler videre – den er ' +
      'aldri din omsetning. Når du regner på hva du må fakturere, skal alle tall være eks. mva.',
  },
  {
    sporsmal: 'Hva om jeg ikke når tallet?',
    svar:
      'Da er det tre knapper å dra i, og bare tre: ta mer betalt per time, få flere fakturerbare ' +
      'timer ut av uka, eller kutte faste kostnader. Den første er nesten alltid den mest effektive ' +
      'og den som blir prøvd sist.',
  },
]

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 390px);
  gap: clamp(1.5rem, 3vw, 2.75rem);
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Bolk = styled.section`
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0 0 1.25rem;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.025em;
  }

  & + & {
    margin-top: 1.5rem;
  }
`

const Felter = styled.div`
  display: grid;
  gap: 1.1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Valg = styled.div`
  display: grid;
  gap: 0.6rem;
  margin-bottom: 1.1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Valgknapp = styled.button<{ $valgt: boolean }>`
  min-height: 46px;
  padding: 0.7rem 0.9rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  font: inherit;
  text-align: left;
  cursor: pointer;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.small};
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 0.1rem;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
    font-size: ${({ theme }) => theme.fontSizes.micro};
    line-height: 1.4;
  }
`

const Sonevalg = styled.label`
  display: grid;
  gap: 0.3rem;
  margin-bottom: 1.1rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;

  select {
    min-height: 46px;
    padding: 0 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-weight: 400;
  }
`

const Kort = styled.aside`
  position: sticky;
  top: 1.5rem;
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  box-shadow: ${({ theme }) => theme.shadows.svev};

  @media (max-width: 1100px) {
    position: static;
  }
`

const Stikkord = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.accentLight};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 550;
`

const StortTall = styled.p`
  margin: 0.3rem 0 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: clamp(2.4rem, 4.5vw + 1rem, 3.4rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
`

const Under = styled.p`
  margin: 0.6rem 0 0;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.5;
`

const Poeng = styled.p`
  margin: 1.4rem 0 0;
  padding: 0.95rem 1.05rem;
  border-left: 3px solid ${({ theme }) => theme.colors.accentLight};
  border-radius: 0 ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0;
  background: ${({ theme }) => theme.colors.deepRaised};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.55;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-variant-numeric: tabular-nums;
  }
`

const Skille = styled.hr`
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};
`

const Linje = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.38rem 0;
  font-size: ${({ theme }) => theme.fontSizes.small};

  span:first-child {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  span:last-child {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`

const Deling = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};
`

const Bro = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};

  p {
    margin: 0 0 0.9rem;
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.55;
  }
`

const Kilde = styled.p`
  margin: 1.2rem 0 0;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  line-height: 1.5;

  a {
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

function lesTall(p: URLSearchParams, navn: string, standard: number): number {
  const n = Number(p.get(navn))
  return p.has(navn) && Number.isFinite(n) && n >= 0 ? n : standard
}

export default function FaktureringSide() {
  const [params, settParams] = useSearchParams()

  const grunnlag = useMemo<Omsetningsgrunnlag>(
    () => ({
      driftsform: params.get('drift') === 'as' ? 'as' : 'enk',
      onsketInntekt: kronerTilOre(lesTall(params, 'inntekt', oreTilKroner(STANDARD.onsketInntekt))),
      agaSone: params.get('sone') ?? STANDARD.agaSone,
      fasteKostnader: kronerTilOre(lesTall(params, 'faste', oreTilKroner(STANDARD.fasteKostnader))),
      timepris: kronerTilOre(lesTall(params, 'timepris', oreTilKroner(STANDARD.timepris))),
      fakturerbarAndel: lesTall(params, 'fakturerbar', STANDARD.fakturerbarAndel),
      arbeidsuker: lesTall(params, 'uker', STANDARD.arbeidsuker),
      snittOppdrag: kronerTilOre(lesTall(params, 'oppdrag', 0)),
    }),
    [params],
  )

  const k = useMemo(() => beregnOmsetningskrav(grunnlag), [grunnlag])

  const endre = useCallback(
    (navn: string, verdi: string | number) => {
      const neste = new URLSearchParams(params)
      neste.set(navn, String(verdi))
      settParams(neste, { replace: true })
    },
    [params, settParams],
  )

  useSEO({
    title: 'Hvor mye må du fakturere for å gå rundt? Gratis kalkulator | Vimzo',
    description:
      'Regn ut hvor mye du må fakturere i året og i måneden for å dekke lønn og faste kostnader – ' +
      'og hvor mange timer det betyr at du må jobbe.',
    ogImage: '/images/og/hva-ma-du-fakturere.png',
    ogImageAlt: 'Hvor mye må du fakturere for å gå rundt? Gratis kalkulator fra Vimzo.',
    jsonLd: [
      brodsmuler([{ navn: 'Hva må du fakturere', sti: '/hva-ma-du-fakturere' }]),
      timeprisLd(
        '/hva-ma-du-fakturere',
        'Kalkulator: hvor mye må du fakturere',
        'Regn ut nødvendig omsetning per år og måned, hvor mange timer du må fakturere, og hvor mange ' +
          'timer du faktisk må jobbe for å få det til.',
      ),
      faqLd(SPORSMAL),
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Hva må du fakturere' }]}
        stikkord="Gratis verktøy"
        tittel="Hvor mye må du fakturere for å gå rundt?"
        ingress={
          'Timeprisen forteller hva én time må koste. Dette forteller hvor mange av dem du må ' +
          'selge – og hvor mange timer du da faktisk må være på jobb.'
        }
      />

      <Seksjon $tett>
        <Wrap>
          <Kortsvar>
            <p>
              <strong>Kort svar:</strong> omsetningen må dekke det du vil ta ut pluss alle faste
              kostnader. Del summen på timeprisen din, så vet du hvor mange timer du må fakturere.
              Del den på den fakturerbare andelen din, så vet du hvor mange timer du må jobbe – og
              det er som regel en tredjedel mer enn du trodde.
            </p>
          </Kortsvar>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Rutenett>
            <form onSubmit={(e) => e.preventDefault()}>
              <Sammendrag etikett="Dette må du fakturere i måneden" tall={formaterKroner(k.omsetningPerManed)} />

              <Bolk>
                <h2>Hva du skal dekke inn</h2>
                <Valg role="group" aria-label="Driftsform">
                  {DRIFTSFORMER.map((d) => (
                    <Valgknapp
                      key={d.verdi}
                      type="button"
                      $valgt={grunnlag.driftsform === d.verdi}
                      aria-pressed={grunnlag.driftsform === d.verdi}
                      onClick={() => endre('drift', d.verdi as Driftsform)}
                    >
                      <strong>{d.navn}</strong>
                      <small>{d.hint}</small>
                    </Valgknapp>
                  ))}
                </Valg>

                {grunnlag.driftsform === 'as' ? (
                  <Sonevalg>
                    Sone for arbeidsgiveravgift
                    <select value={grunnlag.agaSone} onChange={(e) => endre('sone', e.target.value)}>
                      {AGA_SONER.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.navn} – {s.sats} %
                        </option>
                      ))}
                    </select>
                  </Sonevalg>
                ) : null}

                <Felter>
                  <Felt
                    navn={grunnlag.driftsform === 'as' ? 'Ønsket bruttolønn' : 'Ønsket overskudd før skatt'}
                    verdi={oreTilKroner(grunnlag.onsketInntekt)}
                    onEndre={(v) => endre('inntekt', v)}
                    enhet="kr/år"
                    hint={
                      grunnlag.driftsform === 'as'
                        ? 'Feriepenger, arbeidsgiveravgift og pensjon legges på automatisk.'
                        : 'Det du vil sitte igjen med. Skatten betaler du privat.'
                    }
                  />
                  <Felt
                    navn="Faste kostnader"
                    verdi={oreTilKroner(grunnlag.fasteKostnader)}
                    onEndre={(v) => endre('faste', v)}
                    enhet="kr/år"
                    hint="Lokale, forsikring, verktøy, bil, regnskap, telefon og markedsføring."
                  />
                </Felter>
              </Bolk>

              <Bolk>
                <h2>Slik jobber du</h2>
                <Felter>
                  <Felt
                    navn="Timeprisen din"
                    verdi={oreTilKroner(grunnlag.timepris)}
                    onEndre={(v) => endre('timepris', v)}
                    enhet="kr/time"
                    hint="Eks. mva. Vet du ikke hva den bør være, start med timepriskalkulatoren."
                  />
                  <Felt
                    navn="Fakturerbar andel"
                    verdi={grunnlag.fakturerbarAndel}
                    onEndre={(v) => endre('fakturerbar', Math.min(100, v))}
                    enhet="%"
                    hint="Hvor stor del av tiden din du får betalt for. De færreste over 70 %."
                  />
                  <Felt
                    navn="Arbeidsuker i året"
                    verdi={grunnlag.arbeidsuker}
                    onEndre={(v) => endre('uker', Math.min(52, v))}
                    enhet="uker"
                    hint="52 minus ferie og helligdager."
                  />
                  <Felt
                    navn="Snittpris per oppdrag"
                    verdi={oreTilKroner(grunnlag.snittOppdrag)}
                    onEndre={(v) => endre('oppdrag', v)}
                    enhet="kr"
                    plassholder="valgfritt"
                    hint="Fyll inn, så regner vi om til antall oppdrag. Feltet kan stå tomt."
                  />
                </Felter>
              </Bolk>
            </form>

            <Kort aria-live="polite">
              <Stikkord>Dette må du fakturere</Stikkord>
              <StortTall>{formaterKroner(k.omsetningPerManed)}</StortTall>
              <Under>
                i måneden eks. mva. – {formaterKroner(k.nodvendigOmsetning)} i året.
              </Under>

              {k.arbeidstimerPerUke === null || k.fakturerbareTimerPerManed === null ? (
                <Poeng>
                  Fyll inn timeprisen din og hvor stor del av tiden du får betalt for, så regner vi om
                  til timer og arbeidsuker.
                </Poeng>
              ) : (
                <Poeng>
                  Det er <strong>{formaterTall(k.fakturerbareTimerPerManed)}</strong> fakturerbare
                  timer i måneden. For å få dem til, må du være på jobb{' '}
                  <strong>{k.arbeidstimerPerUke.toFixed(1).replace('.', ',')}</strong> timer i uka.
                </Poeng>
              )}

              <Skille />

              <Linje>
                <span>Lønn koster</span>
                <span>{formaterKroner(k.lonnskostnad.sum)}</span>
              </Linje>
              <Linje>
                <span>Faste kostnader</span>
                <span>{formaterKroner(grunnlag.fasteKostnader)}</span>
              </Linje>
              <Linje>
                <span>Omsetning i året</span>
                <span>{formaterKroner(k.nodvendigOmsetning)}</span>
              </Linje>
              {k.fakturerbareTimerPerAr === null ? null : (
                <Linje>
                  <span>Fakturerbare timer i året</span>
                  <span>{formaterTall(k.fakturerbareTimerPerAr)} t</span>
                </Linje>
              )}
              {k.fakturerbareTimerPerUke === null ? null : (
                <Linje>
                  <span>Fakturerbare timer i uka</span>
                  <span>{formaterTall(k.fakturerbareTimerPerUke)} t</span>
                </Linje>
              )}
              {k.oppdragPerAr === null || k.oppdragPerManed === null ? null : (
                <>
                  <Linje>
                    <span>Oppdrag i året</span>
                    <span>{k.oppdragPerAr.toFixed(1).replace('.', ',')}</span>
                  </Linje>
                  <Linje>
                    <span>Oppdrag i måneden</span>
                    <span>{k.oppdragPerManed.toFixed(1).replace('.', ',')}</span>
                  </Linje>
                </>
              )}

              <Deling>
                <Del tittel={`Jeg må fakturere ${formaterKroner(k.omsetningPerManed)} i måneden`} />
              </Deling>

              <Bro>
                <p>
                  Alle tallene over forutsetter at oppdragene kommer. Det er som regel nettsiden som
                  avgjør om de gjør det.
                </p>
                <Knapp til="/priser" variant="hvit">
                  Se hva en nettside koster
                </Knapp>
              </Bro>

              <Kilde>
                Veiledende tall, alle eks. mva. Satser gjeldende fra {SATSER_GJELDENDE_FRA}, kilde{' '}
                <a href={SATSER_KILDE.url} target="_blank" rel="noreferrer">
                  {SATSER_KILDE.navn}
                </a>
                .
              </Kilde>
            </Kort>
          </Rutenett>
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>De tre knappene du kan dra i</h2>
            <p>
              Når tallet blir for høyt, finnes det bare tre måter å møte det på. Ta mer betalt per
              time. Få flere fakturerbare timer ut av uka. Eller kutte faste kostnader.
            </p>
            <p>
              Den første er nesten alltid mest effektiv, og den som blir prøvd sist. Ti prosent
              høyere timepris gir ti prosent mer igjen på hver eneste time du allerede jobber – uten
              at du må jobbe én time til.
            </p>

            <h2>Vanlige spørsmål</h2>
            {SPORSMAL.map((s) => (
              <div key={s.sporsmal}>
                <h3>{s.sporsmal}</h3>
                <p>{s.svar}</p>
              </div>
            ))}

            <h2>Andre gratisverktøy</h2>
            <p>Regn videre på det samme tallgrunnlaget.</p>
          </Prosa>
          <Bransjeliste aria-label="Andre verktøy">
            <Bransjelenke to="/timepris">Hva skal du ta i timen?</Bransjelenke>
            <Bransjelenke to="/hva-koster-en-ansatt">Hva koster en ansatt?</Bransjelenke>
            <Bransjelenke to="/navnesjekk">Er firmanavnet ledig?</Bransjelenke>
          </Bransjeliste>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

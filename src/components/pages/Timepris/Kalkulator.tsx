import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { beregnKalkyle, type Driftsform, type Grunnlag } from '../../../lib/timepris'
import { formaterKroner, kronerTilOre, oreTilKroner } from '../../../lib/kroner'
import { lesGrunnlag, skrivGrunnlag } from '../../../lib/timeprisUrl'
import {
  AGA_SONER,
  BUFFER_FORKLARING,
  DRIFTSFORMER,
  FAKTURERBAR_FORKLARING,
  KOSTNADSFELT,
} from '../../../data/timepris'
import Felt from './Felt'
import Resultat from './Resultat'
import Sammendrag from './Sammendrag'

/**
 * Skjemaet, og limet mellom URL-en og beregningen.
 *
 * Tilstanden ligger i søkeparametrene, ikke i komponenten. Det gir delbare
 * lenker og en tilbakeknapp som virker, og det finnes ikke to steder å lete
 * etter hva som står i feltet nå.
 *
 * Komponenten regner ingenting selv. Den samler tall og sender dem til
 * `beregnKalkyle`, som er testet for seg i `src/lib/timepris.test.ts`.
 */

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 390px);
  gap: clamp(1.5rem, 3vw, 2.75rem);
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Skjema = styled.form`
  display: grid;
  gap: 1.5rem;
`

const Bolk = styled.section`
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
`

const BolkHode = styled.div`
  margin-bottom: 1.25rem;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.025em;
  }

  p {
    margin: 0.3rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
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
  margin-bottom: 1.25rem;

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
  transition: border-color ${({ theme }) => theme.transitions.default};

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
  margin-bottom: 1.25rem;
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

const Sum = styled.p`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.25rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.small};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-variant-numeric: tabular-nums;
  }
`

export default function Kalkulator({ standard }: { standard: Grunnlag }) {
  const [params, settParams] = useSearchParams()
  const grunnlag = useMemo(() => lesGrunnlag(params, standard), [params, standard])
  const kalkyle = useMemo(() => beregnKalkyle(grunnlag), [grunnlag])

  /**
   * Alle endringer går gjennom denne. `replace` gjør at tilbakeknappen tar
   * den besøkende ut av kalkulatoren i stedet for ett tastetrykk bakover –
   * ellers ville et utfylt skjema lagt igjen femti historikkoppføringer.
   */
  const endre = useCallback(
    (endringer: Partial<Grunnlag>) => {
      settParams(skrivGrunnlag({ ...grunnlag, ...endringer }, standard), { replace: true })
    },
    [grunnlag, settParams, standard],
  )

  return (
    <Rutenett>
      <Skjema onSubmit={(e) => e.preventDefault()}>
        <Sammendrag
          etikett="Dette må du ta i timen"
          tall={kalkyle.anbefaltAvrundet === null ? '–' : formaterKroner(kalkyle.anbefaltAvrundet)}
        />

        <Bolk>
          <BolkHode>
            <h2>Hva du vil sitte igjen med</h2>
            <p>Før skatt, og før noe er trukket fra.</p>
          </BolkHode>

          <Valg role="group" aria-label="Driftsform">
            {DRIFTSFORMER.map((d) => (
              <Valgknapp
                key={d.verdi}
                type="button"
                $valgt={grunnlag.driftsform === d.verdi}
                aria-pressed={grunnlag.driftsform === d.verdi}
                onClick={() => endre({ driftsform: d.verdi as Driftsform })}
              >
                <strong>{d.navn}</strong>
                <small>{d.hint}</small>
              </Valgknapp>
            ))}
          </Valg>

          {grunnlag.driftsform === 'as' ? (
            <Sonevalg>
              Sone for arbeidsgiveravgift
              <select value={grunnlag.agaSone} onChange={(e) => endre({ agaSone: e.target.value })}>
                {AGA_SONER.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.navn} – {s.sats} %{s.hint ? ` (${s.hint})` : ''}
                  </option>
                ))}
              </select>
            </Sonevalg>
          ) : null}

          <Felt
            navn={grunnlag.driftsform === 'as' ? 'Ønsket bruttolønn til deg selv' : 'Ønsket overskudd før skatt'}
            verdi={oreTilKroner(grunnlag.onsketInntekt)}
            onEndre={(v) => endre({ onsketInntekt: kronerTilOre(v) })}
            enhet="kr/år"
            hint={
              grunnlag.driftsform === 'as'
                ? 'Beløpet på lønnsslippen. Selskapet betaler feriepenger, arbeidsgiveravgift og pensjon i tillegg.'
                : 'Det du vil sitte igjen med i foretaket. Skatten betaler du privat, og den er ikke med her.'
            }
          />
        </Bolk>

        <Bolk>
          <BolkHode>
            <h2>Hva det koster å drive</h2>
            <p>Alt du betaler i løpet av et år, enten du har oppdrag eller ikke.</p>
          </BolkHode>

          <Felter>
            {KOSTNADSFELT.map((f) => (
              <Felt
                key={f.id}
                navn={f.navn}
                verdi={oreTilKroner(grunnlag.fasteKostnader[f.id])}
                onEndre={(v) =>
                  endre({ fasteKostnader: { ...grunnlag.fasteKostnader, [f.id]: kronerTilOre(v) } })
                }
                enhet="kr/år"
                hint={f.hint}
              />
            ))}
          </Felter>

          <Sum>
            <span>Faste kostnader i året</span>
            <strong>{oreTilKroner(kalkyle.fasteKostnaderSum).toLocaleString('nb-NO')} kr</strong>
          </Sum>
        </Bolk>

        <Bolk>
          <BolkHode>
            <h2>Hvor mye du faktisk jobber</h2>
            <p>Her ligger den vanligste prisfeilen.</p>
          </BolkHode>

          <Felter>
            <Felt
              navn="Arbeidsuker i året"
              verdi={grunnlag.arbeidsuker}
              onEndre={(v) => endre({ arbeidsuker: Math.min(52, v) })}
              enhet="uker"
              hint="52 minus ferie og helligdager. 46 er et vanlig tall."
            />
            <Felt
              navn="Timer per uke"
              verdi={grunnlag.timerPerUke}
              onEndre={(v) => endre({ timerPerUke: v })}
              enhet="timer"
              hint="Den tiden du faktisk er på jobb, ikke den du skulle ønske."
            />
            <Felt
              navn="Fakturerbar andel"
              verdi={grunnlag.fakturerbarAndel}
              onEndre={(v) => endre({ fakturerbarAndel: Math.min(100, v) })}
              enhet="%"
              hint={FAKTURERBAR_FORKLARING}
            />
            <Felt
              navn="Buffer"
              verdi={grunnlag.buffer}
              onEndre={(v) => endre({ buffer: v })}
              enhet="%"
              hint={BUFFER_FORKLARING}
            />
            <Felt
              navn="Hva tar du i dag?"
              verdi={grunnlag.dagensTimepris === null ? 0 : oreTilKroner(grunnlag.dagensTimepris)}
              onEndre={(v) => endre({ dagensTimepris: v > 0 ? kronerTilOre(v) : null })}
              enhet="kr/time"
              plassholder="valgfritt"
              hint="Fyll inn, så viser vi forskjellen. Feltet kan stå tomt."
            />
          </Felter>
        </Bolk>
      </Skjema>

      <Resultat kalkyle={kalkyle} />
    </Rutenett>
  )
}

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
import { beregnAnsattkostnad, type Ansattgrunnlag } from '../../../lib/ansatt'
import { formaterKroner, formaterTall, kronerTilOre, oreTilKroner } from '../../../lib/kroner'
import { AGA_SONER, SATSER_GJELDENDE_FRA, SATSER_KILDE } from '../../../data/timepris'

/**
 * /hva-koster-en-ansatt
 *
 * Spørsmålet en bedrift stiller rett før den vokser – og det er nøyaktig den
 * bedriften som trenger en nettside. Verktøyet er gratis og nyttig i seg
 * selv; broen til det vi selger står nederst i kvitteringen, der den hører
 * hjemme.
 *
 * Regnestykket ligger i `src/lib/ansatt.ts` og er testet for seg.
 */

const STANDARD: Ansattgrunnlag = {
  bruttolonn: kronerTilOre(600_000),
  agaSone: '1',
  feriepengesats: 12,
  pensjonssats: 2,
  andreKostnader: kronerTilOre(50_000),
  arbeidstimer: 1750,
  fakturerbarAndel: 70,
}

const SPORSMAL = [
  {
    sporsmal: 'Hva koster en ansatt med 600 000 i lønn?',
    svar:
      'Rundt 780 000 kroner i rene lønnskostnader: 600 000 i lønn, 72 000 i feriepenger, 12 000 i ' +
      'obligatorisk tjenestepensjon og 96 444 i arbeidsgiveravgift. Legger du til arbeidsplass, ' +
      'utstyr, forsikring og kurs, passerer du fort 830 000. Som tommelfingerregel koster en ansatt ' +
      '30–40 prosent mer enn lønnen.',
  },
  {
    sporsmal: 'Hva beregnes arbeidsgiveravgiften av?',
    svar:
      'Av lønn, feriepenger og innskudd til pensjonsordning. Mange regner bare av lønnen, og da blir ' +
      'avgiften nesten 12 000 kroner for lav i året på en lønn på 600 000. Satsen avhenger av hvilken ' +
      'sone virksomheten er registrert i, og er 14,1 prosent i sone 1.',
  },
  {
    sporsmal: 'Hvor mye må den ansatte fakturere for å bære seg selv?',
    svar:
      'Del hele årskostnaden på de timene den ansatte faktisk kan fakturere – ikke på timene hen er ' +
      'på jobb. En ansatt som koster 830 000 i året og fakturerer 70 prosent av 1 750 timer, må ' +
      'fakturere rundt 680 kroner i timen bare for å gå i null. Skal ansettelsen gi overskudd, må ' +
      'timeprisen ligge over det.',
  },
  {
    sporsmal: 'Hvor mye feriepenger må jeg sette av?',
    svar:
      '10,2 prosent er lovens minimum, og tilsvarer fire uker og én dag ferie. De fleste har avtale ' +
      'om fem uker, som gir 12 prosent. Ansatte over 60 år har rett på et tillegg. Feriepengene ' +
      'settes av i år og utbetales neste år – men kostnaden oppstår nå.',
  },
  {
    sporsmal: 'Må jeg ha tjenestepensjon for ansatte?',
    svar:
      'Ja, obligatorisk tjenestepensjon gjelder de fleste virksomheter med ansatte. Minimum er 2 ' +
      'prosent av lønnen. Mange legger seg høyere for å være konkurransedyktige, og da stiger også ' +
      'arbeidsgiveravgiften, siden innskuddet inngår i avgiftsgrunnlaget.',
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

const Linje = styled.div<{ $sum?: boolean }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.38rem 0;
  font-size: ${({ theme }) => theme.fontSizes.small};
  ${({ $sum, theme }) =>
    $sum
      ? `margin-top: 0.4rem; padding-top: 0.8rem; border-top: 1px solid ${theme.colors.borderInverted}; font-weight: 600;`
      : ''}

  span:first-child {
    color: ${({ theme, $sum }) => ($sum ? theme.colors.inkInverted : theme.colors.inkInvertedMuted)};
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

/** Les tall fra adressefeltet. Ugyldig verdi faller stille tilbake. */
function lesTall(p: URLSearchParams, navn: string, standard: number): number {
  const n = Number(p.get(navn))
  return p.has(navn) && Number.isFinite(n) && n >= 0 ? n : standard
}

/**
 * Selve kalkulatoren – skjema og kvittering. Brukes både her og på Min side
 * (/min-side/verktoy), med tilstanden i adressefeltet begge steder.
 */
export function Ansattkalkulator() {
  const [params, settParams] = useSearchParams()

  const grunnlag = useMemo<Ansattgrunnlag>(
    () => ({
      bruttolonn: kronerTilOre(lesTall(params, 'lonn', oreTilKroner(STANDARD.bruttolonn))),
      agaSone: params.get('sone') ?? STANDARD.agaSone,
      feriepengesats: lesTall(params, 'ferie', STANDARD.feriepengesats),
      pensjonssats: lesTall(params, 'otp', STANDARD.pensjonssats),
      andreKostnader: kronerTilOre(lesTall(params, 'annet', oreTilKroner(STANDARD.andreKostnader))),
      arbeidstimer: lesTall(params, 'timer', STANDARD.arbeidstimer),
      fakturerbarAndel: lesTall(params, 'fakturerbar', STANDARD.fakturerbarAndel),
    }),
    [params],
  )

  const k = useMemo(() => beregnAnsattkostnad(grunnlag), [grunnlag])

  const endre = useCallback(
    (navn: string, verdi: string | number) => {
      const neste = new URLSearchParams(params)
      neste.set(navn, String(verdi))
      settParams(neste, { replace: true })
    },
    [params, settParams],
  )

  return (
    <Rutenett>
      <form onSubmit={(e) => e.preventDefault()}>
        <Sammendrag etikett="Dette koster den ansatte" tall={formaterKroner(k.sumPerAr)} />

        <Bolk>
          <h2>Lønn og satser</h2>
          <Sonevalg>
            Sone for arbeidsgiveravgift
            <select value={grunnlag.agaSone} onChange={(e) => endre('sone', e.target.value)}>
              {AGA_SONER.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.navn} – {s.sats} %{s.hint ? ` (${s.hint})` : ''}
                </option>
              ))}
            </select>
          </Sonevalg>
          <Felter>
            <Felt
              navn="Bruttolønn"
              verdi={oreTilKroner(grunnlag.bruttolonn)}
              onEndre={(v) => endre('lonn', v)}
              enhet="kr/år"
              hint="Beløpet på lønnsslippen, før skatt."
            />
            <Felt
              navn="Feriepenger"
              verdi={grunnlag.feriepengesats}
              onEndre={(v) => endre('ferie', v)}
              enhet="%"
              hint="10,2 % er lovens minimum. 12 % tilsvarer fem uker ferie."
            />
            <Felt
              navn="Tjenestepensjon"
              verdi={grunnlag.pensjonssats}
              onEndre={(v) => endre('otp', v)}
              enhet="%"
              hint="2 % er minimumskravet. Høyere sats gir også høyere arbeidsgiveravgift."
            />
            <Felt
              navn="Andre kostnader"
              verdi={oreTilKroner(grunnlag.andreKostnader)}
              onEndre={(v) => endre('annet', v)}
              enhet="kr/år"
              hint="Arbeidsplass, PC, verktøy, forsikring, kurs og programvare."
            />
          </Felter>
        </Bolk>

        <Bolk>
          <h2>Hva den ansatte skal gjøre</h2>
          <Felter>
            <Felt
              navn="Arbeidstimer i året"
              verdi={grunnlag.arbeidstimer}
              onEndre={(v) => endre('timer', v)}
              enhet="timer"
              hint="En full stilling er rundt 1 750 timer etter ferie og helligdager."
            />
            <Felt
              navn="Fakturerbar andel"
              verdi={grunnlag.fakturerbarAndel}
              onEndre={(v) => endre('fakturerbar', Math.min(100, v))}
              enhet="%"
              hint="Hvor mye av tiden som kan faktureres videre. Sett 0 for en stilling som ikke fakturerer."
            />
          </Felter>
        </Bolk>
      </form>

      <Kort aria-live="polite">
        <Stikkord>Dette koster den ansatte</Stikkord>
        <StortTall>{formaterKroner(k.sumPerAr)}</StortTall>
        <Under>
          i året, eller {formaterKroner(k.sumPerManed)} i måneden. Det er{' '}
          {Math.round((k.faktor - 1) * 100)} % mer enn lønnen.
        </Under>

        {k.nullpunktTimepris === null ? (
          <Poeng>
            Stillingen fakturerer ingenting. Da er den en ren kostnad som må dekkes av det
            resten av bedriften tjener – {formaterKroner(k.sumPerManed)} i måneden.
          </Poeng>
        ) : (
          <Poeng>
            For å bære sin egen kostnad må den ansatte fakturere{' '}
            <strong>{formaterKroner(k.nullpunktTimepris)}</strong> i timen, på{' '}
            {formaterTall(k.fakturerbareTimer)} fakturerbare timer. Alt over det er fortjeneste.
          </Poeng>
        )}

        <Skille />

        <Linje>
          <span>Bruttolønn</span>
          <span>{formaterKroner(k.bruttolonn)}</span>
        </Linje>
        <Linje>
          <span>Feriepenger</span>
          <span>{formaterKroner(k.feriepenger)}</span>
        </Linje>
        <Linje>
          <span>Tjenestepensjon</span>
          <span>{formaterKroner(k.pensjon)}</span>
        </Linje>
        <Linje>
          <span>Arbeidsgiveravgift</span>
          <span>{formaterKroner(k.arbeidsgiveravgift)}</span>
        </Linje>
        <Linje>
          <span>Andre kostnader</span>
          <span>{formaterKroner(k.andreKostnader)}</span>
        </Linje>
        <Linje $sum>
          <span>Sum per år</span>
          <span>{formaterKroner(k.sumPerAr)}</span>
        </Linje>
        {k.kostnadPerArbeidstime === null ? null : (
          <Linje>
            <span>Per arbeidstime</span>
            <span>{formaterKroner(k.kostnadPerArbeidstime)}</span>
          </Linje>
        )}

        <Deling>
          <Del tittel={`Hva en ansatt koster: ${formaterKroner(k.sumPerAr)} i året`} />
        </Deling>

        <Bro>
          <p>
            Skal den ansatte ha noe å gjøre, må telefonen ringe. Det er som regel nettsiden som
            avgjør om den gjør det.
          </p>
          <Knapp til="/priser" variant="hvit">
            Se hva en nettside koster
          </Knapp>
        </Bro>

        <Kilde>
          Veiledende tall. Satser gjeldende fra {SATSER_GJELDENDE_FRA}, kilde{' '}
          <a href={SATSER_KILDE.url} target="_blank" rel="noreferrer">
            {SATSER_KILDE.navn}
          </a>
          . Sjekk alltid egne forutsetninger med regnskapsføreren din.
        </Kilde>
      </Kort>
    </Rutenett>
  )
}

export default function AnsattSide() {
  useSEO({
    title: 'Hva koster en ansatt? Gratis kalkulator | Vimzo',
    description:
      'Regn ut hva en ansatt faktisk koster: lønn, feriepenger, arbeidsgiveravgift, pensjon og ' +
      'arbeidsplass. Se hva hen må fakturere for å bære seg selv.',
    ogImage: '/images/og/hva-koster-en-ansatt.png',
    ogImageAlt: 'Hva koster en ansatt? 830 444 kroner i året ved 600 000 i lønn.',
    jsonLd: [
      brodsmuler([{ navn: 'Hva koster en ansatt', sti: '/hva-koster-en-ansatt' }]),
      timeprisLd(
        '/hva-koster-en-ansatt',
        'Kalkulator: hva koster en ansatt',
        'Regn ut full årskostnad for en ansatt – lønn, feriepenger, arbeidsgiveravgift, obligatorisk ' +
          'tjenestepensjon og andre kostnader – og hva hen må fakturere for å gå i null.',
      ),
      faqLd(SPORSMAL),
    ],
  })

  return (
    <>
      <Sidehode
        motiv="kalkulator"
        smuler={[{ navn: 'Hva koster en ansatt' }]}
        stikkord="Gratis verktøy"
        tittel="Hva koster en ansatt?"
        ingress={
          'Lønnen er ikke kostnaden. Legg til feriepenger, arbeidsgiveravgift, pensjon og en ' +
          'arbeidsplass, så ser du hva ansettelsen faktisk koster – og hva den må tjene inn.'
        }
      />

      <Seksjon $tett>
        <Wrap>
          <Kortsvar>
            <p>
              <strong>Kort svar:</strong> en ansatt koster 30–40 prosent mer enn lønnen. 600 000 i
              lønn blir rundt 780 000 i rene lønnskostnader, og over 830 000 når arbeidsplass, utstyr
              og forsikring er med. Arbeidsgiveravgiften beregnes av lønn, feriepenger{' '}
              <em>og</em> pensjonsinnskudd – det siste glemmer de fleste.
            </p>
          </Kortsvar>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Ansattkalkulator />
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>Hva som faktisk ligger i kostnaden</h2>
            <p>
              Lønnen er den synlige delen. Over den ligger feriepengene, som settes av i år og
              utbetales neste – kostnaden oppstår likevel nå. Så kommer obligatorisk tjenestepensjon,
              og til slutt arbeidsgiveravgiften, som beregnes av lønn, feriepenger og
              pensjonsinnskuddet til sammen.
            </p>
            <p>
              Under den igjen ligger det ingen lønnsslipp viser: en arbeidsplass, en PC eller et sett
              verktøy, yrkesskadeforsikring, kurs og programvarelisenser. De løper fra første dag, og
              de er ofte det som gjør at en ansettelse som så lønnsom ut, ikke var det.
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
            <Bransjelenke to="/hva-ma-du-fakturere">Hvor mye må du fakturere?</Bransjelenke>
            <Bransjelenke to="/navnesjekk">Er firmanavnet ledig?</Bransjelenke>
          </Bransjeliste>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

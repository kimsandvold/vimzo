import styled from 'styled-components'
import { formaterKroner, formaterKronerMedOre, formaterTall } from '../../../lib/kroner'
import type { Kalkyle } from '../../../lib/timepris'
import { SATSER_GJELDENDE_FRA, SATSER_KILDE } from '../../../data/timepris'
import { Knapp } from '../../../ui'
import Del from './Del'

/**
 * Resultatet, som en kvittering.
 *
 * Mørk flate, ett stort tall, resten som linjer under. Formen er lånt fra noe
 * den besøkende allerede stoler på – ikke fra et nøkkeltallspanel.
 *
 * Avsnittet om ubetalt tid står høyt med vilje. Det er den ene setningen folk
 * sender videre, og dermed den som skaffer oss lenkene.
 */

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
  font-size: clamp(2.6rem, 5vw + 1rem, 3.8rem);
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

const Poeng = styled.p`
  margin: 1.4rem 0 0;
  padding: 0.95rem 1.05rem;
  border-left: 3px solid ${({ theme }) => theme.colors.accentLight};
  border-radius: 0 ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0;
  background: ${({ theme }) => theme.colors.deepRaised};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.55;
`

const Avvikslinje = styled(Poeng)<{ $forLite: boolean }>`
  border-left-color: ${({ theme, $forLite }) => ($forLite ? theme.colors.error : theme.colors.success)};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-variant-numeric: tabular-nums;
  }
`

/**
 * Broen til det vi faktisk selger.
 *
 * Den som nettopp har sett at hen må ta 700 kroner timen, er i den eneste
 * tilstanden der spørsmålet lander. Det er ikke et triks – det er den
 * faktiske sammenhengen mellom det å ta ordentlig betalt og det å se ut som
 * man er verdt det.
 */
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

const Deling = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};
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

export default function Resultat({ kalkyle }: { kalkyle: Kalkyle }) {
  const {
    anbefaltAvrundet,
    minsteTimepris,
    arbeidstimer,
    fakturerbareTimer,
    nodvendigDekning,
    omsetningPerAr,
    omsetningPerManed,
    pastandOmUbetaltTid,
    avvik,
    lonnskostnad,
  } = kalkyle

  if (anbefaltAvrundet === null || minsteTimepris === null) {
    return (
      <Kort>
        <Stikkord>Timeprisen din</Stikkord>
        <StortTall>–</StortTall>
        <Under>
          Vi trenger å vite hvor mye du jobber. Fyll inn arbeidsuker, timer per uke og hvor stor andel
          av tiden du får betalt for.
        </Under>
      </Kort>
    )
  }

  return (
    <Kort aria-live="polite">
      <Stikkord>Dette må du ta i timen</Stikkord>
      <StortTall>{formaterKroner(anbefaltAvrundet)}</StortTall>
      <Under>
        eks. mva. Minstekravet er {formaterKronerMedOre(minsteTimepris)} – da går du akkurat i null.
      </Under>

      {pastandOmUbetaltTid === null ? null : (
        <Poeng>
          Du jobber {formaterTall(arbeidstimer)} timer i året, men bare {formaterTall(fakturerbareTimer)} av
          dem kan faktureres. Derfor må timeprisen være {pastandOmUbetaltTid} % høyere enn arbeidstimene
          tilsier.
        </Poeng>
      )}

      {avvik === null ? null : (
        <Avvikslinje $forLite={avvik.tarForLite}>
          {avvik.tarForLite ? (
            <>
              Du tar {formaterKroner(avvik.dagensTimepris)} i dag. Det er{' '}
              <strong>{formaterKroner(avvik.perTime)}</strong> for lite i timen –{' '}
              <strong>{formaterKroner(avvik.perAr)}</strong> i året.
            </>
          ) : (
            <>
              Du tar {formaterKroner(avvik.dagensTimepris)} i dag, altså{' '}
              <strong>{formaterKroner(-avvik.perTime)}</strong> mer enn du trenger. Det er ingen feil –
              det er fortjeneste.
            </>
          )}
        </Avvikslinje>
      )}

      <Skille />

      <Linje>
        <span>Arbeidstimer i året</span>
        <span>{formaterTall(arbeidstimer)} t</span>
      </Linje>
      <Linje>
        <span>Av dem fakturerbare</span>
        <span>{formaterTall(fakturerbareTimer)} t</span>
      </Linje>
      {lonnskostnad.sum === lonnskostnad.inntekt ? null : (
        <Linje>
          <span>Hva lønnen din koster</span>
          <span>{formaterKroner(lonnskostnad.sum)}</span>
        </Linje>
      )}
      <Linje>
        <span>Dette må dekkes inn</span>
        <span>{formaterKroner(nodvendigDekning)}</span>
      </Linje>
      {omsetningPerAr === null || omsetningPerManed === null ? null : (
        <>
          <Linje>
            <span>Omsetning i året</span>
            <span>{formaterKroner(omsetningPerAr)}</span>
          </Linje>
          <Linje>
            <span>Omsetning per måned</span>
            <span>{formaterKroner(omsetningPerManed)}</span>
          </Linje>
        </>
      )}

      <Deling>
        <Del tittel={`Timeprisen min: ${formaterKroner(anbefaltAvrundet)}`} />
      </Deling>

      <Bro>
        <p>
          Du må ta {formaterKroner(anbefaltAvrundet)} i timen. Ser nettsiden din ut som{' '}
          {formaterKroner(anbefaltAvrundet)} i timen?
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
  )
}

import styled, { css } from 'styled-components'
import Belop from './Belop'
import Icon from './Icon'
import { Knapp } from '../../ui'
import { ANTALL_AVDRAG, SAMMENLIGNINGSPERIODE, drift, totaltOver, totaltVedDeling, type Pakke } from '../../data/pakker'

/**
 * Prisekortet på prissiden. Månedsbeløpet står størst, engangsprisen og
 * totalsummen ved deling rett under – uten små skrift.
 */
export default function Pakkekort({ pakke }: { pakke: Pakke }) {
  return (
    <Kort id={pakke.id} $fremhevet={!!pakke.fremhevet}>
      {pakke.fremhevet && <Merke>Mest valgt</Merke>}
      <Navn>{pakke.navn}</Navn>
      <For>{pakke.for}</For>

      {pakke.pris === null || pakke.manedspris === null ? (
        <>
          <Pris>
            <Avtale>Etter avtale</Avtale>
          </Pris>
          <Samlet>
            Jobber av denne størrelsen avtaler vi én og én. Du får et skriftlig tilbud med fast
            pris før vi begynner.
          </Samlet>

          <Deretter>
            Drift <strong><Belop verdi={drift.pris} /> kr/mnd</strong> som ellers
          </Deretter>
        </>
      ) : (
        <>
          <Pris>
            <strong>
              <Belop verdi={pakke.manedspris} />
            </strong>
            <span>kr/mnd</span>
          </Pris>
          <Samlet>
            i {ANTALL_AVDRAG} mnd · til sammen <Belop verdi={totaltVedDeling(pakke) as number} /> kr
            <br />
            eller <b><Belop verdi={pakke.pris} /> kr</b> betalt på én gang
          </Samlet>

          <Deretter>
            Deretter <strong><Belop verdi={drift.pris} /> kr/mnd</strong> i drift. Over tre år:{' '}
            <strong><Belop verdi={totaltOver(pakke, SAMMENLIGNINGSPERIODE) as number} /> kr</strong>
          </Deretter>
        </>
      )}

      <Fakta>
        <span>{pakke.omfang}</span>
        <span>Rask levering</span>
      </Fakta>

      <Punkter>
        {pakke.punkter.map((p) => (
          <li key={p}>
            <Icon navn="sjekk" storrelse={14} tykkelse={2.6} />
            {p}
          </li>
        ))}
      </Punkter>

      <Bunn>
        <Knapp til="/kontakt" variant={pakke.fremhevet ? 'aksent' : 'myk'}>
          Få tilbud på {pakke.navn}
        </Knapp>
      </Bunn>
    </Kort>
  )
}

const Kort = styled.article<{ $fremhevet: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 7rem;
  ${({ $fremhevet, theme }) =>
    $fremhevet
      ? css`border-color: ${theme.colors.borderStrong};`
      : css`border-color: ${theme.colors.border};`}
`

const Merke = styled.span`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.3rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: 0.75rem;
  font-weight: 650;
`

const Navn = styled.h3`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 650;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const For = styled.p`
  margin-top: 0.4rem;
  font-size: 0.925rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
  min-height: 3em;
`

const Pris = styled.p`
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-top: 1.25rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(2.2rem, 3.4vw, 2.9rem);
    font-weight: 500;
    letter-spacing: -0.05em;
  }

  /* Direkte barn – ellers arver <Belop> sine spans denne graden. */
  > span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

/**
 * Det avdraget ikke sier.
 *
 * Et avdrag på 2 590 ser dyrt ut ved siden av et abonnement til 699 – helt
 * til man ser at vårt stopper etter tolv måneder og deres aldri gjør det.
 * Treårstotalen er det eneste tallet som kan sammenlignes, så den står her.
 */
const Deretter = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.accent};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    letter-spacing: -0.03em;
  }
`

/**
 * «Etter avtale» der tallet ellers står.
 *
 * Lå i samme <strong> som beløpene og arvet derfor mono i sifferstørrelse –
 * to ord i tallskrift på 46 px. Dette er ord, ikke et beløp, og settes
 * deretter.
 */
const Avtale = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  letter-spacing: -0.025em;
`

const Samlet = styled.p`
  margin-top: 0.35rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSubtle};

  b {
    font-weight: 650;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Fakta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin: 1.25rem 0;
  padding: 0.75rem 0;
  box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.neutral[200]}, inset 0 -1px 0 ${({ theme }) => theme.colors.neutral[200]};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Punkter = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.75rem;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.925rem;
    font-weight: 500;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Bunn = styled.div`
  margin-top: auto;
  a { width: 100%; }
`

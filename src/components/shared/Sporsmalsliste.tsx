import { useState } from 'react'
import styled from 'styled-components'
import Icon from './Icon'
import type { Sporsmal } from '../../data/faq'

/**
 * Spørsmål og svar som trekkspill.
 *
 * Viktig detalj for synlighet: svarene ligger alltid i DOM-en, også når de er
 * lukket – de skjules med høyde og `visibility`, ikke med `display: none` på
 * et element som ikke er rendret. Da finnes hele teksten i den forhåndsrendrede
 * HTML-en, og både Google og AI-assistenter leser den uten å klikke.
 *
 * Første spørsmål står åpent, slik at det er tydelig hva slags element dette er.
 */
export default function Sporsmalsliste({ sporsmal }: { sporsmal: readonly Sporsmal[] }) {
  const [apen, setApen] = useState<number | null>(0)

  return (
    <Liste>
      {sporsmal.map((s, i) => {
        const erApen = apen === i
        return (
          <Rad key={s.sporsmal} $apen={erApen}>
            <Knapp
              type="button"
              aria-expanded={erApen}
              aria-controls={`svar-${i}`}
              onClick={() => setApen(erApen ? null : i)}
            >
              <span>{s.sporsmal}</span>
              <Tegn $apen={erApen}>
                <Icon navn="pluss" storrelse={18} tykkelse={1.8} />
              </Tegn>
            </Knapp>
            <Svar id={`svar-${i}`} $apen={erApen}>
              <p>{s.svar}</p>
            </Svar>
          </Rad>
        )
      })}
    </Liste>
  )
}

const Liste = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Rad = styled.div<{ $apen: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Knapp = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  width: 100%;
  padding: 1.35rem 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 550;
  letter-spacing: -0.015em;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.ink};
  transition: color ${({ theme }) => theme.transitions.default};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
    gap: 1rem;
  }
`

const Tegn = styled.span<{ $apen: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 0.2rem;
  color: ${({ theme, $apen }) => ($apen ? theme.colors.accent : theme.colors.neutral[400])};
  transform: rotate(${({ $apen }) => ($apen ? '45deg' : '0deg')});
  transition: transform ${({ theme }) => theme.transitions.soft}, color ${({ theme }) => theme.transitions.default};
`

const Svar = styled.div<{ $apen: boolean }>`
  display: grid;
  grid-template-rows: ${({ $apen }) => ($apen ? '1fr' : '0fr')};
  visibility: ${({ $apen }) => ($apen ? 'visible' : 'hidden')};
  transition:
    grid-template-rows ${({ theme }) => theme.transitions.soft},
    visibility ${({ theme }) => theme.transitions.soft};

  /* Selve svaret klippes av wrapperen – teksten blir aldri fjernet fra DOM-en. */
  > p {
    overflow: hidden;
    max-width: 68ch;
    padding-bottom: ${({ $apen }) => ($apen ? '1.5rem' : '0')};
    font-size: 0.9375rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
    transition: padding-bottom ${({ theme }) => theme.transitions.soft};
  }
`

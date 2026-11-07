import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
  analyseKlar,
  lagreSamtykke,
  lesSamtykke,
  sendSidevisning,
  startAnalyse,
  utenAnalyse,
  vedSamtykkeEndring,
  type Samtykke as Valg,
} from '../../lib/analytics'

/**
 * Samtykke til statistikk, og sidevisninger når det er gitt.
 *
 * Banneret er lite og nøkternt, og «Avvis» er like stor og like lett å
 * trykke på som «Godta» – det er det loven krever, og det er det eneste som
 * passer en side som selger tillit. Ingen forhåndsavkrysning, ingen «godta
 * alle» i farge og «innstillinger» i grått.
 *
 * Komponenten gjør også selve målingen: én sidevisning per ruteendring, men
 * bare etter et ja, og aldri i admin eller på Min side.
 */
export default function Samtykke() {
  const { pathname } = useLocation()
  const [valg, setValg] = useState<Valg | null | undefined>(undefined)

  // Les valget etter første render – localStorage finnes ikke i HTML-en som
  // forhåndsrendres, og banneret skal ikke bakes inn i den.
  useEffect(() => {
    const oppdater = () => setValg(lesSamtykke())
    oppdater()
    if (lesSamtykke() === 'ja') startAnalyse()
    return vedSamtykkeEndring(oppdater)
  }, [])

  // Én sidevisning per side. Litt forsinket, så tittelen er satt av useSEO.
  useEffect(() => {
    if (valg !== 'ja') return
    const t = window.setTimeout(() => sendSidevisning(pathname), 50)
    return () => window.clearTimeout(t)
  }, [pathname, valg])

  if (!analyseKlar || valg !== null || utenAnalyse(pathname)) return null

  return (
    <Banner role="dialog" aria-live="polite" aria-label="Informasjonskapsler" data-fri-sone>
      <p>
        Vi vil gjerne bruke Google Analytics for å se hvilke sider som blir lest. Det setter
        informasjonskapsler, så vi spør først. <Link to="/personvern">Les mer</Link>
      </p>
      <Knapper>
        <button type="button" onClick={() => lagreSamtykke('nei')}>
          Avvis
        </button>
        <button type="button" onClick={() => lagreSamtykke('ja')}>
          Godta
        </button>
      </Knapper>
    </Banner>
  )
}

const inn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
`

const Banner = styled.div`
  position: fixed;
  left: clamp(1rem, 2vw, 1.5rem);
  bottom: clamp(1rem, 2vw, 1.5rem);
  z-index: ${({ theme }) => theme.zIndex.kontaktknapp + 1};
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: min(420px, calc(100vw - 2rem));
  padding: 1.1rem 1.2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  animation: ${inn} ${({ theme }) => theme.transitions.soft} both;

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  a {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** To like knapper – avvis er ikke gjemt eller nedtonet. */
const Knapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;

  button {
    min-height: 44px;
    border: 1px solid ${({ theme }) => theme.colors.ink};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
    font-family: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity ${({ theme }) => theme.transitions.default};

    &:hover {
      opacity: 0.88;
    }
  }
`

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
    <Banner role="dialog" aria-live="polite" aria-labelledby="samtykke-tittel" data-fri-sone>
      <Tittel id="samtykke-tittel">Litt statistikk?</Tittel>
      <p>
        Vi vil gjerne se hvilke sider som blir lest, med Google Analytics. Det setter
        informasjonskapsler, så vi spør deg først. <Link to="/personvern">Les mer</Link>
      </p>
      <Knapper>
        <Knapp type="button" $variant="nei" onClick={() => lagreSamtykke('nei')}>
          Nei takk
        </Knapp>
        <Knapp type="button" $variant="ja" onClick={() => lagreSamtykke('ja')}>
          Ja, det er greit
        </Knapp>
      </Knapper>
    </Banner>
  )
}

const inn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
`

/**
 * Et kort nede til venstre på store skjermer, et ark i bunnen på mobil.
 * Det skal se ut som en del av siden – ikke som en advarsel.
 */
const Banner = styled.div`
  position: fixed;
  left: clamp(1rem, 2vw, 1.5rem);
  bottom: clamp(1rem, 2vw, 1.5rem);
  z-index: ${({ theme }) => theme.zIndex.kontaktknapp + 1};
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: min(400px, calc(100vw - 2rem));
  padding: 1.35rem 1.4rem 1.4rem;
  border: 1px solid rgba(12, 13, 12, 0.08);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  backdrop-filter: saturate(180%) blur(16px);
  box-shadow:
    0 1px 2px rgba(12, 13, 12, 0.04),
    0 24px 60px -20px rgba(12, 13, 12, 0.28);
  animation: ${inn} ${({ theme }) => theme.transitions.soft} both;

  p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  a {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: 600;
    text-underline-offset: 2px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    padding: 1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
    border-radius: ${({ theme }) => theme.borderRadius.xl} ${({ theme }) => theme.borderRadius.xl} 0 0;
    border-width: 1px 0 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Tittel = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.0625rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
`

const Knapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.4rem;
`

/**
 * To helt like knapper – samme størrelse, farge og vekt. Datatilsynet krever
 * at det skal være like lett å si nei som ja, og en fylt «ja» ved siden av en
 * lys «nei» er nettopp den typen dytt som ikke er lov.
 */
const Knapp = styled.button<{ $variant: 'ja' | 'nei' }>`
  min-height: 46px;
  padding: 0 0.75rem;
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
  }

  &:active {
    transform: scale(0.98);
  }
`

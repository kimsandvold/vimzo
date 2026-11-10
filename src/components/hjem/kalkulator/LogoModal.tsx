import { useEffect, useId, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import Icon from '../../shared/Icon'
import type { ValgtLogo } from '../../../data/kalkulator'
import type { Logomelding } from '../../../lib/innebygd'

/**
 * Logoverktøyet i en modal, over kalkulatoren.
 *
 * Verktøyet er en hel app med egne klebrige linjer, egen rulling og egen
 * innlogging, så det kjører i en iframe (/logo?innebygd=1) i stedet for å
 * monteres her. Da oppfører det seg nøyaktig som på /logo, og kalkulatoren
 * med svarene til kunden blir liggende urørt under.
 *
 * Rammen sender «vimzo:logo-valgt» når kunden trykker «Bruk denne logoen»,
 * og «vimzo:logo-lukk» på Esc. Meldinger fra andre vinduer eller andre
 * opprinnelser ignoreres.
 */
export default function LogoModal({
  apen,
  ny,
  onLukk,
  onValgt,
}: {
  apen: boolean
  /** Start på en blank logo i stedet for den kunden sist jobbet med. */
  ny: boolean
  onLukk: () => void
  onValgt: (logo: ValgtLogo) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const ramme = useRef<HTMLIFrameElement>(null)
  const [lastet, setLastet] = useState(false)
  const tittelId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (apen && !dialog.open) {
      setLastet(false)
      dialog.showModal()
    }
    if (!apen && dialog.open) dialog.close()
  }, [apen])

  // Siden under skal ikke rulle mens modalen er oppe.
  useEffect(() => {
    if (!apen) return
    const html = document.documentElement
    const for_ = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = for_
    }
  }, [apen])

  useEffect(() => {
    if (!apen) return
    const ved = (e: MessageEvent<Logomelding>) => {
      if (e.origin !== window.location.origin || e.source !== ramme.current?.contentWindow) return
      if (e.data?.type === 'vimzo:logo-valgt') {
        onValgt(e.data.logo)
        onLukk()
      } else if (e.data?.type === 'vimzo:logo-lukk') onLukk()
    }
    window.addEventListener('message', ved)
    return () => window.removeEventListener('message', ved)
  }, [apen, onLukk, onValgt])

  return (
    <Dialog ref={ref} onClose={onLukk} aria-labelledby={tittelId}>
      <Topp>
        <div>
          <h2 id={tittelId}>Lag logoen din</h2>
          <span>Faktureres med nettsiden</span>
        </div>
        <Lukk type="button" onClick={onLukk} aria-label="Lukk logoverktøyet">
          <Icon navn="lukk" storrelse={18} tykkelse={2} />
        </Lukk>
      </Topp>
      <Innhold>
        {/* Monteres bare mens modalen er åpen – ingen ekstra app i bakgrunnen. */}
        {apen && (
          <iframe
            ref={ramme}
            src={`/logo?innebygd=1${ny ? '&ny=1' : ''}`}
            title="Logoverktøyet"
            allow="clipboard-write"
            onLoad={() => {
              setLastet(true)
              // Fokus inn i verktøyet, så kunden kan skrive med en gang.
              ramme.current?.focus()
            }}
          />
        )}
        {apen && !lastet && (
          <Venter aria-live="polite">
            <i aria-hidden="true" />
            Åpner logoverktøyet …
          </Venter>
        )}
      </Innhold>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ stil */

const inn = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.985); }
  to { opacity: 1; transform: none; }
`

const tone = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const snurr = keyframes`
  to { transform: rotate(360deg); }
`

const Dialog = styled.dialog`
  /* Den globale resetten nuller margin, og da mister <dialog> sentreringen. */
  margin: auto;
  display: none;
  flex-direction: column;
  width: min(1320px, calc(100vw - 48px));
  height: calc(100dvh - 48px);
  max-width: none;
  max-height: none;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => theme.shadows.svev};
  overflow: hidden;

  &[open] {
    display: flex;
    animation: ${inn} 0.38s ${({ theme }) => theme.easing.soft} both;
  }

  &::backdrop {
    background: rgba(19, 17, 31, 0.55);
    backdrop-filter: blur(3px);
    animation: ${tone} 0.3s ease both;
  }

  /* Telefon: hele skjermen – verktøyet trenger hver piksel. */
  @media (max-width: 720px) {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    &[open],
    &::backdrop {
      animation: none;
    }
  }
`

const Topp = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.75rem 0.7rem 1.25rem;
  padding-top: max(0.7rem, env(safe-area-inset-top));
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.75rem;
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
    letter-spacing: var(--ls-body);
  }

  span {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Lukk = styled.button`
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.sunken};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Innhold = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
`

const Venter = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 0;
  background: ${({ theme }) => theme.colors.surface};
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};

  i {
    width: 16px;
    height: 16px;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-top-color: ${({ theme }) => theme.colors.accentVivid};
    border-radius: 50%;
    animation: ${snurr} 0.8s linear infinite;
  }
`

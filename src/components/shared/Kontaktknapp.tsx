import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import Icon from './Icon'
import { firma, telefonLenke, telefonVist } from '../../data/firma'
import { vedSamtykkeEndring } from '../../lib/analytics'

/**
 * «Ta kontakt», nede i høyre hjørne på hver side.
 *
 * Det er det eneste stedet telefonnummeret finnes, og det står ikke i HTML-en.
 * Valgene rendres først når knappen åpnes, og nummeret settes sammen av delene
 * i `firma.ts` i samme øyeblikk. En høstebot som leser den prerendrede siden
 * finner en knapp – ikke et nummer.
 *
 * Lukket er den én pille i flateindigoen, samme som de andre hovedknappene.
 * Åpen legger den valgene ut til venstre som hvite piller, med
 * tilgjengeligheten over – så man vet om det er vits å ringe før man gjør det.
 */
export default function Kontaktknapp() {
  const [apen, setApen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const [forrigeSti, setForrigeSti] = useState(pathname)

  // Lukk ved sidebytte, uten effekt: React anbefaler å justere tilstand under
  // rendring når den følger av en prop.
  if (pathname !== forrigeSti) {
    setForrigeSti(pathname)
    setApen(false)
  }

  useEffect(() => {
    if (!apen) return
    const vedTast = (e: KeyboardEvent) => e.key === 'Escape' && setApen(false)
    const vedKlikk = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setApen(false)
    }
    document.addEventListener('keydown', vedTast)
    document.addEventListener('pointerdown', vedKlikk)
    return () => {
      document.removeEventListener('keydown', vedTast)
      document.removeEventListener('pointerdown', vedKlikk)
    }
  }, [apen])

  // Vik unna når en «fri sone» er på skjermen – f.eks. kalkulatorens
  // Tilbake/Neste. Ellers legger knappen seg oppå dem på mobil.
  const [viker, setViker] = useState(false)
  // Samtykkebanneret er også en fri sone; når det lukkes, må vi se på nytt.
  const [skann, setSkann] = useState(0)
  useEffect(() => vedSamtykkeEndring(() => setSkann((n) => n + 1)), [])
  useEffect(() => {
    const synlige = new Set<Element>()
    const observator = new IntersectionObserver((treff) => {
      for (const t of treff) {
        if (t.isIntersecting) synlige.add(t.target)
        else synlige.delete(t.target)
      }
      setViker(synlige.size > 0)
    })
    // Sidene lastes etter hvert; let etter sonene litt etter sidebytte.
    const tid = window.setTimeout(() => {
      document.querySelectorAll('[data-fri-sone]').forEach((el) => observator.observe(el))
    }, 400)
    return () => {
      window.clearTimeout(tid)
      observator.disconnect()
      setViker(false)
    }
  }, [pathname, skann])

  const tlf = telefonLenke()

  return (
    <Hjorne ref={ref} as="aside" aria-label="Ta kontakt" $viker={viker && !apen} inert={viker && !apen}>
      {apen && (
        <Valg id="kontaktvalg">
          {tlf && firma.tilgjengelig && <Tilgjengelig>{firma.tilgjengelig}</Tilgjengelig>}
          <Rad>
            <Alternativ as={Link} to="/kontakt">
              <Icon navn="epost" storrelse={17} tykkelse={2} />
              Send melding
            </Alternativ>
            {tlf && (
              <>
                <Alternativ href={`sms:${tlf}`}>
                  <Icon navn="samtale" storrelse={17} tykkelse={2} />
                  Send SMS
                </Alternativ>
                <Alternativ href={`tel:${tlf}`}>
                  <Icon navn="telefon" storrelse={17} tykkelse={2} />
                  Ring {telefonVist()}
                </Alternativ>
              </>
            )}
          </Rad>
        </Valg>
      )}

      <Hoved
        type="button"
        aria-expanded={apen}
        aria-controls="kontaktvalg"
        $apen={apen}
        onClick={() => setApen((a) => !a)}
      >
        {apen ? (
          <>
            <Icon navn="lukk" storrelse={16} tykkelse={2.4} />
            Lukk
          </>
        ) : (
          'Ta kontakt'
        )}
      </Hoved>
    </Hjorne>
  )
}

const inn = keyframes`
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: none; }
`

const Hjorne = styled.div<{ $viker: boolean }>`
  position: fixed;
  transition:
    opacity ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};
  ${({ $viker }) =>
    $viker &&
    `
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    `}
  right: clamp(1rem, 2vw, 1.5rem);
  bottom: clamp(1rem, 2vw, 1.5rem);
  z-index: ${({ theme }) => theme.zIndex.kontaktknapp};
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const Valg = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  animation: ${inn} ${({ theme }) => theme.transitions.soft} both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Mørk lapp, så den leses på både lyse og mørke seksjoner bak. */
const Tilgjengelig = styled.p`
  margin: 0;
  padding: 0.35rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: ${({ theme }) => theme.shadows.md};
`

const Rad = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const Alternativ = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0 1.2rem;
  border: 1.5px solid ${({ theme }) => theme.colors.accentVivid};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all ${({ theme }) => theme.transitions.default};

  svg {
    color: ${({ theme }) => theme.colors.accentVivid};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.accentSoft};
  }
`

const Hoved = styled.button<{ $apen: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 48px;
  padding: 0 1.4rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $apen }) => ($apen ? theme.colors.ink : theme.colors.accentVivid)};
  color: ${({ theme }) => theme.colors.accentOn};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    ${({ theme }) => theme.shadows.lg},
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme, $apen }) => ($apen ? theme.colors.neutral[800] : theme.colors.accentVividHover)};
  }

  &:active {
    transform: scale(0.97);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    min-height: 44px;
    padding: 0 1.1rem;
    font-size: 0.875rem;
  }
`

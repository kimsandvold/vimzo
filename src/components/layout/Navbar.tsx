import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Wrap, Knapp } from '../../ui'
import Logo from '../shared/Logo'
import Icon from '../shared/Icon'

/**
 * Tre lenker, i den rekkefølgen en besøkende spør: hva lager dere, har
 * dere gjort det før, hva koster det. Deretter én handling – «Ta en prat».
 *
 * «Om oss» er fjernet: det er en side nettsteder hadde fordi alle andre
 * hadde den. Tryggheten den skulle gi – fast pris, ingen binding – står der
 * beslutningen tas. «Guider» står i foten; den er for søkemotorer og
 * AI-assistenter, ikke et steg på veien til å bestemme seg.
 *
 * «Gratis verktøy» står i menyen fordi det er dem folk finner oss gjennom –
 * en som har brukt fristkalenderen, skal finne timeprisen uten å lete i
 * bunnteksten. Guidene ligger på verktøysiden og i bunnteksten, ikke i
 * menyen: fire punkter er nok. «Arbeid» står i bunnteksten til det er flere
 * prosjekter å vise – en menylenke til én case lover mer enn den holder.
 *
 * «Lag logo» står sist. Det er et eget produkt – du kan kjøpe en logo
 * uten å bestille en nettside – og da skal det kunne finnes uten å lete,
 * men etter de tre spørsmålene om nettsiden, som er hovedsaken.
 */
const LENKER = [
  { til: '/tjenester', navn: 'Tjenester' },
  { til: '/priser', navn: 'Priser' },
  { til: '/verktoy', navn: 'Gratis verktøy' },
  { til: '/logo', navn: 'Lag logo' },
] as const

/**
 * Navigasjonen ligger limt til toppen og er gjennomsiktig til man har rullet
 * 24 piksler. Da legger den seg som et frostet lag over innholdet i stedet for
 * å stå som en egen stripe – det holder forsiden hel.
 */
export default function Navbar() {
  const [rullet, setRullet] = useState(false)
  const [apen, setApen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const vedRulling = () => setRullet(window.scrollY > 24)
    vedRulling()
    window.addEventListener('scroll', vedRulling, { passive: true })
    return () => window.removeEventListener('scroll', vedRulling)
  }, [])

  // Ved sidebytte: slipp fokus fra menylenken som ble klikket. Ellers
  // beholder den fokus på den nye siden, og første tastetrykk – også en
  // snarvei – får nettleseren til å tegne fokusringen rundt den.
  useEffect(() => {
    const aktiv = document.activeElement
    if (aktiv instanceof HTMLElement && aktiv.closest('header, #mobilmeny')) aktiv.blur()
  }, [pathname])

  // Lås rulling mens menyen er åpen. Selve lukkingen skjer der den hører
  // hjemme – i klikket på en lenke – ikke som en effekt på ruteendring.
  useEffect(() => {
    document.body.style.overflow = apen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [apen])

  // Alle åpninger er lyse nå – også undersidenes sidehode – så navbaren står
  // alltid i mørk tekst. Variabelen er beholdt så en mørk åpning kan komme
  // tilbake uten å skrive om komponenten.
  const overMork = false

  return (
    <>
      <Topp $rullet={rullet} $mork={overMork} data-surface={overMork ? 'dark' : undefined}>
        <Wrap>
          <Rad>
            <Logolenke to="/" aria-label="Vimzo – til forsiden">
              <Logo mork={overMork} />
            </Logolenke>

            <Lenker>
              {LENKER.map((l) => (
                <Navlenke key={l.til} to={l.til} $mork={overMork}>
                  {l.navn}
                </Navlenke>
              ))}
            </Lenker>

            <Handlinger>
              {/* For kunder som allerede har et prosjekt. Diskret – den skal
                  finnes av dem som leter, ikke konkurrere med «Ta en prat». */}
              <Navlenke to="/min-side" $mork={overMork} className="min-side" aria-label="Min side – for kunder" title="Min side">
                <Icon navn="person" storrelse={18} tykkelse={1.8} />
              </Navlenke>
              <Knapp til="/kontakt" variant={overMork ? 'hvit' : 'aksent'}>
                Ta en prat
              </Knapp>
            </Handlinger>

            <Menyknapp
              type="button"
              $mork={overMork}
              onClick={() => setApen((v) => !v)}
              aria-expanded={apen}
              aria-controls="mobilmeny"
              aria-label={apen ? 'Lukk meny' : 'Åpne meny'}
            >
              <Icon navn={apen ? 'lukk' : 'meny'} storrelse={22} tykkelse={1.8} />
            </Menyknapp>
          </Rad>
        </Wrap>
      </Topp>

      <Mobilmeny id="mobilmeny" $apen={apen} inert={!apen} role="region" aria-label="Meny">
        <nav>
          {LENKER.map((l) => (
            <Mobillenke key={l.til} to={l.til} tabIndex={apen ? 0 : -1} onClick={() => setApen(false)}>
              <span>{l.navn}</span>
              <Icon navn="pilHoyre" storrelse={18} />
            </Mobillenke>
          ))}
        </nav>
        <Knapp til="/kontakt" variant="aksent" stor onClick={() => setApen(false)}>
          Ta en prat
        </Knapp>
        <MinSideMobil to="/min-side" tabIndex={apen ? 0 : -1} onClick={() => setApen(false)}>
          <Icon navn="person" storrelse={18} tykkelse={1.8} />
          Min side – for kunder
        </MinSideMobil>
      </Mobilmeny>
    </>
  )
}

const Topp = styled.header<{ $rullet: boolean; $mork: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.nav};
  display: flex;
  align-items: center;
  height: var(--nav-hoyde);
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    backdrop-filter ${({ theme }) => theme.transitions.default};
  border-bottom: 1px solid transparent;

  /* Container-en inni må få hele bredden når header-en selv er en flexboks. */
  > * {
    width: 100%;
  }

  /*
   * Frostet glass når man har rullet: mer gjennomsiktig enn før, men med
   * kraftigere blur, så innholdet under skimtes uten å konkurrere med
   * lenkene. Kanten er en svak linje i stedet for en hel strek.
   */
  ${({ $rullet }) =>
    $rullet &&
    css`
      background: rgba(255, 255, 255, 0.72);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom-color: rgba(12, 13, 12, 0.07);

      /* Uten blur ville gjennomsiktigheten gjort teksten vanskelig å lese. */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        background: rgba(255, 255, 255, 0.96);
      }
    `}
`

const Rad = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
`

const Lenker = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;

  @media (max-width: 960px) {
    display: none;
  }
`

const Navlenke = styled(NavLink)<{ $mork: boolean }>`
  position: relative;
  padding: 0.5rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: var(--fs-body);
  font-weight: 500;
  color: ${({ theme, $mork }) => ($mork ? theme.colors.inkInvertedMuted : theme.colors.inkMuted)};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.default};

  &:hover {
    color: ${({ theme, $mork }) => ($mork ? theme.colors.inkInverted : theme.colors.ink)};
  }

  &.min-side {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  &.active {
    color: ${({ theme, $mork }) => ($mork ? theme.colors.inkInverted : theme.colors.ink)};
    font-weight: 500;
  }

  /* Den aktive siden markeres med en kort strek under, ikke en farget flate. */
  &.active::after {
    content: '';
    position: absolute;
    left: 0.85rem;
    right: 0.85rem;
    bottom: 0.1rem;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme, $mork }) => ($mork ? theme.colors.accentLight : theme.colors.accent)};
  }
`

const Handlinger = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 0.75rem;

  @media (max-width: 960px) {
    display: none;
  }
`

const Menyknapp = styled.button<{ $mork: boolean }>`
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0 -0.6rem 0 auto;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: none;
  -webkit-tap-highlight-color: transparent;
  color: ${({ theme, $mork }) => ($mork ? theme.colors.inkInverted : theme.colors.ink)};
  cursor: pointer;

  @media (max-width: 960px) {
    display: inline-flex;
  }
`

const Mobilmeny = styled.div<{ $apen: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.nav - 1};
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  padding: 6rem 2rem 3rem;
  /* Nesten heldekkende. Den var mer gjennomsiktig, men da skinte skjemaet
     bak gjennom som grå flekker – uro rett bak de tre ordene man skal velge
     mellom. Et snev av blur er nok til at det kjennes som et lag. */
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: saturate(180%) blur(28px);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  opacity: ${({ $apen }) => ($apen ? 1 : 0)};
  pointer-events: ${({ $apen }) => ($apen ? 'auto' : 'none')};
  transition: opacity ${({ theme }) => theme.transitions.default};

  @media (max-width: 960px) {
    display: flex;
  }

  nav {
    display: flex;
    flex-direction: column;
  }
`

/**
 * Lenka rundt logoen.
 *
 * Fokusringen er global og rektangulær med 6px radius. Rundt en logo med
 * myke hjørner så den ut som en feil – den er det ikke, den er det
 * tastaturbrukere navigerer etter. Så den får følge formen i stedet for å
 * bli fjernet.
 */
const Logolenke = styled(Link)`
  display: inline-flex;
  /* Lenker er understreket globalt; ordmerket skal ikke være det. */
  text-decoration: none;
  border-radius: 12px;

  &:focus-visible {
    outline-offset: 4px;
    border-radius: 12px;
  }
`

const Mobillenke = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  /* Navigasjon er grensesnitt, ikke overskrift – den blir i grotesken. */
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: var(--ls-title);
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;

  svg {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &.active {
    color: ${({ theme }) => theme.colors.accent};
    svg {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const MinSideMobil = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  font-size: var(--fs-body);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.inkMuted};
  text-decoration: none;
`

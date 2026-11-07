import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Wrap, Knapp } from '../../ui'
import Logo from '../shared/Logo'
import Icon from '../shared/Icon'

const LENKER = [
  { til: '/tjenester', navn: 'Tjenester' },
  { til: '/priser', navn: 'Priser' },
  { til: '/arbeid', navn: 'Arbeid' },
  { til: '/guider', navn: 'Guider' },
  { til: '/om', navn: 'Om oss' },
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

  // Undersidene åpner på sidehodets mørke flate, og der må navbaren tegnes i
  // lyse farger til man har rullet forbi den. Forsiden er unntaket: helten ble
  // lys da kalkulatoren kom, og lys tekst på den flaten er usynlig.
  //
  // Dette er bevisst en sjekk på rute og ikke en måling av flaten under. Det
  // finnes nøyaktig to åpninger på hele nettstedet, og en IntersectionObserver
  // for å oppdage det vi allerede vet, er mer maskineri enn svaret er verdt.
  const lysApning = pathname === '/'
  const overMork = !rullet && !apen && !lysApning

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
              <Navlenke to="/min-side" $mork={overMork} className="min-side">
                <Icon navn="person" storrelse={17} tykkelse={1.8} />
                Min side
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
      background: rgba(250, 250, 252, 0.7);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom-color: rgba(12, 13, 12, 0.07);

      /* Uten blur ville gjennomsiktigheten gjort teksten vanskelig å lese. */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        background: rgba(250, 250, 252, 0.94);
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
  font-size: 0.9375rem;
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
    font-weight: 550;
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
  width: 42px;
  height: 42px;
  margin-left: auto;
  border: 1px solid ${({ theme, $mork }) => ($mork ? theme.colors.borderInverted : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $mork }) => ($mork ? 'rgba(247, 248, 250, 0.08)' : theme.colors.surface)};
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
  /* Frostet, ikke heldekkende: man skal se at helten ligger bak menyen,
     ellers føles det som en ny side i stedet for et lag over denne. */
  background: rgba(251, 247, 240, 0.82);
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
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
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
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.inkMuted};
  text-decoration: none;
`

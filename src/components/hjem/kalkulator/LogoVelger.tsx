import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { firebaseKlar, hentAuth } from '../../../lib/firebase'
import type { ValgtLogo } from '../../../data/kalkulator'
import LogoModal from './LogoModal'

type Tilstand = { type: 'laster' } | { type: 'utlogget' } | { type: 'innlogget'; logoer: ValgtLogo[] | null }

/**
 * Velg en logo fra logoverktøyet, inne i kalkulatoren.
 *
 * Vises bare når kunden har valgt «Jeg lager den selv i logoverktøyet», og
 * først da lastes Firebase – forsiden skal ikke betale for innlogging hos alle
 * som aldri trykker her.
 *
 * Verktøyet åpnes i en modal over kalkulatoren (se LogoModal), så svarene
 * blir liggende og kunden aldri forlater siden. «Bruk denne logoen» i
 * verktøyet lukker modalen og velger logoen her. Lista lytter i tillegg på
 * kontoen, så alt kunden har laget står klart neste gang.
 *
 * Logoen faktureres ikke nå. Den følger med forespørselen, og Vimzo frigir
 * filene i saken når nettsiden er ferdig – da står den på samme faktura.
 */
export default function LogoVelger({
  valgt,
  onVelg,
}: {
  valgt: ValgtLogo | null
  onVelg: (logo: ValgtLogo | null) => void
}) {
  const [tilstand, setTilstand] = useState<Tilstand>(firebaseKlar ? { type: 'laster' } : { type: 'utlogget' })
  const [modal, setModal] = useState<{ apen: boolean; ny: boolean }>({ apen: false, ny: false })
  const lukk = useCallback(() => setModal((m) => ({ ...m, apen: false })), [])

  useEffect(() => {
    if (!firebaseKlar) return
    let stoppAuth = () => {}
    let stoppListe = () => {}
    let aktiv = true

    Promise.all([hentAuth(), import('firebase/auth'), import('../../../lib/logodesign')]).then(
      ([auth, { onAuthStateChanged }, { lyttMineDesign }]) => {
        if (!aktiv) return
        stoppAuth = onAuthStateChanged(auth, (bruker) => {
          stoppListe()
          stoppListe = () => {}
          if (!bruker) {
            setTilstand({ type: 'utlogget' })
            return
          }
          setTilstand({ type: 'innlogget', logoer: null })
          lyttMineDesign(
            bruker.uid,
            (liste) =>
              aktiv &&
              setTilstand({
                type: 'innlogget',
                logoer: liste.map((d) => ({ id: d.id, navn: d.navn, forhandsvisning: d.forhandsvisning })),
              }),
            () => aktiv && setTilstand({ type: 'innlogget', logoer: [] }),
          ).then((s) => (aktiv ? (stoppListe = s) : s()))
        })
      },
    )

    return () => {
      aktiv = false
      stoppAuth()
      stoppListe()
    }
  }, [])

  // Én logo og ingen valgt: velg den, så kunden slipper et trykk til.
  const fraKonto = tilstand.type === 'innlogget' ? tilstand.logoer : null
  // Logoen som nettopp kom fra modalen, står først til kontolista har den med.
  const logoer = valgt && !fraKonto?.some((l) => l.id === valgt.id) ? [valgt, ...(fraKonto ?? [])] : fraKonto
  useEffect(() => {
    if (!valgt && logoer?.length === 1) onVelg(logoer[0])
    // Bare når lista endrer seg – ikke hver gang valget gjør det.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fraKonto])

  const modalen = <LogoModal apen={modal.apen} ny={modal.ny} onLukk={lukk} onValgt={onVelg} />
  const apne = (ny: boolean) => setModal({ apen: true, ny })

  if (tilstand.type === 'laster') return <Boks aria-busy="true">Henter logoene dine …</Boks>

  if (!logoer?.length && (tilstand.type === 'utlogget' || tilstand.logoer?.length === 0))
    return (
      <Boks>
        <Tekst>
          <strong>{tilstand.type === 'utlogget' ? 'Lag logoen i verktøyet' : 'Du har ingen logoer ennå'}</strong>
          <span>Svarene dine her blir stående. Lag logoen, trykk «Bruk denne logoen» – så står den her.</span>
        </Tekst>
        <Apne type="button" onClick={() => apne(false)}>
          Åpne logoverktøyet
          <Icon navn="pilHoyre" storrelse={15} tykkelse={2} />
        </Apne>
        {modalen}
      </Boks>
    )

  return (
    <>
      <Liste role="group" aria-label="Velg logoen du har laget">
        {logoer === null
          ? [0, 1].map((i) => <Skjelett key={i} aria-hidden="true" />)
          : logoer.map((l) => {
              const er = valgt?.id === l.id
              return (
                <Logoflis key={l.id} type="button" $valgt={er} aria-pressed={er} onClick={() => onVelg(l)}>
                  <Bilde>
                    {l.forhandsvisning ? (
                      <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(l.forhandsvisning)}`} alt="" />
                    ) : (
                      <span aria-hidden="true">{(l.navn || '?').slice(0, 2)}</span>
                    )}
                  </Bilde>
                  <Navn>{l.navn || 'Uten navn'}</Navn>
                </Logoflis>
              )
            })}
        <NyLogo type="button" onClick={() => apne(true)}>
          <Icon navn="pluss" storrelse={18} tykkelse={2} />
          <span>Lag en ny</span>
        </NyLogo>
      </Liste>
      {modalen}
    </>
  )
}

/* ------------------------------------------------------------------ stil */

const Boks = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Tekst = styled.div`
  display: flex;
  flex: 1 1 260px;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    font-size: var(--fs-body);
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }

  span {
    line-height: 1.5;
  }
`

const Apne = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: var(--fs-small);
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Liste = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
`

const flis = `
  display: flex;
  flex-direction: column;
  min-height: 132px;
  border-radius: 14px;
  overflow: hidden;
`

const Skjelett = styled.div`
  ${flis}
  background: ${({ theme }) => theme.colors.sunken};
`

const Logoflis = styled.button<{ $valgt: boolean }>`
  ${flis}
  padding: 0;
  border: 1.5px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Bilde = styled.span`
  display: grid;
  flex: 1;
  place-items: center;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};

  img {
    max-width: 85%;
    max-height: 64px;
    object-fit: contain;
  }

  span {
    font-weight: 600;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Navn = styled.span`
  overflow: hidden;
  padding: 0.55rem 0.75rem;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const NyLogo = styled.button`
  ${flis}
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  background: transparent;
  font-family: inherit;
  font-size: var(--fs-small);
  cursor: pointer;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentVivid};
    background: ${({ theme }) => theme.colors.accentSoft};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

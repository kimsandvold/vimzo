import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useAdmin as useKonto } from '../Admin/kontekst'
import { dato } from '../Admin/format'
import { erKundens, lyttMineDesign, slettDesign, type LagretDesign } from '../../../lib/logodesign'
import { PRODUKTER } from '../../../data/logoprodukter'

/**
 * «Mine logoer» på Min side.
 *
 * Hver logo kunden har laget, som et kort med forhåndsvisning: utkast og
 * kjøpte side om side, sist endret først. Første flis er alltid «Lag ny
 * logo», så en tom liste aldri er en blindvei.
 *
 * Kjøpte logoer kan lastes ned igjen og profilen åpnes; utkast kan åpnes i
 * verktøyet eller slettes. Nedlastingen selv skjer i logoverktøyet, som har
 * alt som trengs for å lage filene – her lenker vi dit.
 */
export default function MineLogoer() {
  const { bruker } = useKonto()
  const [liste, setListe] = useState<LagretDesign[] | null>(null)
  const [feil, setFeil] = useState(false)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttMineDesign(bruker.uid, setListe, () => setFeil(true)).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [bruker.uid])

  const antallKjopt = useMemo(() => (liste ?? []).filter(erKundens).length, [liste])

  async function slett(d: LagretDesign) {
    if (!window.confirm(`Slette utkastet «${d.navn || 'Uten navn'}»? Det kan ikke angres.`)) return
    await slettDesign(d.id)
  }

  return (
    <Seksjon aria-labelledby="mine-logoer">
      <Hode>
        <h2 id="mine-logoer">Mine logoer</h2>
        {liste && liste.length > 0 && (
          <span>
            {liste.length} {liste.length === 1 ? 'logo' : 'logoer'}
            {antallKjopt > 0 && ` · ${antallKjopt} kjøpt`}
          </span>
        )}
      </Hode>

      {feil && <Melding>Fikk ikke hentet logoene dine akkurat nå. Prøv å laste siden på nytt.</Melding>}

      <Rutenett>
        <NyFlis to="/logo">
          <span aria-hidden="true">
            <Icon navn="pluss" storrelse={22} tykkelse={2} />
          </span>
          <strong>Lag ny logo</strong>
          <small>Navn, stil, og du får forslag på sekunder</small>
        </NyFlis>

        {liste === null && !feil && [0, 1].map((i) => <Skjelett key={i} aria-hidden="true" />)}

        {liste?.map((d) => {
          const kjopt = erKundens(d)
          const produkt = d.produkt === 'profil' || d.produkt === 'logo' ? PRODUKTER[d.produkt].navn : null
          return (
            <Kort key={d.id}>
              <Forhandsvisning to={`/logo?design=${d.id}`} aria-label={`Åpne ${d.navn || 'logoen'} i verktøyet`}>
                {d.forhandsvisning ? (
                  <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(d.forhandsvisning)}`} alt="" />
                ) : (
                  <Initialer aria-hidden="true">{(d.navn || '?').slice(0, 2)}</Initialer>
                )}
              </Forhandsvisning>
              <Info>
                <div>
                  <strong>{d.navn || 'Uten navn'}</strong>
                  <small>
                    {d.frigitt && !d.bestillingId ? 'Med nettsiden' : kjopt ? `Kjøpt · ${produkt}` : 'Utkast'} ·{' '}
                    {dato(d.oppdatert)}
                  </small>
                </div>
                <Merke $kjopt={kjopt}>{d.frigitt && !d.bestillingId ? 'Klar' : kjopt ? 'Kjøpt' : 'Utkast'}</Merke>
              </Info>
              <Handlinger>
                {kjopt ? (
                  <>
                    <Hoved to={`/logo?design=${d.id}&lastned=1`}>
                      <Icon navn="pilNed" storrelse={15} tykkelse={2} /> Last ned
                    </Hoved>
                    {d.produkt === 'profil' && d.bestillingId && (
                      <Sekundar to={`/logo/profil/${d.bestillingId}`}>Se profilen</Sekundar>
                    )}
                    <Sekundar to={`/logo?design=${d.id}`}>Åpne</Sekundar>
                  </>
                ) : (
                  <>
                    <Hoved to={`/logo?design=${d.id}`}>Fortsett</Hoved>
                    <Slett type="button" onClick={() => slett(d)}>
                      Slett
                    </Slett>
                  </>
                )}
              </Handlinger>
            </Kort>
          )
        })}
      </Rutenett>
    </Seksjon>
  )
}

/* ------------------------------------------------------------------ stil */

const Seksjon = styled.section`
  margin-bottom: clamp(2.5rem, 5vw, 3.5rem);
`

const Hode = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: var(--fs-title);
    letter-spacing: var(--ls-title);
  }

  span {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Melding = styled.p`
  margin-bottom: 1rem;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`

const flis = `
  display: flex;
  flex-direction: column;
  min-height: 300px;
  border-radius: 20px;
  overflow: hidden;
`

const NyFlis = styled(Link)`
  ${flis}
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  text-align: center;
  text-decoration: none;
  transition:
    border-color ${({ theme }) => theme.transitions.default},
    background ${({ theme }) => theme.transitions.default};

  span {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin-bottom: 0.5rem;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accent};
  }

  strong {
    font-size: var(--fs-body);
    font-weight: 600;
  }

  small {
    max-width: 22ch;
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentVivid};
    background: ${({ theme }) => theme.colors.accentSoft};
  }
`

const Skjelett = styled.div`
  ${flis}
  background: ${({ theme }) => theme.colors.sunken};
`

const Kort = styled.article`
  ${flis}
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`

const Forhandsvisning = styled(Link)`
  display: grid;
  place-items: center;
  flex: 1;
  min-height: 170px;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.sunken};

  img {
    max-width: 80%;
    max-height: 120px;
    object-fit: contain;
  }
`

const Initialer = styled.span`
  font-size: var(--fs-title);
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Info = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.1rem 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  strong {
    overflow: hidden;
    font-size: var(--fs-body);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Merke = styled.span<{ $kjopt: boolean }>`
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: ${({ theme, $kjopt }) => ($kjopt ? theme.colors.successSoft : theme.colors.sunken)};
  color: ${({ theme, $kjopt }) => ($kjopt ? theme.colors.success : theme.colors.inkMuted)};
  font-size: var(--fs-micro);
  font-weight: 600;
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.1rem 1.1rem;
`

const Hoved = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 1rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }
`

const Sekundar = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 0.85rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const Slett = styled.button`
  margin-left: auto;
  min-height: 40px;
  padding: 0 0.5rem;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`

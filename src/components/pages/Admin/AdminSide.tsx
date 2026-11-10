import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, IngenTilgang, Knapp, StatusMerke } from './felles'
import { dato, idag, kr } from './format'
import { lyttSaker } from '../../../lib/henvendelser'
import { lyttAlleProsjekter } from '../../../lib/prosjekter'
import { lyttLogobestillinger } from '../../../lib/logobestillinger'
import type { Prosjekt } from '../../../data/prosjekt'
import { KILDER, STATUSER, driftAktiv, status as statusinfo, type Sak, type Status } from '../../../data/saker'
import { formaterRamme } from '../../../data/pakker'

type Filter = 'aktive' | 'oppfolging' | 'alle' | Status

/**
 * Oversikten i /admin: nøkkeltall øverst, så alle saker.
 *
 * Standardvisningen er de aktive sakene, med det som trenger deg først:
 * forfalt oppfølging, så nye henvendelser, så resten etter dato.
 */
export default function AdminSide() {
  return (
    <AdminRamme tittel="Saker">
      <Oversikt />
    </AdminRamme>
  )
}

function Oversikt() {
  const [saker, setSaker] = useState<Sak[] | null>(null)
  const [feil, setFeil] = useState<Error | null>(null)
  const [prosjekter, setProsjekter] = useState<Map<string, Prosjekt>>(new Map())
  const [filter, setFilter] = useState<Filter>('aktive')
  const [sok, setSok] = useState('')
  /** Logobestillinger som venter på faktura – vises på knappen i hodet. */
  const [nyeLogo, setNyeLogo] = useState(0)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttSaker(setSaker, setFeil).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [])

  // Prosjektene på Min side – for å se nye meldinger og godtatte tilbud.
  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttAlleProsjekter(
      (liste) => setProsjekter(new Map(liste.map((p) => [p.id, p]))),
      () => {},
    ).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [])

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttLogobestillinger(
      (liste) => setNyeLogo(liste.filter((b) => b.status === 'ny' || b.status === 'levert').length),
      () => {},
    ).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [])

  /** Kunden har skrevet siden du sist åpnet saken. */
  const nyMelding = (s: Sak) => {
    const p = prosjekter.get(s.id)
    return !!p?.sistKundemelding && (!s.sistLest || p.sistKundemelding > s.sistLest)
  }
  /** Kunden har godtatt på Min side, men saken står fortsatt på «Tilbud sendt». */
  const godtattAvKunde = (s: Sak) => s.status === 'tilbud' && !!prosjekter.get(s.id)?.tilbudGodtatt
  const trengerDeg = (s: Sak) => nyMelding(s) || godtattAvKunde(s)

  const dagen = idag()
  const forfalt = (s: Sak) => !!s.nesteOppfolging && s.nesteOppfolging <= dagen && !statusinfo(s.status).ferdig

  const tall = useMemo(() => {
    const alle = saker ?? []
    const tilbud = alle.filter((s) => s.status === 'tilbud')
    const fakturert = alle.filter((s) => s.status === 'fakturert')
    const drift = alle.filter((s) => driftAktiv(s.drift, dagen))
    return {
      nye: alle.filter((s) => s.status === 'ny').length,
      oppfolging: alle.filter(forfalt).length,
      tilbud: tilbud.length,
      tilbudVerdi: tilbud.reduce((sum, s) => sum + (s.tilbudBelop ?? 0), 0),
      arbeid: alle.filter((s) => s.status === 'godtatt' || s.status === 'arbeid').length,
      utestaende: fakturert.reduce((sum, s) => sum + (s.fakturertBelop ?? 0), 0),
      driftkunder: drift.length,
      mrr: drift.reduce((sum, s) => sum + (s.drift?.manedspris ?? 0), 0),
    }
    // forfalt avhenger bare av dagen, som står i listen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saker, dagen])

  const synlige = useMemo(() => {
    const q = sok.trim().toLowerCase()
    return (saker ?? [])
      .filter((s) => {
        if (filter === 'aktive') return !statusinfo(s.status).ferdig
        if (filter === 'oppfolging') return forfalt(s)
        if (filter === 'alle') return true
        return s.status === filter
      })
      .filter((s) => !q || [s.navn, s.bedrift, s.epost, s.telefon, s.melding].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => {
        // Det kunden venter på først, så forfalt oppfølging, så nye, så nyeste.
        const rang = (s: Sak) => (trengerDeg(s) ? 0 : forfalt(s) ? 1 : s.status === 'ny' ? 2 : 3)
        const fa = rang(a)
        const fb = rang(b)
        return fa - fb || b.opprettet - a.opprettet
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saker, filter, sok, dagen, prosjekter])

  if (feil) return <IngenTilgang feil={feil} />
  if (!saker) return <Dempet>Henter saker …</Dempet>

  const antall = (f: Filter) =>
    f === 'aktive'
      ? saker.filter((s) => !statusinfo(s.status).ferdig).length
      : f === 'oppfolging'
        ? tall.oppfolging
        : f === 'alle'
          ? saker.length
          : saker.filter((s) => s.status === f).length

  return (
    <>
      <Hode>
        <h1>Saker</h1>
        <HodeKnapper>
          <Knapp as={Link} to="/admin/logo">
            Logobestillinger{nyeLogo > 0 && <Teller>{nyeLogo}</Teller>}
          </Knapp>
          <Knapp as={Link} to="/admin/ny" $hoved>
            + Ny sak
          </Knapp>
        </HodeKnapper>
      </Hode>

      <Tall>
        <Tallkort $fremhev={tall.nye > 0} onClick={() => setFilter('ny')}>
          <span>Nye</span>
          <strong>{tall.nye}</strong>
        </Tallkort>
        <Tallkort $fremhev={tall.oppfolging > 0} onClick={() => setFilter('oppfolging')}>
          <span>Til oppfølging</span>
          <strong>{tall.oppfolging}</strong>
        </Tallkort>
        <Tallkort onClick={() => setFilter('tilbud')}>
          <span>Tilbud ute</span>
          <strong>{tall.tilbud}</strong>
          <small>{kr(tall.tilbudVerdi)}</small>
        </Tallkort>
        <Tallkort onClick={() => setFilter('arbeid')}>
          <span>Godtatt / i arbeid</span>
          <strong>{tall.arbeid}</strong>
        </Tallkort>
        <Tallkort onClick={() => setFilter('fakturert')}>
          <span>Utestående</span>
          <strong>{kr(tall.utestaende)}</strong>
        </Tallkort>
        <Tallkort as="div">
          <span>Driftskunder</span>
          <strong>{tall.driftkunder}</strong>
          <small>{kr(tall.mrr)}/mnd</small>
        </Tallkort>
      </Tall>

      <Verktoy>
        <Filtre>
          {(['aktive', 'oppfolging', 'alle'] as Filter[]).map((f) => (
            <Filterknapp key={f} $valgt={filter === f} onClick={() => setFilter(f)}>
              {f === 'aktive' ? 'Aktive' : f === 'oppfolging' ? 'Til oppfølging' : 'Alle'} <em>{antall(f)}</em>
            </Filterknapp>
          ))}
          <Skille />
          {STATUSER.map((s) => (
            <Filterknapp key={s.id} $valgt={filter === s.id} onClick={() => setFilter(s.id)}>
              {s.navn} <em>{antall(s.id)}</em>
            </Filterknapp>
          ))}
        </Filtre>
        <Sok type="search" placeholder="Søk på navn, bedrift, e-post …" value={sok} onChange={(e) => setSok(e.target.value)} />
      </Verktoy>

      {synlige.length === 0 ? (
        <Tom>{saker.length === 0 ? 'Ingen henvendelser ennå. De dukker opp her så snart noen sender et skjema.' : 'Ingen saker her.'}</Tom>
      ) : (
        <Liste>
          {synlige.map((s) => (
            <li key={s.id}>
              <Rad to={`/admin/sak/${s.id}`}>
                <Hvem>
                  <strong>{s.bedrift || s.navn || '(uten navn)'}</strong>
                  <span>
                    {s.bedrift ? s.navn : s.epost} · {KILDER[s.kilde]}
                  </span>
                </Hvem>
                <Merker>
                  <StatusMerke status={s.status} />
                  {nyMelding(s) && <Varsel>Ny melding</Varsel>}
                  {godtattAvKunde(s) && <Varsel>Godtatt av kunden</Varsel>}
                </Merker>
                <Hva>
                  {s.pakke || '–'}
                  {s.anslag && <small>{formaterRamme(s.anslag)} kr</small>}
                </Hva>
                <Naar $forfalt={forfalt(s)}>
                  {s.nesteOppfolging ? (
                    <>
                      <small>Følg opp</small>
                      {dato(s.nesteOppfolging)}
                    </>
                  ) : (
                    <>
                      <small>Mottatt</small>
                      {dato(s.opprettet)}
                    </>
                  )}
                </Naar>
              </Rad>
            </li>
          ))}
        </Liste>
      )}
    </>
  )
}

const Hode = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0;
    font-size: var(--fs-title);
  }
`

const HodeKnapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

/** Antall nye logobestillinger, som et lite merke på knappen. */
const Teller = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  margin-left: 0.5rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: var(--fs-micro);
  font-weight: 600;
`

const Tall = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Tallkort = styled.button<{ $fremhev?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.9rem 1rem;
  border: 1px solid ${({ theme, $fremhev }) => ($fremhev ? theme.colors.ink : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  span {
    font-size: var(--fs-micro);
    font-weight: 600;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  strong {
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
    color: ${({ theme }) => theme.colors.ink};
  }

  small {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:is(button):hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const Verktoy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const Filtre = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`

const Filterknapp = styled.button<{ $valgt: boolean }>`
  padding: 0.35rem 0.7rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.inkInverted : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 600;
  cursor: pointer;

  em {
    margin-left: 0.2rem;
    font-style: normal;
    opacity: 0.6;
  }
`

const Skille = styled.span`
  width: 1px;
  height: 20px;
  margin: 0 0.2rem;
  background: ${({ theme }) => theme.colors.border};
`

const Sok = styled.input`
  width: 100%;
  max-width: 420px;
  padding: 0.6rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  font-size: var(--fs-body);
`

const Liste = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const Rad = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 2fr) auto minmax(0, 1.2fr) minmax(0, 0.9fr);
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.paper};
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 0.4rem;
  }
`

const Hvem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Hva = styled.div`
  display: flex;
  flex-direction: column;
  font-size: var(--fs-small);

  small {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Naar = styled.div<{ $forfalt: boolean }>`
  display: flex;
  flex-direction: column;
  font-size: var(--fs-small);
  font-weight: ${({ $forfalt }) => ($forfalt ? 600 : 400)};
  color: ${({ theme, $forfalt }) => ($forfalt ? theme.colors.error : theme.colors.ink)};

  small {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Tom = styled.p`
  padding: 2.5rem 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-align: center;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Merker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`

/** Noe kunden har gjort, som venter på deg. */
const Varsel = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.inkInverted};
  font-size: var(--fs-micro);
  font-weight: 600;
  white-space: nowrap;
`

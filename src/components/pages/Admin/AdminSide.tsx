import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, IngenTilgang, Knapp, StatusMerke } from './felles'
import { dato, idag, kr } from './format'
import { lyttSaker, settStatusFlere } from '../../../lib/henvendelser'
import { lyttAlleProsjekter, synkProsjekt } from '../../../lib/prosjekter'
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
  /** Avkryssede saker, for masseoppdatering. */
  const [valgt, setValgt] = useState<Set<string>>(new Set())
  const [sistKlikket, setSistKlikket] = useState<number | null>(null)
  const [flytter, setFlytter] = useState(false)
  const [melding, setMelding] = useState('')

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

  /** Klikk velger én; shift-klikk velger alt mellom forrige og denne. */
  function velg(indeks: number, id: string, shift: boolean) {
    setValgt((forrige) => {
      const neste = new Set(forrige)
      const pa = !forrige.has(id)
      if (shift && sistKlikket !== null) {
        const [fra, til] = [Math.min(sistKlikket, indeks), Math.max(sistKlikket, indeks)]
        synlige.slice(fra, til + 1).forEach((s) => (pa ? neste.add(s.id) : neste.delete(s.id)))
      } else if (pa) neste.add(id)
      else neste.delete(id)
      return neste
    })
    setSistKlikket(indeks)
  }

  const valgteSaker = synlige.filter((s) => valgt.has(s.id))
  const alleValgt = synlige.length > 0 && valgteSaker.length === synlige.length

  async function flyttValgte(ny: Status) {
    const liste = valgteSaker
    if (liste.length === 0) return
    const navn = statusinfo(ny).navn.toLowerCase()
    if (!window.confirm(`Flytte ${liste.length} ${liste.length === 1 ? 'sak' : 'saker'} til «${navn}»?`)) return
    setFlytter(true)
    setMelding('')
    try {
      await settStatusFlere(liste, ny, ny === 'lukket' ? { grunn: 'Arkivert fra oversikten' } : {})
      // Saker med kundetilgang skal vise den nye statusen på Min side også.
      await Promise.all(
        liste
          .filter((s) => prosjekter.has(s.id))
          .map((s) => synkProsjekt({ ...s, status: ny, historikk: [...s.historikk, { status: ny, tid: Date.now() }] }).catch(() => {})),
      )
      setValgt(new Set())
      setMelding(`${liste.length} ${liste.length === 1 ? 'sak' : 'saker'} flyttet til «${navn}».`)
      window.setTimeout(() => setMelding(''), 4000)
    } catch (e) {
      console.error(e)
      setMelding('Noe gikk galt – ingen eller bare noen av sakene ble flyttet. Prøv igjen.')
    } finally {
      setFlytter(false)
    }
  }

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
          <Listehode>
            <Avkryss>
              <input
                type="checkbox"
                checked={alleValgt}
                ref={(el) => {
                  if (el) el.indeterminate = valgteSaker.length > 0 && !alleValgt
                }}
                onChange={() => setValgt(alleValgt ? new Set() : new Set(synlige.map((s) => s.id)))}
                aria-label="Velg alle synlige saker"
              />
            </Avkryss>
            <span>
              {valgteSaker.length > 0
                ? `${valgteSaker.length} av ${synlige.length} valgt`
                : `${synlige.length} ${synlige.length === 1 ? 'sak' : 'saker'} · kryss av for å arkivere flere på én gang (shift-klikk velger et område)`}
            </span>
          </Listehode>
          {synlige.map((s, i) => (
            <li key={s.id} data-valgt={valgt.has(s.id) ? '' : undefined}>
              <Avkryss>
                <input
                  type="checkbox"
                  checked={valgt.has(s.id)}
                  onChange={() => {}}
                  onClick={(e) => velg(i, s.id, e.shiftKey)}
                  aria-label={`Velg ${s.bedrift || s.navn || s.epost}`}
                />
              </Avkryss>
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

      {(valgteSaker.length > 0 || melding) && (
        <Handlingslinje role="region" aria-label="Handlinger for valgte saker">
          {valgteSaker.length > 0 ? (
            <>
              <strong>
                {valgteSaker.length} {valgteSaker.length === 1 ? 'sak' : 'saker'} valgt
              </strong>
              <Knapp type="button" $hoved disabled={flytter} onClick={() => flyttValgte('lukket')}>
                {flytter ? 'Flytter …' : 'Arkiver (ikke aktuell)'}
              </Knapp>
              <select
                value=""
                disabled={flytter}
                onChange={(e) => e.target.value && flyttValgte(e.target.value as Status)}
                aria-label="Flytt valgte til status"
              >
                <option value="">Flytt til …</option>
                {STATUSER.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.navn}
                  </option>
                ))}
              </select>
              <button type="button" className="avbryt" onClick={() => setValgt(new Set())}>
                Fjern valg
              </button>
            </>
          ) : (
            <span role="status">{melding}</span>
          )}
        </Handlingslinje>
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

  > li:not(:first-child) {
    display: flex;
  }

  > li > a {
    flex: 1;
    min-width: 0;
    padding-left: 0;
  }

  > li[data-valgt] {
    background: ${({ theme }) => theme.colors.accentSoft};
  }
`

const Listehode = styled.li`
  display: flex;
  align-items: center;
  padding: 0.35rem 1rem 0.35rem 0;
  background: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: var(--fs-micro);
`

const Avkryss = styled.label`
  display: grid;
  flex: none;
  place-items: center;
  align-self: stretch;
  width: 2.75rem;
  cursor: pointer;

  input {
    width: 17px;
    height: 17px;
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.accentVivid};
    cursor: pointer;
  }
`

/** Ligger fast nederst når noe er valgt – som i Gmail. */
const Handlingslinje = styled.div`
  position: sticky;
  bottom: 1rem;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  width: fit-content;
  max-width: 100%;
  margin: 1rem auto 0;
  padding: 0.6rem 0.75rem 0.6rem 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  font-size: var(--fs-small);

  strong {
    margin-right: 0.25rem;
    font-weight: 600;
  }

  select {
    min-height: 40px;
    padding: 0 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.borderInverted};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.deepRaised};
    color: ${({ theme }) => theme.colors.inkInverted};
    font: inherit;
  }

  .avbryt {
    padding: 0 0.5rem;
    border: 0;
    background: none;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    font: inherit;
    cursor: pointer;

    &:hover {
      color: ${({ theme }) => theme.colors.inkInverted};
    }
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

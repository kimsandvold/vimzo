import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, IngenTilgang, Knapp } from './felles'
import { dato, kr } from './format'
import {
  BESTILLINGSSTATUSER,
  lyttLogobestillinger,
  produktnavn,
  settBestillingsstatus,
  type Bestillingsstatus,
  type Logobestilling,
} from '../../../lib/logobestillinger'

const MVA = 0.25

/**
 * Ordrelinjene fra logoverktøyet, i /admin/logo.
 *
 * Kunden laster ned filene i det han bestiller, og betaler med faktura
 * etterpå. Dette er arbeidslista: hva som er lastet ned og må faktureres,
 * hva som er fakturert og venter på betaling, og hva som er betalt. Det som
 * trenger deg – levert, men ikke fakturert – står først. «Kopier fakturagrunnlag» legger alt du trenger i
 * fakturaprogrammet på utklippstavla, med mva regnet ut.
 */
export default function Logobestillinger() {
  return (
    <AdminRamme tittel="Logobestillinger">
      <Oversikt />
    </AdminRamme>
  )
}

type Filter = 'apne' | 'alle' | Bestillingsstatus

function Oversikt() {
  const [liste, setListe] = useState<Logobestilling[] | null>(null)
  const [feil, setFeil] = useState<Error | null>(null)
  const [filter, setFilter] = useState<Filter>('apne')
  const [kopiert, setKopiert] = useState<string | null>(null)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttLogobestillinger(setListe, setFeil).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [])

  const apen = (b: Logobestilling) => b.status !== 'betalt' && b.status !== 'kansellert'

  const tall = useMemo(() => {
    const alle = liste ?? []
    const sum = (s: Bestillingsstatus) => alle.filter((b) => b.status === s).reduce((n, b) => n + b.pris, 0)
    return {
      aFakturere: sum('levert'),
      utestaende: sum('fakturert'),
      betalt: sum('betalt'),
    }
  }, [liste])

  const synlige = useMemo(() => {
    const rang: Record<Bestillingsstatus, number> = { levert: 0, ny: 1, fakturert: 2, betalt: 3, kansellert: 4 }
    return (liste ?? [])
      .filter((b) => (filter === 'apne' ? apen(b) : filter === 'alle' ? true : b.status === filter))
      .sort((a, b) => rang[a.status] - rang[b.status] || b.opprettet - a.opprettet)
  }, [liste, filter])

  if (feil) return <IngenTilgang feil={feil} />
  if (!liste) return <Dempet>Henter bestillinger …</Dempet>

  async function kopier(b: Logobestilling) {
    const mva = Math.round(b.pris * MVA)
    const tekst = [
      `Kunde: ${b.bedrift || '–'}${b.orgnr ? ` · Org.nr ${b.orgnr}` : ''}`,
      `Fakturaadresse: ${[b.adresse, `${b.postnr} ${b.poststed}`.trim()].filter(Boolean).join(', ') || '–'}`,
      `Kontakt: ${b.navn || '–'} · ${b.epost}${b.telefon ? ` · ${b.telefon}` : ''}`,
      b.merknad ? `Merknad: ${b.merknad}` : null,
      '',
      `${produktnavn(b.produkt)} (logoverktøyet, bestilling ${b.id}, lastet ned ${dato(b.opprettet, true)})`,
      `Beløp eks. mva: ${kr(b.pris)}`,
      `Mva 25 %: ${kr(mva)}`,
      `Totalt: ${kr(b.pris + mva)}`,
    ]
      .filter((l): l is string => l !== null)
      .join('\n')
    try {
      await navigator.clipboard.writeText(tekst)
      setKopiert(b.id)
      window.setTimeout(() => setKopiert((k) => (k === b.id ? null : k)), 2000)
    } catch {
      window.prompt('Kopier fakturagrunnlaget:', tekst)
    }
  }

  return (
    <>
      <Hode>
        <div>
          <h1>Logobestillinger</h1>
        </div>
      </Hode>

      <Tall>
        <Tallkort $fremhev={tall.aFakturere > 0} onClick={() => setFilter('levert')}>
          <span>Skal faktureres</span>
          <strong>{kr(tall.aFakturere)}</strong>
        </Tallkort>
        <Tallkort onClick={() => setFilter('fakturert')}>
          <span>Fakturert – utestående</span>
          <strong>{kr(tall.utestaende)}</strong>
        </Tallkort>
        <Tallkort onClick={() => setFilter('betalt')}>
          <span>Betalt</span>
          <strong>{kr(tall.betalt)}</strong>
        </Tallkort>
      </Tall>

      <Filtre>
        {(['apne', 'alle'] as Filter[]).concat(BESTILLINGSSTATUSER.map((s) => s.id)).map((f) => (
          <Filterknapp key={f} $valgt={filter === f} onClick={() => setFilter(f)}>
            {f === 'apne' ? 'Åpne' : f === 'alle' ? 'Alle' : BESTILLINGSSTATUSER.find((s) => s.id === f)?.navn}
          </Filterknapp>
        ))}
      </Filtre>

      {synlige.length === 0 ? (
        <Tom>
          {liste.length === 0
            ? 'Ingen bestillinger ennå. De dukker opp her – og i innboksen din – når noen bestiller fra logoverktøyet.'
            : 'Ingen bestillinger her.'}
        </Tom>
      ) : (
        <Liste>
          {synlige.map((b) => (
            <Linje key={b.id} $status={b.status}>
              <Hvem>
                <strong>
                  {b.uid ? (
                    <Link to={`/admin/kunde/${b.uid}`} title="Åpne kundekortet">
                      {b.bedrift || '(uten firmanavn)'}
                    </Link>
                  ) : (
                    b.bedrift || '(uten firmanavn)'
                  )}
                </strong>
                <span>
                  {b.navn && `${b.navn} · `}
                  <a href={`mailto:${b.epost}`}>{b.epost}</a>
                  {b.telefon && ` · ${b.telefon}`}
                </span>
                {(b.orgnr || b.adresse) && (
                  <span>
                    {b.orgnr && `Org.nr ${b.orgnr} · `}
                    {[b.adresse, `${b.postnr} ${b.poststed}`.trim()].filter(Boolean).join(', ')}
                  </span>
                )}
                {b.merknad && <em>{b.merknad}</em>}
              </Hvem>
              <Hva>
                {produktnavn(b.produkt)}
                <strong>{kr(b.pris)}</strong>
                <small>{kr(Math.round(b.pris * (1 + MVA)))} inkl. mva</small>
              </Hva>
              <Naar>
                <small>Bestilt og lastet ned</small>
                {dato(b.opprettet, true)}
              </Naar>
              <Handlinger>
                <label>
                  <span className="skjult">Status for {b.bedrift || b.epost}</span>
                  <select
                    value={b.status}
                    onChange={(e) => settBestillingsstatus(b.id, e.target.value as Bestillingsstatus)}
                  >
                    {BESTILLINGSSTATUSER.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.navn}
                      </option>
                    ))}
                  </select>
                </label>
                <Knapp type="button" onClick={() => kopier(b)}>
                  {kopiert === b.id ? 'Kopiert' : 'Kopier fakturagrunnlag'}
                </Knapp>
                <Apne to={`/logo/profil/${b.id}`} target="_blank" rel="noopener">
                  Åpne design ↗
                </Apne>
              </Handlinger>
            </Linje>
          ))}
        </Liste>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ stil */

const Hode = styled.div`
  margin-bottom: 1.5rem;

  h1 {
    margin-top: 0.4rem;
    font-size: var(--fs-title);
    letter-spacing: var(--ls-title);
  }
`

const Tall = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`

const Tallkort = styled.button<{ $fremhev?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  border: 1px solid ${({ theme, $fremhev }) => ($fremhev ? theme.colors.accentVivid : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $fremhev }) => ($fremhev ? theme.colors.accentSoft : theme.colors.surface)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  span {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  strong {
    font-size: var(--fs-lead);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Filtre = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
`

const Filterknapp = styled.button<{ $valgt: boolean }>`
  min-height: 36px;
  padding: 0 0.9rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.sunken)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.inkInverted : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  cursor: pointer;
`

const Tom = styled.p`
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Liste = styled.ul`
  display: grid;
  gap: 0.5rem;
  list-style: none;
`

const Linje = styled.li<{ $status: Bestillingsstatus }>`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 0.8fr) auto;
  gap: 1rem 1.5rem;
  align-items: center;
  padding: 1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid
    ${({ theme, $status }) =>
      $status === 'ny' ? theme.colors.accentVivid : $status === 'levert' ? theme.colors.warning : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  opacity: ${({ $status }) => ($status === 'kansellert' ? 0.6 : 1)};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Hvem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;

  strong {
    font-weight: 600;
  }

  span,
  em {
    font-size: var(--fs-small);
    font-style: normal;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow-wrap: anywhere;
  }

  a {
    color: inherit;
  }
`

const Hva = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};

  strong {
    font-size: var(--fs-body);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.ink};
  }

  small {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Naar = styled.div`
  display: flex;
  flex-direction: column;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};

  small {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;

  .skjult {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  select {
    min-height: 40px;
    padding: 0 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.surface};
    font-family: inherit;
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.ink};
  }

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`

const Apne = styled(Link)`
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
`

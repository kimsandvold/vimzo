import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, IngenTilgang, Knapp } from './felles'
import { dato, kr } from './format'
import { useKunder } from './useKunder'
import { somCsv, treffer, type Kunde } from '../../../lib/kunder'
import { formaterOrgnr } from '../../../lib/profil'

/**
 * /admin/kunder – alle som har konto eller har bestilt.
 *
 * Det er her du finner en kunde igjen når e-posten med ordren er borte:
 * søk på navn, bedrift, orgnummer, telefon eller e-post. Hele lista kan
 * lastes ned som CSV, som en sikkerhetskopi du eier selv.
 */
export default function KunderSide() {
  return (
    <AdminRamme tittel="Kunder">
      <Innhold />
    </AdminRamme>
  )
}

function Innhold() {
  const { kunder, feil } = useKunder()
  if (feil) return <IngenTilgang feil={feil} />
  if (!kunder) return <Dempet>Henter kunder …</Dempet>
  return <Kundeliste kunder={kunder} />
}

type Filter = 'alle' | 'kjopt' | 'profil' | 'uten'

export function Kundeliste({ kunder }: { kunder: Kunde[] }) {
  const [sok, setSok] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')

  const tall = useMemo(
    () => ({
      alle: kunder.length,
      kjopt: kunder.filter((k) => k.bestillinger.length > 0).length,
      profil: kunder.filter((k) => k.profil?.fullfort).length,
      uten: kunder.filter((k) => !k.profil?.fullfort).length,
      omsetning: kunder.reduce((n, k) => n + k.omsetning, 0),
    }),
    [kunder],
  )

  const synlige = useMemo(
    () =>
      kunder
        .filter((k) =>
          filter === 'kjopt'
            ? k.bestillinger.length > 0
            : filter === 'profil'
              ? k.profil?.fullfort
              : filter === 'uten'
                ? !k.profil?.fullfort
                : true,
        )
        .filter((k) => treffer(k, sok)),
    [kunder, filter, sok],
  )

  function lastNed() {
    const blob = new Blob([somCsv(kunder)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vimzo-kunder-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const filtre: Array<[Filter, string, number]> = [
    ['alle', 'Alle', tall.alle],
    ['kjopt', 'Har bestilt', tall.kjopt],
    ['profil', 'Profil utfylt', tall.profil],
    ['uten', 'Bare innlogget', tall.uten],
  ]

  return (
    <>
      <Hode>
        <div>
          <h1>Kunder</h1>
          <p>
            {tall.alle} kontoer · {tall.kjopt} har bestilt · {kr(tall.omsetning)} i logobestillinger
          </p>
        </div>
        <Knapp type="button" onClick={lastNed} disabled={kunder.length === 0}>
          Last ned som CSV
        </Knapp>
      </Hode>

      <Verktoy>
        <Filtre>
          {filtre.map(([f, navn, n]) => (
            <Filterknapp key={f} type="button" $valgt={filter === f} onClick={() => setFilter(f)}>
              {navn} <em>{n}</em>
            </Filterknapp>
          ))}
        </Filtre>
        <Sok
          type="search"
          placeholder="Søk på navn, bedrift, orgnr, telefon, e-post …"
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          aria-label="Søk i kunder"
        />
      </Verktoy>

      {synlige.length === 0 ? (
        <Tom>
          {kunder.length === 0
            ? 'Ingen kunder ennå. Alle som logger inn på Min side eller bestiller en logo, dukker opp her.'
            : 'Ingen treff.'}
        </Tom>
      ) : (
        <Tabell>
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Kontakt</th>
              <th>Bestillinger</th>
              <th>Registrert</th>
            </tr>
          </thead>
          <tbody>
            {synlige.map((k) => (
              <tr key={k.uid}>
                <td>
                  <Navn to={`/admin/kunde/${k.uid}`}>
                    <strong>{k.bedrift || k.navn || '(uten navn)'}</strong>
                    <span>
                      {[k.bedrift && k.navn, k.orgnr && `Org.nr. ${formaterOrgnr(k.orgnr)}`].filter(Boolean).join(' · ') ||
                        (k.profil?.fullfort ? 'Privat' : 'Har ikke fylt ut profilen')}
                    </span>
                  </Navn>
                </td>
                <td>
                  <Kontakt>
                    <a href={`mailto:${k.epost}`}>{k.epost || '–'}</a>
                    {k.telefon && <a href={`tel:${k.telefon.replace(/\s/g, '')}`}>{k.telefon}</a>}
                  </Kontakt>
                </td>
                <td>
                  {k.bestillinger.length > 0 ? (
                    <Tall>
                      {k.bestillinger.length} · {kr(k.omsetning)}
                    </Tall>
                  ) : (
                    <Dempet>–</Dempet>
                  )}
                </td>
                <td>
                  <Tall>{k.registrert ? dato(k.registrert) : '–'}</Tall>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabell>
      )}
    </>
  )
}

const Hode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
  }

  p {
    margin: 0.25rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
  }
`

const Verktoy = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`

const Filtre = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const Filterknapp = styled.button<{ $valgt: boolean }>`
  min-height: 36px;
  padding: 0 0.85rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  cursor: pointer;

  em {
    margin-left: 0.25rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-style: normal;
  }
`

const Sok = styled.input`
  flex: 0 1 320px;
  min-height: 40px;
  padding: 0 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: var(--fs-small);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Tom = styled.p`
  padding: 2.5rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkMuted};
  text-align: center;
`

const Tabell = styled.table`
  width: 100%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border-collapse: separate;
  border-spacing: 0;
  background: ${({ theme }) => theme.colors.surface};
  font-size: var(--fs-small);

  th {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
  }

  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.sunken};
  }

  @media (max-width: 760px) {
    thead {
      display: none;
    }

    tr {
      display: grid;
      gap: 0.35rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }

    td {
      padding: 0;
      border: 0;
    }
  }
`

const Navn = styled(Link)`
  display: grid;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;

  strong {
    font-weight: 600;
  }

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }

  &:hover strong {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Kontakt = styled.div`
  display: grid;

  a {
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  a + a {
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Tall = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

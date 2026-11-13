import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAdmin as useKonto } from '../Admin/kontekst'
import { lyttMineProsjekter } from '../../../lib/prosjekter'
import { KUNDESTATUS, type Prosjekt } from '../../../data/prosjekt'
import { dagerTil, ettArFrem, fristerFor, iDag, type Frist } from '../../../lib/frister'
import { lastNedIcs } from '../../../lib/ics'
import { erKundens, velgStudiologo } from '../../../lib/logodesign'
import { fristlenke, formaterOrgnr, selskapsform } from '../../../lib/profil'
import { Knapp } from '../../../ui'
import Icon, { type IkonNavn } from '../../shared/Icon'
import MinSideRamme from './Ramme'
import { useMinSide } from './kontekst'
import { Etikett, Flate } from './stil'

/**
 * Min side – oversikten.
 *
 * En arbeidsflate, ikke en forside: tre nøkkeltall øverst, så de kommende
 * fristene ved siden av profilen og snarveiene. Alt som er mer enn et blikk,
 * ligger én klikk unna i sidemenyen.
 */
export default function MinSide() {
  return (
    <MinSideRamme seoTittel="Min side – Vimzo" tittel={<Hilsen />} undertittel={<Dato />}>
      <Oversikt />
    </MinSideRamme>
  )
}

function Hilsen() {
  const { bruker } = useKonto()
  const { profil } = useMinSide()
  const fornavn = (profil?.person.navn || bruker.displayName || '').trim().split(/\s+/)[0]
  return <>{fornavn ? `Hei, ${fornavn}` : 'Oversikt'}</>
}

function Dato() {
  const d = new Intl.DateTimeFormat('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return <>{d.charAt(0).toUpperCase() + d.slice(1)}</>
}

const fmt = (t: string, o: Intl.DateTimeFormatOptions) => {
  const [a, m, d] = t.split('-').map(Number)
  return new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', ...o }).format(new Date(Date.UTC(a, m - 1, d)))
}

function nar(dager: number): string {
  if (dager === 0) return 'i dag'
  if (dager === 1) return 'i morgen'
  return `om ${dager} dager`
}

function Oversikt() {
  const { bruker } = useKonto()
  const { profil, logoer } = useMinSide()
  const [prosjekter, settProsjekter] = useState<Prosjekt[] | null>(null)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttMineProsjekter(bruker.email ?? '', settProsjekter, () => settProsjekter([])).then((s) =>
      aktiv ? (stopp = s) : s(),
    )
    return () => {
      aktiv = false
      stopp()
    }
  }, [bruker.email])

  const bedrift = profil?.bedrift ?? null
  const valg = profil?.frister ?? null
  const form = bedrift ? selskapsform(bedrift.formkode) : null
  const idag = iDag()
  const frister = useMemo<Frist[]>(
    () => (form && valg ? fristerFor({ form, ...valg }, idag, ettArFrem(idag)) : []),
    [form, valg, idag],
  )
  const neste = frister[0] ?? null
  const studio = velgStudiologo(logoer)
  const kjopt = (logoer ?? []).filter(erKundens).length
  const prosjekt = prosjekter?.[0] ?? null
  const fristside = bedrift && valg ? fristlenke(bedrift, valg, '/min-side/verktoy/frister') : '/min-side/verktoy/frister'

  return (
    <>
      {profil !== undefined && !profil?.fullfort && (
        <Oppstart>
          <div>
            <strong>Fyll inn profilen – så blir alt her ditt</strong>
            <p>Orgnummeret henter resten fra Brønnøysund. Da får du fristene her, og signaturen fyller seg selv.</p>
          </div>
          <Knapp til="/min-side/profil" ikon="pilHoyre">
            Fyll inn profilen
          </Knapp>
        </Oppstart>
      )}

      <Nokkeltall>
        <Tall to={fristside}>
          <Etikett>Neste frist</Etikett>
          {neste ? (
            <>
              <strong data-snart={dagerTil(idag, neste.dato) <= 7 ? '' : undefined}>
                {nar(dagerTil(idag, neste.dato)).replace(/^./, (c) => c.toUpperCase())}
              </strong>
              <span>
                {neste.tittel} · {fmt(neste.dato, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </>
          ) : (
            <>
              <strong>–</strong>
              <span>{bedrift ? 'Ingen frister funnet' : 'Legg inn bedriften for å se dem'}</span>
            </>
          )}
        </Tall>
        <Tall to="/min-side/logoer">
          <Etikett>Logoer</Etikett>
          <strong>{logoer === null ? '…' : logoer.length}</strong>
          <span>
            {logoer && logoer.length > 0
              ? `${kjopt} kjøpt · ${logoer.length - kjopt} utkast`
              : 'Lag din første på et par minutter'}
          </span>
        </Tall>
        <Tall to="/min-side/nettside">
          <Etikett>Nettsiden</Etikett>
          <strong>{prosjekt ? KUNDESTATUS[prosjekt.status] : prosjekter === null ? '…' : 'Ingen ennå'}</strong>
          <span>{prosjekt ? prosjekt.tittel : 'Se hva en nettside koster'}</span>
        </Tall>
      </Nokkeltall>

      <ToKolonner>
        <Flate>
          <Korthode>
            <h2>Kommende frister</h2>
            {frister.length > 0 && <Link to={fristside}>Hele året →</Link>}
          </Korthode>
          {frister.length > 0 ? (
            <>
              <Fristliste>
                {frister.slice(0, 6).map((f) => {
                  const dager = dagerTil(idag, f.dato)
                  return (
                    <li key={f.id}>
                      <Dag>
                        <b>{Number(f.dato.slice(8))}</b>
                        <span>{fmt(f.dato, { month: 'short' }).replace('.', '')}</span>
                      </Dag>
                      <div>
                        <a href={f.lenke} target="_blank" rel="noopener noreferrer">
                          {f.tittel}
                        </a>
                        <p>{f.hva}</p>
                      </div>
                      <Merke data-snart={dager <= 7 ? '' : undefined}>{nar(dager)}</Merke>
                    </li>
                  )
                })}
              </Fristliste>
              <Bunnlinje>
                <Knapp variant="myk" ikon="pilNed" onClick={() => lastNedIcs(frister, bedrift?.navn ?? 'bedrift')}>
                  Legg alle i kalenderen
                </Knapp>
                <span>{frister.length} frister de neste tolv månedene</span>
              </Bunnlinje>
            </>
          ) : (
            <Tomt>
              <Icon navn="klokke" storrelse={22} tykkelse={1.8} />
              <p>
                {bedrift && !form
                  ? 'Fristkalenderen har foreløpig regler for enkeltpersonforetak og aksjeselskap.'
                  : 'Legg inn bedriften i profilen, så ser du mva, lønn, skatt og årsoppgjør her – flyttet riktig rundt helger og helligdager.'}
              </p>
              {!bedrift && <Link to="/min-side/profil">Legg inn bedriften →</Link>}
            </Tomt>
          )}
        </Flate>

        <Hoyre>
          <Flate>
            <Korthode>
              <h2>Profilen</h2>
              <Link to="/min-side/profil">{profil?.fullfort ? 'Endre' : 'Fyll inn'}</Link>
            </Korthode>
            {profil?.fullfort ? (
              <Profilinfo>
                {bedrift && (
                  <>
                    <strong>{bedrift.navn}</strong>
                    {bedrift.orgnr && <span>Org.nr. {formaterOrgnr(bedrift.orgnr)}</span>}
                  </>
                )}
                <span>
                  {profil.person.navn}
                  {profil.person.tittel && `, ${profil.person.tittel.toLowerCase()}`}
                </span>
                {profil.person.telefon && <span>{profil.person.telefon}</span>}
                {(profil.person.epost || bedrift?.epost) && <span>{profil.person.epost || bedrift?.epost}</span>}
              </Profilinfo>
            ) : (
              <Profilinfo>
                <span>Navn, kontaktinfo og bedriften – brukes i signaturen, fristene og på tilbud.</span>
              </Profilinfo>
            )}
          </Flate>

          <Flate>
            <Korthode>
              <h2>Snarveier</h2>
            </Korthode>
            <Snarveier>
              {(
                [
                  ['/logo', 'pluss', 'Lag ny logo'],
                  [studio ? `/min-side/studio/${studio.id}` : '/logo', 'epost', 'E-postsignatur'],
                  ['/min-side/verktoy/timepris' + (form ? `?drift=${form}` : ''), 'graf', 'Regn ut timepris'],
                  ['/navnesjekk', 'sok', 'Sjekk et firmanavn'],
                ] as Array<[string, IkonNavn, string]>
              ).map(([til, ikon, navn]) => (
                <li key={navn}>
                  <Link to={til}>
                    <Icon navn={ikon} storrelse={17} tykkelse={1.8} />
                    {navn}
                  </Link>
                </li>
              ))}
            </Snarveier>
          </Flate>
        </Hoyre>
      </ToKolonner>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Stil                                                                */
/* ------------------------------------------------------------------ */

const Oppstart = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
  padding: 1.1rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  strong {
    font-size: var(--fs-body);
    font-weight: 600;
  }

  p {
    margin: 0.2rem 0 0;
    font-size: var(--fs-small);
  }
`

const Nokkeltall = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  /* På telefon: en rad man sveiper i, i stedet for tre kort under hverandre. */
  @media (max-width: 760px) {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: 72%;
    margin: 0 calc(-1 * clamp(1rem, 3vw, 2rem));
    padding: 0 clamp(1rem, 3vw, 2rem);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      scroll-snap-align: start;
    }
  }
`

const Tall = styled(Link)`
  display: grid;
  align-content: start;
  padding: 1.1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  transition: border-color ${({ theme }) => theme.transitions.default};

  ${Etikett} {
    margin-bottom: 0.4rem;
  }

  strong {
    overflow: hidden;
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong[data-snart] {
    color: ${({ theme }) => theme.colors.accent};
  }

  span {
    overflow: hidden;
    margin-top: 0.15rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const ToKolonner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
  margin-top: 0.75rem;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Hoyre = styled.div`
  display: grid;
  gap: 0.75rem;
`

const Korthode = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;

  h2 {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

const Fristliste = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 2.75rem minmax(0, 1fr) auto;
    gap: 0.9rem;
    align-items: center;
    padding: 0.7rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  a {
    color: ${({ theme }) => theme.colors.ink};
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  p {
    overflow: hidden;
    margin: 0.1rem 0 0;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Dag = styled.div`
  display: grid;
  place-items: center;
  height: 2.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.sunken};
  line-height: 1;

  b {
    font-size: var(--fs-body);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  span {
    margin-top: -0.35rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }
`

const Merke = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: var(--fs-micro);
  white-space: nowrap;

  &[data-snart] {
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
    font-weight: 500;
  }
`

const Bunnlinje = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-small);
  }
`

const Tomt = styled.div`
  display: grid;
  justify-items: start;
  gap: 0.5rem;
  padding: 1.25rem 0 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.inkSubtle};

  p {
    max-width: 46ch;
    margin: 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
    line-height: 1.55;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;
  }
`

const Profilinfo = styled.div`
  display: grid;
  gap: 0.2rem;

  strong {
    font-size: var(--fs-body);
    font-weight: 600;
  }

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
    text-overflow: ellipsis;
  }
`

const Snarveier = styled.ul`
  display: grid;
  gap: 2px;
  margin: 0 -0.5rem;
  padding: 0;
  list-style: none;

  a {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-height: 38px;
    padding: 0 0.5rem;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    color: ${({ theme }) => theme.colors.ink};
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;

    svg {
      color: ${({ theme }) => theme.colors.accent};
    }

    &:hover {
      background: ${({ theme }) => theme.colors.sunken};
    }
  }
`

import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, IngenTilgang, Knapp, StatusMerke } from './felles'
import { dato, kr } from './format'
import { useKunder } from './useKunder'
import { fakturablokk, type Kunde } from '../../../lib/kunder'
import { BESTILLINGSSTATUSER, produktnavn } from '../../../lib/logobestillinger'
import { erKundens, lyttMineDesign, type LagretDesign } from '../../../lib/logodesign'
import { lyttSaker } from '../../../lib/henvendelser'
import { formaterKontonummer, formaterOrgnr } from '../../../lib/profil'
import type { Sak } from '../../../data/saker'

/**
 * /admin/kunde/:uid – alt vi vet om én kunde, på ett sted.
 *
 * Laget for dagen e-posten med ordren er borte: kontaktinfo og
 * fakturaopplysninger med kopiknapper, og så det kunden har gjort hos oss –
 * logobestillinger, logoer og saker.
 */
export default function KundeSide() {
  return (
    <AdminRamme tittel="Kunde">
      <Innhold />
    </AdminRamme>
  )
}

function Innhold() {
  const { uid = '' } = useParams()
  const { kunder, feil } = useKunder()
  const [logoer, setLogoer] = useState<LagretDesign[] | null>(null)
  const [saker, setSaker] = useState<Sak[] | null>(null)

  useEffect(() => {
    let stopp: Array<() => void> = []
    let aktiv = true
    Promise.all([lyttMineDesign(uid, setLogoer, () => setLogoer([])), lyttSaker(setSaker, () => setSaker([]))]).then((s) =>
      aktiv ? (stopp = s) : s.forEach((f) => f()),
    )
    return () => {
      aktiv = false
      stopp.forEach((f) => f())
    }
  }, [uid])

  if (feil) return <IngenTilgang feil={feil} />
  if (!kunder) return <Dempet>Henter kunden …</Dempet>
  const kunde = kunder.find((k) => k.uid === uid)
  if (!kunde)
    return (
      <Dempet>
        Fant ingen kunde med denne kontoen. <Link to="/admin/kunder">Til kundelisten</Link>
      </Dempet>
    )

  const adresser = [kunde.epost, kunde.kontaktEpost].filter(Boolean).map((a) => a.toLowerCase())
  const sine = (saker ?? []).filter((s) => adresser.includes(s.epost.toLowerCase()))
  return <Kundekort kunde={kunde} logoer={logoer} saker={sine} />
}

export function Kundekort({ kunde: k, logoer, saker }: { kunde: Kunde; logoer: LagretDesign[] | null; saker: Sak[] }) {
  const p = k.profil
  const b = p?.bedrift
  const [kopiert, setKopiert] = useState(false)

  async function kopierFaktura() {
    if (await kopier(fakturablokk(k))) {
      setKopiert(true)
      setTimeout(() => setKopiert(false), 2000)
    }
  }

  return (
    <>
      <Tilbake to="/admin/kunder">← Kunder</Tilbake>
      <Hode>
        <div>
          <h1>{k.bedrift || k.navn || k.epost}</h1>
          <p>
            Kunde siden {k.registrert ? dato(k.registrert) : '–'} ·{' '}
            {p?.fullfort ? 'Profil utfylt' : p ? 'Bare innlogget – profilen er ikke fylt ut' : 'Har bestilt, men ikke logget inn etter at profilene kom'}
          </p>
        </div>
        <Knapper>
          {k.epost && (
            <Knapp as="a" href={`mailto:${k.kontaktEpost || k.epost}`}>
              Send e-post
            </Knapp>
          )}
          <Knapp type="button" $hoved onClick={kopierFaktura}>
            {kopiert ? 'Kopiert ✓' : 'Kopier fakturainfo'}
          </Knapp>
        </Knapper>
      </Hode>

      <Rutenett>
        <Spalte>
          <Kort>
            <h2>Kontakt</h2>
            <Rader>
              <Rad navn="Navn" verdi={k.navn} />
              <Rad navn="Tittel" verdi={p?.person.tittel} />
              <Rad navn="Telefon" verdi={k.telefon} lenke={k.telefon && `tel:${k.telefon.replace(/\s/g, '')}`} />
              <Rad navn="E-post (innlogging)" verdi={k.epost} lenke={k.epost && `mailto:${k.epost}`} />
              <Rad navn="E-post (kontakt)" verdi={k.kontaktEpost} lenke={k.kontaktEpost && `mailto:${k.kontaktEpost}`} />
            </Rader>
          </Kort>

          <Kort>
            <h2>Bedrift og faktura</h2>
            {k.bedrift || k.orgnr || k.adresse ? (
              <Rader>
                <Rad navn="Bedrift" verdi={k.bedrift} />
                <Rad
                  navn="Org.nr."
                  verdi={k.orgnr && formaterOrgnr(k.orgnr)}
                  kopi={k.orgnr}
                  lenke={k.orgnr && `https://virksomhet.brreg.no/oppslag/enheter/${k.orgnr}`}
                />
                <Rad navn="Adresse" verdi={[k.adresse, [k.postnr, k.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ')} />
                <Rad navn="Telefon" verdi={b?.telefon} />
                <Rad navn="E-post" verdi={b?.epost} />
                <Rad navn="Nettside" verdi={b?.nettside} lenke={b?.nettside && (b.nettside.startsWith('http') ? b.nettside : `https://${b.nettside}`)} />
                <Rad navn="Kontonummer" verdi={k.kontonummer && formaterKontonummer(k.kontonummer)} kopi={k.kontonummer} />
              </Rader>
            ) : (
              <Tomt>Ingen bedrift registrert.</Tomt>
            )}
          </Kort>

          <Kort>
            <h2>Konto</h2>
            <Rader>
              <Rad navn="Konto-id" verdi={k.uid} />
              <Rad navn="Registrert" verdi={k.registrert ? dato(k.registrert, true) : ''} />
              <Rad navn="Profil oppdatert" verdi={p?.oppdatert ? dato(p.oppdatert, true) : ''} />
            </Rader>
          </Kort>
        </Spalte>

        <Spalte>
          <Kort>
            <Korthode>
              <h2>Logobestillinger</h2>
              {k.bestillinger.length > 0 && <span>{kr(k.omsetning)} eks. mva</span>}
            </Korthode>
            {k.bestillinger.length === 0 ? (
              <Tomt>Ingen bestillinger.</Tomt>
            ) : (
              <Liste>
                {k.bestillinger.map((o) => (
                  <li key={o.id}>
                    <div>
                      <strong>{produktnavn(o.produkt)}</strong>
                      <span>
                        {dato(o.opprettet, true)} · {o.bedrift || 'uten firmanavn'}
                      </span>
                    </div>
                    <Belop>{kr(o.pris)}</Belop>
                    <Merke $status={o.status}>{BESTILLINGSSTATUSER.find((s) => s.id === o.status)?.navn}</Merke>
                  </li>
                ))}
              </Liste>
            )}
            {k.bestillinger.length > 0 && <Mer to="/admin/logo">Til logobestillinger →</Mer>}
          </Kort>

          <Kort>
            <Korthode>
              <h2>Logoer</h2>
              {logoer && logoer.length > 0 && (
                <span>
                  {logoer.filter(erKundens).length} kjøpt · {logoer.length} totalt
                </span>
              )}
            </Korthode>
            {logoer === null ? (
              <Dempet>Henter …</Dempet>
            ) : logoer.length === 0 ? (
              <Tomt>Ingen lagrede logoer.</Tomt>
            ) : (
              <Logoer>
                {logoer.map((d) => (
                  <li key={d.id}>
                    <figure>
                      {d.forhandsvisning ? (
                        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(d.forhandsvisning)}`} alt="" />
                      ) : null}
                    </figure>
                    <strong>{d.navn || 'Uten navn'}</strong>
                    <span>{erKundens(d) ? 'Kjøpt' : 'Utkast'} · {dato(d.oppdatert)}</span>
                  </li>
                ))}
              </Logoer>
            )}
          </Kort>

          <Kort>
            <h2>Saker</h2>
            {saker.length === 0 ? (
              <Tomt>Ingen saker på disse e-postadressene.</Tomt>
            ) : (
              <Liste>
                {saker.map((s) => (
                  <li key={s.id}>
                    <div>
                      <Link to={`/admin/sak/${s.id}`}>{s.bedrift || s.navn || s.epost}</Link>
                      <span>
                        {dato(s.opprettet)} · {s.pakke || 'uten pakke'}
                      </span>
                    </div>
                    <StatusMerke status={s.status} />
                  </li>
                ))}
              </Liste>
            )}
          </Kort>
        </Spalte>
      </Rutenett>
    </>
  )
}

async function kopier(tekst: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst)
    return true
  } catch {
    window.prompt('Kopier:', tekst)
    return false
  }
}

/** Én linje: etikett, verdi og en kopiknapp. Tomme verdier vises som strek. */
function Rad({ navn, verdi, lenke, kopi }: { navn: string; verdi?: string | null; lenke?: string | null | false | ''; kopi?: string }) {
  const [ok, setOk] = useState(false)
  const v = verdi?.trim()
  let innhold: ReactNode = v || <Dempet>–</Dempet>
  if (v && lenke)
    innhold = (
      <a href={lenke} target={lenke.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {v}
      </a>
    )
  return (
    <>
      <dt>{navn}</dt>
      <dd>
        <span>{innhold}</span>
        {v && (
          <Kopiknapp
            type="button"
            aria-label={`Kopier ${navn.toLowerCase()}`}
            title="Kopier"
            onClick={async () => {
              if (await kopier(kopi ?? v)) {
                setOk(true)
                setTimeout(() => setOk(false), 1500)
              }
            }}
          >
            {ok ? '✓' : 'Kopier'}
          </Kopiknapp>
        )}
      </dd>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Stil                                                                */
/* ------------------------------------------------------------------ */

const Tilbake = styled(Link)`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Hode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.5rem 0 1.25rem;

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

const Knapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Spalte = styled.div`
  display: grid;
  gap: 0.75rem;
`

const Kort = styled.section`
  padding: 1.1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0 0 0.75rem;
    font-size: var(--fs-body);
    font-weight: 600;
  }
`

const Korthode = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-small);
  }
`

const Rader = styled.dl`
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  margin: 0;
  font-size: var(--fs-small);

  dt,
  dd {
    padding: 0.5rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  dd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
    margin: 0;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);

    dt {
      padding-bottom: 0;
    }

    dd {
      padding-top: 0.15rem;
      border-top: 0;
    }
  }
`

const Kopiknapp = styled.button`
  flex: none;
  padding: 0.15rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkMuted};
  font: inherit;
  font-size: var(--fs-micro);
  cursor: pointer;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.default};

  dd:hover &,
  &:focus-visible {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
`

const Tomt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: var(--fs-small);
`

const Liste = styled.ul`
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--fs-small);

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  li > div {
    display: grid;
    flex: 1;
    min-width: 0;
  }

  strong,
  a {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }
`

const Belop = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const Merke = styled.span<{ $status: string }>`
  padding: 0.15rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $status }) =>
    $status === 'betalt' ? theme.colors.successSoft : $status === 'levert' ? theme.colors.warningSoft : theme.colors.sunken};
  color: ${({ theme, $status }) =>
    $status === 'betalt' ? theme.colors.success : $status === 'levert' ? theme.colors.warning : theme.colors.inkMuted};
  font-size: var(--fs-micro);
  font-weight: 500;
  white-space: nowrap;
`

const Mer = styled(Link)`
  display: inline-block;
  margin-top: 0.6rem;
  color: ${({ theme }) => theme.colors.accent};
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;
`

const Logoer = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;

  figure {
    display: grid;
    place-items: center;
    aspect-ratio: 5 / 3;
    margin: 0 0 0.4rem;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.sunken};

    img {
      max-width: 80%;
      max-height: 80%;
    }
  }

  strong {
    display: block;
    font-size: var(--fs-small);
    font-weight: 600;
  }

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }
`

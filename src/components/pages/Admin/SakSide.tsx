import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Dempet, Feil, Felt, IngenTilgang, Knapp, Lenkeknapp, Panel, StatusMerke } from './felles'
import { dato, idag, kr, tilMs } from './format'
import {
  fjernHendelse,
  fjernNotat,
  leggTilNotat,
  lyttSak,
  oppdaterKontakt,
  settBelop,
  settDrift,
  settOppfolging,
  settStatus,
  slettSak,
} from '../../../lib/henvendelser'
import { KILDER, STATUSER, driftAktiv, status as statusinfo, type Sak, type Status } from '../../../data/saker'
import { drift as standardDrift, formaterRamme } from '../../../data/pakker'
import { GodtattBanner, KundetilgangPanel, MeldingerPanel } from './Kundetilgang'
import LogoISak from './LogoISak'
import { useMarkerLest, useProsjekt, useSynk } from './kundehooks'

export default function SakSide() {
  return (
    <AdminRamme tittel="Sak">
      <Innhold />
    </AdminRamme>
  )
}

function Innhold() {
  const { id = '' } = useParams()
  const [sak, setSak] = useState<Sak | null | undefined>(undefined)
  const [feil, setFeil] = useState<Error | null>(null)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttSak(id, setSak, setFeil).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [id])

  if (feil) return <IngenTilgang feil={feil} />
  if (sak === undefined) return <Dempet>Henter saken …</Dempet>
  if (sak === null)
    return (
      <p>
        Fant ikke saken. <Link to="/admin">Tilbake til oversikten</Link>
      </p>
    )

  return <Sakvisning sak={sak} />
}

function Sakvisning({ sak }: { sak: Sak }) {
  const prosjekt = useProsjekt(sak.id)
  useSynk(sak, prosjekt)
  useMarkerLest(sak, prosjekt)

  return (
    <>
      <Tilbake to="/admin">← Alle saker</Tilbake>
      <GodtattBanner sak={sak} prosjekt={prosjekt} />
      <Hode>
        <div>
          <h1>{sak.bedrift || sak.navn || '(uten navn)'}</h1>
          <Dempet>
            {sak.bedrift && `${sak.navn} · `}
            {KILDER[sak.kilde]} · mottatt {dato(sak.opprettet, true)}
          </Dempet>
        </div>
        <StatusMerke status={sak.status} />
      </Hode>

      <Rutenett>
        <Spalte>
          <StatusPanel sak={sak} />
          <MeldingerPanel sak={sak} prosjekt={prosjekt} />
          <Oppfolging sak={sak} />
          <Notater sak={sak} />
        </Spalte>
        <Spalte>
          <Kontakt sak={sak} />
          <KundetilgangPanel sak={sak} prosjekt={prosjekt} />
          <Henvendelsen sak={sak} />
          <LogoISak sak={sak} />
          <Okonomi sak={sak} />
          <DriftPanel sak={sak} />
          <Slett sak={sak} />
        </Spalte>
      </Rutenett>
    </>
  )
}

/** Gjør et kall og holder styr på «lagrer» og feil, så hvert panel slipper det selv. */
function useLagring() {
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')
  async function lagre(fn: () => Promise<unknown>) {
    setLagrer(true)
    setFeil('')
    try {
      await fn()
      return true
    } catch (e) {
      console.error(e)
      setFeil('Kunne ikke lagre. Prøv igjen.')
      return false
    } finally {
      setLagrer(false)
    }
  }
  return { lagrer, feil, lagre }
}

/* ------------------------------------------------------------------ status */

function StatusPanel({ sak }: { sak: Sak }) {
  const neste = STATUSER[Math.min(STATUSER.findIndex((s) => s.id === sak.status) + 1, STATUSER.length - 1)]
  const [ny, setNy] = useState<Status>(neste.id)
  const [dag, setDag] = useState(idag())
  const [belop, setBelop] = useState('')
  const [grunn, setGrunn] = useState('')
  const { lagrer, feil, lagre } = useLagring()
  const info = statusinfo(ny)

  async function send(e: FormEvent) {
    e.preventDefault()
    const ekstra: { belop?: number; grunn?: string } = {}
    if (info.felt === 'belop' && belop.trim()) ekstra.belop = Number(belop.replace(/\s/g, ''))
    if (info.felt === 'grunn' && grunn.trim()) ekstra.grunn = grunn.trim()
    if (await lagre(() => settStatus(sak, ny, tilMs(dag), ekstra))) {
      setBelop('')
      setGrunn('')
    }
  }

  return (
    <Panel>
      <h2>Status</h2>
      <Skjema onSubmit={send}>
        <Felt>
          Flytt til
          <select value={ny} onChange={(e) => setNy(e.target.value as Status)}>
            {STATUSER.map((s) => (
              <option key={s.id} value={s.id}>
                {s.navn} – {s.hint}
              </option>
            ))}
          </select>
        </Felt>
        <To>
          <Felt>
            Dato
            <input type="date" value={dag} max={idag()} onChange={(e) => setDag(e.target.value)} required />
          </Felt>
          {info.felt === 'belop' && (
            <Felt>
              Beløp (kr, eks. mva.)
              <input inputMode="numeric" value={belop} onChange={(e) => setBelop(e.target.value)} placeholder="35000" />
            </Felt>
          )}
          {info.felt === 'grunn' && (
            <Felt>
              Grunn
              <input value={grunn} onChange={(e) => setGrunn(e.target.value)} placeholder="For dyrt, valgte en annen …" />
            </Felt>
          )}
        </To>
        <Knapp $hoved type="submit" disabled={lagrer}>
          {lagrer ? 'Lagrer …' : `Sett til «${info.navn}»`}
        </Knapp>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Skjema>

      <Historikk>
        {[...sak.historikk].reverse().map((h, iRev) => {
          const i = sak.historikk.length - 1 - iRev
          return (
            <li key={`${h.status}-${h.tid}-${i}`}>
              <StatusMerke status={h.status} />
              <span>
                {dato(h.tid)}
                {h.belop !== undefined && ` · ${kr(h.belop)}`}
                {h.grunn && ` · ${h.grunn}`}
              </span>
              <Lenkeknapp
                type="button"
                onClick={() => confirm('Fjerne denne hendelsen fra historikken?') && lagre(() => fjernHendelse(sak, i))}
              >
                Fjern
              </Lenkeknapp>
            </li>
          )
        })}
        <li>
          <StatusMerke status="ny" />
          <span>{dato(sak.opprettet)} · mottatt</span>
        </li>
      </Historikk>
    </Panel>
  )
}

/* -------------------------------------------------------------- oppfølging */

function Oppfolging({ sak }: { sak: Sak }) {
  const { lagrer, feil, lagre } = useLagring()
  const forfalt = !!sak.nesteOppfolging && sak.nesteOppfolging <= idag()
  const om = (dager: number) => {
    const d = new Date()
    d.setDate(d.getDate() + dager)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return (
    <Panel>
      <h2>Neste oppfølging</h2>
      <Rad>
        <Felt style={{ flex: 1 }}>
          <span style={forfalt ? { color: '#BE123C' } : undefined}>{forfalt ? 'Forfalt' : 'Dato'}</span>
          <input
            type="date"
            value={sak.nesteOppfolging ?? ''}
            onChange={(e) => lagre(() => settOppfolging(sak, e.target.value || null))}
            disabled={lagrer}
          />
        </Felt>
        {[3, 7, 14].map((d) => (
          <Knapp key={d} type="button" onClick={() => lagre(() => settOppfolging(sak, om(d)))} disabled={lagrer}>
            +{d} d
          </Knapp>
        ))}
        {sak.nesteOppfolging && (
          <Knapp type="button" onClick={() => lagre(() => settOppfolging(sak, null))} disabled={lagrer}>
            Fjern
          </Knapp>
        )}
      </Rad>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

/* ----------------------------------------------------------------- notater */

function Notater({ sak }: { sak: Sak }) {
  const [tekst, setTekst] = useState('')
  const { lagrer, feil, lagre } = useLagring()
  async function send(e: FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return
    if (await lagre(() => leggTilNotat(sak, tekst.trim()))) setTekst('')
  }
  return (
    <Panel>
      <h2>Notater</h2>
      <Skjema onSubmit={send}>
        <Felt>
          <span className="skjult">Nytt notat</span>
          <textarea rows={3} value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder="Ringte, vil ha booking. Sender tilbud fredag." />
        </Felt>
        <Knapp type="submit" disabled={lagrer || !tekst.trim()}>
          Legg til notat
        </Knapp>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Skjema>
      {sak.notater.length > 0 && (
        <NotatListe>
          {[...sak.notater].reverse().map((n, iRev) => {
            const i = sak.notater.length - 1 - iRev
            return (
              <li key={`${n.tid}-${i}`}>
                <p>{n.tekst}</p>
                <span>
                  {dato(n.tid, true)} ·{' '}
                  <Lenkeknapp type="button" onClick={() => confirm('Slette notatet?') && lagre(() => fjernNotat(sak, i))}>
                    Slett
                  </Lenkeknapp>
                </span>
              </li>
            )
          })}
        </NotatListe>
      )}
    </Panel>
  )
}

/* ----------------------------------------------------------------- kontakt */

function Kontakt({ sak }: { sak: Sak }) {
  const [rediger, setRediger] = useState(false)
  const [k, setK] = useState({ navn: sak.navn, bedrift: sak.bedrift, epost: sak.epost, telefon: sak.telefon })
  const { lagrer, feil, lagre } = useLagring()

  async function send(e: FormEvent) {
    e.preventDefault()
    if (await lagre(() => oppdaterKontakt(sak, k))) setRediger(false)
  }

  if (rediger)
    return (
      <Panel>
        <h2>Kontakt</h2>
        <Skjema onSubmit={send}>
          {(['navn', 'bedrift', 'epost', 'telefon'] as const).map((f) => (
            <Felt key={f}>
              {{ navn: 'Navn', bedrift: 'Bedrift', epost: 'E-post', telefon: 'Telefon' }[f]}
              <input value={k[f]} type={f === 'epost' ? 'email' : 'text'} onChange={(e) => setK({ ...k, [f]: e.target.value })} />
            </Felt>
          ))}
          <Rad>
            <Knapp $hoved type="submit" disabled={lagrer}>
              Lagre
            </Knapp>
            <Knapp type="button" onClick={() => setRediger(false)}>
              Avbryt
            </Knapp>
          </Rad>
          {feil && <Feil role="alert">{feil}</Feil>}
        </Skjema>
      </Panel>
    )

  const emne = encodeURIComponent(`Henvendelsen din til Vimzo${sak.bedrift ? ` – ${sak.bedrift}` : ''}`)
  return (
    <Panel>
      <h2>Kontakt</h2>
      <Fakta>
        <dt>Navn</dt>
        <dd>{sak.navn || '–'}</dd>
        <dt>Bedrift</dt>
        <dd>{sak.bedrift || '–'}</dd>
        <dt>E-post</dt>
        <dd>{sak.epost ? <a href={`mailto:${sak.epost}`}>{sak.epost}</a> : '–'}</dd>
        <dt>Telefon</dt>
        <dd>{sak.telefon ? <a href={`tel:${sak.telefon.replace(/\s/g, '')}`}>{sak.telefon}</a> : '–'}</dd>
      </Fakta>
      <Rad>
        {sak.epost && (
          <Knapp as="a" href={`mailto:${sak.epost}?subject=${emne}`} $hoved>
            Svar på e-post
          </Knapp>
        )}
        {sak.telefon && (
          <Knapp as="a" href={`tel:${sak.telefon.replace(/\s/g, '')}`}>
            Ring
          </Knapp>
        )}
        <Knapp type="button" onClick={() => setRediger(true)}>
          Endre
        </Knapp>
      </Rad>
    </Panel>
  )
}

/* ------------------------------------------------------------ henvendelsen */

function Henvendelsen({ sak }: { sak: Sak }) {
  if (!sak.melding && !sak.brief && !sak.pakke) return null
  return (
    <Panel>
      <h2>Henvendelsen</h2>
      {(sak.pakke || sak.anslag) && (
        <Fakta>
          {sak.pakke && (
            <>
              <dt>Gjelder</dt>
              <dd>{sak.pakke}</dd>
            </>
          )}
          {sak.anslag && (
            <>
              <dt>Anslag</dt>
              <dd>{formaterRamme(sak.anslag)} kr</dd>
            </>
          )}
        </Fakta>
      )}
      {sak.melding && <Sitat>{sak.melding}</Sitat>}
      {sak.brief && (
        <details>
          <summary>Svarene fra kalkulatoren</summary>
          <Brief>{sak.brief}</Brief>
        </details>
      )}
    </Panel>
  )
}

/* ----------------------------------------------------------------- økonomi */

function Okonomi({ sak }: { sak: Sak }) {
  const { lagrer, feil, lagre } = useLagring()
  const felt = (navn: 'tilbudBelop' | 'fakturertBelop', etikett: string) => (
    <Felt>
      {etikett}
      <input
        inputMode="numeric"
        defaultValue={sak[navn] ?? ''}
        key={`${navn}-${sak[navn]}`}
        placeholder="–"
        disabled={lagrer}
        onBlur={(e) => {
          const v = e.target.value.replace(/\s/g, '')
          const tall = v === '' ? null : Number(v)
          if (tall !== sak[navn] && (tall === null || Number.isFinite(tall))) lagre(() => settBelop(sak, navn, tall))
        }}
      />
    </Felt>
  )
  const godtatt = sak.historikk.some((h) => h.status === 'godtatt')
  return (
    <Panel>
      <h2>Økonomi</h2>
      <To>
        {felt('tilbudBelop', 'Tilbud (kr eks. mva.)')}
        {felt('fakturertBelop', 'Fakturert (kr eks. mva.)')}
      </To>
      <Dempet as="p" style={{ fontSize: '0.8125rem', margin: '0.75rem 0 0' }}>
        {godtatt ? 'Tilbudet er godtatt.' : 'Beløpene fylles også inn når du setter status til «Tilbud sendt» eller «Fakturert».'}
      </Dempet>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

/* ------------------------------------------------------------------- drift */

function DriftPanel({ sak }: { sak: Sak }) {
  const { lagrer, feil, lagre } = useLagring()
  const [pris, setPris] = useState(String(sak.drift?.manedspris ?? standardDrift.pris))
  const [fra, setFra] = useState(sak.drift?.fra ?? idag())
  const aktiv = driftAktiv(sak.drift)

  if (!sak.drift)
    return (
      <Panel>
        <h2>Drift</h2>
        <Dempet as="p" style={{ margin: '0 0 0.9rem', fontSize: '0.875rem' }}>
          Ingen driftsavtale. Start en når siden er levert, så teller den med i fast månedlig inntekt.
        </Dempet>
        <To>
          <Felt>
            Kr per måned
            <input inputMode="numeric" value={pris} onChange={(e) => setPris(e.target.value)} />
          </Felt>
          <Felt>
            Fra
            <input type="date" value={fra} onChange={(e) => setFra(e.target.value)} />
          </Felt>
        </To>
        <Knapp
          type="button"
          style={{ marginTop: '0.9rem' }}
          disabled={lagrer || !Number(pris)}
          onClick={() => lagre(() => settDrift(sak, { manedspris: Number(pris), fra, til: null }))}
        >
          Start drift
        </Knapp>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Panel>
    )

  return (
    <Panel>
      <h2>Drift</h2>
      <Fakta>
        <dt>Pris</dt>
        <dd>{kr(sak.drift.manedspris)}/mnd</dd>
        <dt>Fra</dt>
        <dd>{dato(sak.drift.fra)}</dd>
        <dt>Til</dt>
        <dd>{sak.drift.til ? dato(sak.drift.til) : 'Løper'}</dd>
        <dt>Status</dt>
        <dd>{aktiv ? 'Aktiv' : 'Ikke aktiv'}</dd>
      </Fakta>
      <Rad>
        {sak.drift.til === null ? (
          <Knapp
            type="button"
            disabled={lagrer}
            onClick={() => confirm('Avslutte driften fra i dag?') && lagre(() => settDrift(sak, { ...sak.drift!, til: idag() }))}
          >
            Avslutt drift
          </Knapp>
        ) : (
          <Knapp type="button" disabled={lagrer} onClick={() => lagre(() => settDrift(sak, { ...sak.drift!, til: null }))}>
            Gjenoppta
          </Knapp>
        )}
        <Knapp type="button" disabled={lagrer} onClick={() => confirm('Fjerne driftsavtalen helt?') && lagre(() => settDrift(sak, null))}>
          Fjern
        </Knapp>
      </Rad>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

/* ------------------------------------------------------------------- slett */

function Slett({ sak }: { sak: Sak }) {
  const naviger = useNavigate()
  const { lagrer, feil, lagre } = useLagring()
  return (
    <Panel>
      <h2>Slett</h2>
      <Dempet as="p" style={{ margin: '0 0 0.9rem', fontSize: '0.875rem' }}>
        Sletter saken for godt. Henvendelser som ikke ble oppdrag, skal slettes innen tolv måneder (se personvernsiden).
      </Dempet>
      <Knapp
        $fare
        type="button"
        disabled={lagrer}
        onClick={async () => {
          if (!confirm(`Slette saken for ${sak.bedrift || sak.navn} for godt?`)) return
          if (await lagre(() => slettSak(sak.id))) naviger('/admin')
        }}
      >
        Slett saken
      </Knapp>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

/* -------------------------------------------------------------------- stil */

const Tilbake = styled(Link)`
  display: inline-block;
  margin-bottom: 1rem;
  font-size: var(--fs-small);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`

const Hode = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;

  h1 {
    margin: 0 0 0.25rem;
    font-size: var(--fs-title);
  }
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Spalte = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .skjult {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`

const To = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Rad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 0.9rem;

  ${Skjema} & {
    margin-top: 0;
  }
`

const Historikk = styled.ol`
  margin: 1.25rem 0 0;
  padding: 1rem 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0;
    font-size: var(--fs-small);
  }

  li span:nth-child(2) {
    flex: 1;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  button {
    font-size: var(--fs-micro);
  }
`

const NotatListe = styled.ul`
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;

  li {
    padding: 0.75rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  p {
    margin: 0;
    font-size: var(--fs-body);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  span {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Fakta = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.4rem 1rem;
  margin: 0;
  font-size: var(--fs-body);

  dt {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Sitat = styled.p`
  margin: 1rem 0 0;
  padding: 0.8rem 1rem;
  border-left: 3px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.paper};
  font-size: var(--fs-body);
  line-height: 1.55;
  white-space: pre-wrap;
`

const Brief = styled.pre`
  margin: 0.6rem 0 0;
  padding: 0.8rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.paper};
  font-family: inherit;
  font-size: var(--fs-small);
  line-height: 1.55;
  white-space: pre-wrap;
`

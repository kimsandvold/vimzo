import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { KontoRamme, Dempet, IngenTilgang, Knapp, Lenkeknapp, Panel, Feil } from '../Admin/felles'
import { useAdmin as useKonto } from '../Admin/kontekst'
import { dato, kr } from '../Admin/format'
import Meldinger from '../Admin/Meldinger'
import { godtaTilbud, lyttMineProsjekter } from '../../../lib/prosjekter'
import { varsleVimzo } from '../../../lib/emailjs'
import { KUNDESTATUS, STEG, type Prosjekt } from '../../../data/prosjekt'
import { driftAktiv } from '../../../data/saker'
import MineLogoer from './MineLogoer'
import { Link } from 'react-router-dom'

/**
 * Min side – kundens eget område.
 *
 * Kunden logger inn med e-postadressen fra henvendelsen, og ser prosjektene
 * som står på den: hvor det står, tilbudet, fakturaen og en meldingstråd med
 * Vimzo. Tilgangen gis fra admin («Gi kundetilgang»); en konto uten prosjekter
 * ser bare at det ikke finnes noe her ennå.
 */
export default function MinSide() {
  return (
    <KontoRamme
      seoTittel="Min side – Vimzo"
      merke="Min side"
      ingress="Logoene dine og nettsideprosjektet ditt hos Vimzo, samlet på ett sted."
      hjem={{ til: '/min-side', tekst: 'Min side' }}
      lenker={[{ til: '/logo', tekst: 'Lag logo' }]}
      tillatRegistrering
    >
      <Oversikt />
    </KontoRamme>
  )
}

/**
 * Oversikten: en hilsen, så logoene, så nettsiden. Logoene står først fordi
 * de fleste som har konto her, har den for logoverktøyets skyld – et
 * nettsideprosjekt får man først etter en prat.
 */
function Oversikt() {
  const { bruker } = useKonto()
  const fornavn = (bruker.displayName || '').trim().split(/\s+/)[0]
  return (
    <>
      <Velkommen>
        <h1>{fornavn ? `Hei, ${fornavn}` : 'Min side'}</h1>
        <p>Logoene dine og prosjektet ditt hos Vimzo, samlet på ett sted.</p>
      </Velkommen>
      <MineLogoer />
      <section aria-labelledby="nettsiden">
        <Seksjonstittel id="nettsiden">Nettsiden din</Seksjonstittel>
        <MineProsjekter />
      </section>
    </>
  )
}

function MineProsjekter() {
  const { bruker, loggUt } = useKonto()
  const [prosjekter, setProsjekter] = useState<Prosjekt[] | null>(null)
  const [feil, setFeil] = useState<Error | null>(null)
  const [valgt, setValgt] = useState<string | null>(null)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttMineProsjekter(bruker.email ?? '', setProsjekter, setFeil).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [bruker.email])

  if (feil) return <IngenTilgang feil={feil} />
  if (!prosjekter) return <Dempet>Henter prosjektene dine …</Dempet>

  if (prosjekter.length === 0)
    return (
      <Tomt>
        <div>
          <h3>Trenger bedriften en nettside?</h3>
          <p>
            Svar på noen raske spørsmål, så ser du hva den koster – før du snakker med noen. Når vi har
            tatt en prat, følger du prosjektet her.
          </p>
          <Tomknapper>
            <Hovedlenke to="/">Se hva den koster</Hovedlenke>
            <Sekundarlenke to="/kontakt">Ta en prat</Sekundarlenke>
          </Tomknapper>
        </div>
        <small>
          Har du alt et prosjekt hos oss? Det vises på e-postadressen du oppga – du er logget inn som{' '}
          <strong>{bruker.email}</strong>. <Lenkeknapp onClick={loggUt}>Bytt konto</Lenkeknapp>
        </small>
      </Tomt>
    )

  const aktivt = prosjekter.find((p) => p.id === valgt) ?? prosjekter[0]

  return (
    <>
      {prosjekter.length > 1 && (
        <Velger>
          {prosjekter.map((p) => (
            <Valg key={p.id} $valgt={p.id === aktivt.id} onClick={() => setValgt(p.id)}>
              {p.tittel}
            </Valg>
          ))}
        </Velger>
      )}
      <Prosjektvisning prosjekt={aktivt} />
    </>
  )
}

function Prosjektvisning({ prosjekt: p }: { prosjekt: Prosjekt }) {
  const { bruker } = useKonto()
  const navn = bruker.displayName || bruker.email || 'Kunden'
  const avsluttet = p.status === 'avvist' || p.status === 'lukket'

  const varsle = (emne: string, melding: string) =>
    varsleVimzo({
      emne,
      navn,
      bedrift: p.tittel,
      epost: bruker.email ?? '',
      telefon: '',
      melding,
      brief: `Åpne saken i admin: https://vimzo.no/admin/sak/${p.id}`,
    })

  return (
    <>
      <Hode>
        <h1>{p.tittel}</h1>
        <Status $avsluttet={avsluttet}>{KUNDESTATUS[p.status]}</Status>
      </Hode>

      {!avsluttet && <Fremdrift prosjekt={p} />}

      <Rutenett>
        <Spalte>
          {p.tilbud && <Tilbud prosjekt={p} varsle={varsle} />}
          {p.faktura && <Faktura prosjekt={p} />}
          <Panel>
            <h2>Meldinger</h2>
            <Meldinger
              prosjektId={p.id}
              meg="kunde"
              navn={navn}
              vedSendt={(tekst) => varsle(`Ny melding fra ${p.tittel} på Min side`, tekst)}
            />
          </Panel>
        </Spalte>
        <Spalte>
          <Panel>
            <h2>Oversikt</h2>
            <Fakta>
              <dt>Status</dt>
              <dd>{KUNDESTATUS[p.status]}</dd>
              {p.forventetLevering && (
                <>
                  <dt>Forventet levering</dt>
                  <dd>{dato(p.forventetLevering)}</dd>
                </>
              )}
              {p.drift && (
                <>
                  <dt>Drift</dt>
                  <dd>
                    {kr(p.drift.manedspris)}/mnd · {driftAktiv(p.drift) ? `fra ${dato(p.drift.fra)}` : 'ikke aktiv'}
                  </dd>
                </>
              )}
            </Fakta>
          </Panel>
          <Panel>
            <h2>Tidslinje</h2>
            <Tidslinje>
              {[...p.tidslinje].reverse().map((h, i) => (
                <li key={`${h.status}-${h.tid}-${i}`}>
                  <strong>{KUNDESTATUS[h.status]}</strong>
                  <span>{dato(h.tid)}</span>
                </li>
              ))}
              {p.tilbudGodtatt && (
                <li>
                  <strong>Du godtok tilbudet</strong>
                  <span>{dato(p.tilbudGodtatt)}</span>
                </li>
              )}
              <li>
                <strong>Henvendelsen kom inn</strong>
              </li>
            </Tidslinje>
          </Panel>
        </Spalte>
      </Rutenett>
    </>
  )
}

/** Fem steg fra mottatt til betalt, med det kunden står på uthevet. */
function Fremdrift({ prosjekt }: { prosjekt: Prosjekt }) {
  const her = STEG.findIndex((s) => s.statuser.includes(prosjekt.status))
  return (
    <Steg aria-label="Fremdrift">
      {STEG.map((s, i) => (
        <li key={s.navn} data-tilstand={i < her ? 'ferdig' : i === her ? 'her' : 'senere'} aria-current={i === her ? 'step' : undefined}>
          <span aria-hidden="true">{i < her ? '✓' : i + 1}</span>
          {s.navn}
        </li>
      ))}
    </Steg>
  )
}

function Tilbud({ prosjekt: p, varsle }: { prosjekt: Prosjekt; varsle: (emne: string, melding: string) => void }) {
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')
  const kanGodta = !p.tilbudGodtatt && p.status === 'tilbud'

  async function godta() {
    if (!confirm(`Godta tilbudet på ${kr(p.tilbud!.belop)} eks. mva.?`)) return
    setLagrer(true)
    setFeil('')
    try {
      await godtaTilbud(p.id)
      varsle(`${p.tittel} godtok tilbudet`, `Tilbudet på ${kr(p.tilbud!.belop)} er godtatt på Min side.`)
    } catch (e) {
      console.error(e)
      setFeil('Det gikk ikke å godta tilbudet akkurat nå. Prøv igjen, eller skriv til oss.')
    } finally {
      setLagrer(false)
    }
  }

  return (
    <Panel>
      <h2>Tilbud</h2>
      <Belop>
        {kr(p.tilbud!.belop)} <small>eks. mva.</small>
      </Belop>
      {p.tilbud!.sendt && <Dempet as="p" style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>Sendt {dato(p.tilbud!.sendt)}</Dempet>}
      {p.tilbudsbeskrivelse && <Beskrivelse>{p.tilbudsbeskrivelse}</Beskrivelse>}
      {p.tilbudGodtatt ? (
        <Godtatt role="status">✓ Du godtok tilbudet {dato(p.tilbudGodtatt)}. Vi tar kontakt om oppstart.</Godtatt>
      ) : kanGodta ? (
        <Knapp $hoved onClick={godta} disabled={lagrer} style={{ marginTop: '1rem' }}>
          {lagrer ? 'Lagrer …' : 'Godta tilbudet'}
        </Knapp>
      ) : null}
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

function Faktura({ prosjekt: p }: { prosjekt: Prosjekt }) {
  const f = p.faktura!
  return (
    <Panel>
      <h2>Faktura</h2>
      <Belop>
        {kr(f.belop)} <small>eks. mva.</small>
      </Belop>
      <Fakta style={{ marginTop: '0.75rem' }}>
        {f.dato && (
          <>
            <dt>Fakturert</dt>
            <dd>{dato(f.dato)}</dd>
          </>
        )}
        <dt>Status</dt>
        <dd>{f.betalt ? `Betalt ${dato(f.betalt)}` : 'Ikke betalt ennå'}</dd>
      </Fakta>
    </Panel>
  )
}

/* -------------------------------------------------------------------- stil */

const Velkommen = styled.div`
  margin: clamp(1rem, 3vw, 2rem) 0 clamp(2rem, 4vw, 3rem);

  h1 {
    margin: 0;
    font-size: var(--fs-heading);
    letter-spacing: var(--ls-heading);
    line-height: 1.05;
  }

  p {
    margin: 0.6rem 0 0;
    font-size: var(--fs-lead);
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Seksjonstittel = styled.h2`
  margin: 0 0 1rem;
  font-size: var(--fs-title);
  letter-spacing: var(--ls-title);
`

/** Tom tilstand for nettsiden: en invitasjon, ikke en feilmelding. */
const Tomt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.sunken};

  h3 {
    margin: 0 0 0.5rem;
    font-size: var(--fs-lead);
    letter-spacing: var(--ls-lead);
  }

  p {
    max-width: 52ch;
    margin: 0;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  small {
    padding-top: 1.25rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: var(--fs-small);
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Tomknapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
`

const Hovedlenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-weight: 500;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }
`

const Sekundarlenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 500;
  text-decoration: none;
`

const Velger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
`

const Valg = styled.button<{ $valgt: boolean }>`
  padding: 0.4rem 0.8rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.inkInverted : theme.colors.ink)};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 600;
  cursor: pointer;
`

const Hode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0;
    font-size: var(--fs-title);
  }
`

const Status = styled.span<{ $avsluttet: boolean }>`
  padding: 0.25rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $avsluttet }) => ($avsluttet ? theme.colors.sunken : theme.colors.successSoft)};
  color: ${({ theme, $avsluttet }) => ($avsluttet ? theme.colors.inkSubtle : theme.colors.success)};
  font-size: var(--fs-small);
  font-weight: 600;
`

const Steg = styled.ol`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-top: 0.6rem;
    border-top: 3px solid ${({ theme }) => theme.colors.border};
    font-size: var(--fs-small);
    font-weight: 600;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  li span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.sunken};
    font-size: var(--fs-micro);
  }

  li[data-tilstand='ferdig'] {
    border-color: ${({ theme }) => theme.colors.success};
    color: ${({ theme }) => theme.colors.ink};
  }

  li[data-tilstand='ferdig'] span {
    background: ${({ theme }) => theme.colors.successSoft};
    color: ${({ theme }) => theme.colors.success};
  }

  li[data-tilstand='her'] {
    border-color: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.ink};
  }

  li[data-tilstand='her'] span {
    background: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
  }

  @media (max-width: 560px) {
    li {
      font-size: var(--fs-micro);
    }
  }
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Spalte = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Belop = styled.p`
  margin: 0;
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: var(--ls-title);

  small {
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Beskrivelse = styled.p`
  margin: 1rem 0 0;
  font-size: var(--fs-body);
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Godtatt = styled.p`
  margin: 1rem 0 0;
  padding: 0.7rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-size: var(--fs-body);
  font-weight: 600;
`

const Fakta = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.45rem 1rem;
  margin: 0;
  font-size: var(--fs-body);

  dt {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  dd {
    margin: 0;
  }
`

const Tidslinje = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: var(--fs-body);
  }

  li:last-child {
    border-bottom: 0;
  }

  span {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

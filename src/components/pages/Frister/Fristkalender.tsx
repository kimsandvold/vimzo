import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { dagerTil, ettArFrem, fristerFor, iDag, type Frist, type Kategori, type Mvatermin, type Profil, type Selskapsform } from '../../../lib/frister'
import { forslag, slaOpp, type Enhet, type Oppslag } from '../../../lib/brreg'
import { lastNedIcs } from '../../../lib/ics'
import { Knapp } from '../../../ui'

/**
 * Skjemaet, kvitteringen og tidslinjen.
 *
 * Som timepriskalkulatoren ligger valgene i adressefeltet. Da kan en
 * regnskapsfører sende kunden en lenke med alt ferdig utfylt, og
 * tilbakeknappen gjør det man venter.
 *
 * Komponenten regner ingen datoer selv – det gjør `fristerFor`, som er testet
 * for seg i `src/lib/frister.test.ts`.
 */

/* ------------------------------------------------------------------ */
/* Tilstand i URL-en                                                   */
/* ------------------------------------------------------------------ */

const STANDARD: Profil = { form: 'enk', mva: 'tomaaned', lonn: false, lonningsdag: 20 }

function lesProfil(p: URLSearchParams): Profil {
  const form = p.get('form') === 'as' ? 'as' : p.get('form') === 'enk' ? 'enk' : STANDARD.form
  const mvaRa = p.get('mva')
  const mva: Mvatermin = mvaRa === 'ingen' || mvaRa === 'aar' || mvaRa === 'tomaaned' ? mvaRa : STANDARD.mva
  const lonn = p.has('lonn') ? p.get('lonn') === '1' : STANDARD.lonn
  const dag = Number(p.get('dag'))
  return { form, mva, lonn, lonningsdag: dag >= 1 && dag <= 31 ? Math.floor(dag) : STANDARD.lonningsdag }
}

function skrivProfil(profil: Profil, orgnr: string | null): URLSearchParams {
  const p = new URLSearchParams()
  if (orgnr) p.set('org', orgnr)
  p.set('form', profil.form)
  p.set('mva', profil.mva)
  p.set('lonn', profil.lonn ? '1' : '0')
  if (profil.lonn) p.set('dag', String(profil.lonningsdag))
  return p
}

/* ------------------------------------------------------------------ */
/* Visning av datoer                                                   */
/* ------------------------------------------------------------------ */

function tilDate(t: string): Date {
  const [a, m, d] = t.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

const fmt = (t: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', ...o }).format(tilDate(t))

const langDato = (t: string) => fmt(t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const kortDato = (t: string) => fmt(t, { day: 'numeric', month: 'long' })
const maned = (t: string) => fmt(t, { month: 'long', year: 'numeric' })

function nar(dager: number): string {
  if (dager === 0) return 'i dag'
  if (dager === 1) return 'i morgen'
  return `om ${dager} dager`
}

const KATEGORI: Record<Kategori, string> = {
  mva: 'Mva',
  lonn: 'Lønn',
  skatt: 'Skatt',
  arsoppgjor: 'Årsoppgjør',
}

/* ------------------------------------------------------------------ */
/* Stiler                                                              */
/* ------------------------------------------------------------------ */

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 400px);
  gap: clamp(1.5rem, 3vw, 2.75rem);
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Venstre = styled.div`
  display: grid;
  gap: 1.5rem;
`

const Bolk = styled.section`
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
`

const BolkHode = styled.div`
  margin-bottom: 1.25rem;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.025em;
  }

  p {
    margin: 0.3rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
  }
`

const Sok = styled.form`
  display: flex;
  gap: 0.6rem;

  @media (max-width: 520px) {
    flex-direction: column;
  }
`

const Orgfelt = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 50px;
  padding: 0 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.lead};
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
`

const Melding = styled.p<{ $feil?: boolean }>`
  margin: 0.75rem 0 0;
  color: ${({ theme, $feil }) => ($feil ? theme.colors.error : theme.colors.inkSubtle)};
  font-size: ${({ theme }) => theme.fontSizes.small};
`

const Firmakort = styled.div`
  display: grid;
  gap: 0.2rem;
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.lead};
    letter-spacing: -0.015em;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.small};
  }
`

const Sporsmal = styled.fieldset`
  margin: 0 0 1.4rem;
  padding: 0;
  border: 0;

  &:last-child {
    margin-bottom: 0;
  }

  legend {
    margin-bottom: 0.55rem;
    padding: 0;
    font-size: ${({ theme }) => theme.fontSizes.small};
    font-weight: 600;
  }
`

const Valg = styled.div<{ $kolonner: number }>`
  display: grid;
  gap: 0.6rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(${({ $kolonner }) => $kolonner}, minmax(0, 1fr));
  }
`

const Valgknapp = styled.button<{ $valgt: boolean }>`
  min-height: 46px;
  padding: 0.7rem 0.9rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.small};
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 0.1rem;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
    font-size: ${({ theme }) => theme.fontSizes.micro};
    line-height: 1.4;
  }
`

const Dagvalg = styled.label`
  display: grid;
  gap: 0.3rem;
  margin-top: 0.9rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;

  select {
    min-height: 46px;
    padding: 0 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-weight: 400;
  }
`

/* Kvitteringen – samme form som resultatkortet i timepriskalkulatoren. */

const Kort = styled.aside`
  position: sticky;
  top: calc(var(--nav-hoyde, 0px) + 1.5rem);
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  box-shadow: ${({ theme }) => theme.shadows.svev};

  @media (max-width: 1100px) {
    position: static;
  }
`

const KortStikkord = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.accentLight};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 550;
`

const StortTall = styled.p`
  margin: 0.3rem 0 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: clamp(2.6rem, 5vw + 1rem, 3.8rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
`

const NesteTittel = styled.p`
  margin: 0.9rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.lead};
  font-weight: 600;
  letter-spacing: -0.015em;
`

const Under = styled.p`
  margin: 0.35rem 0 0;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.5;
`

const Skille = styled.hr`
  margin: 1.4rem 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};
`

const Linje = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.38rem 0;
  font-size: ${({ theme }) => theme.fontSizes.small};

  span:first-child {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  span:last-child {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`

const Handling = styled.div`
  display: grid;
  gap: 0.6rem;
  margin-top: 1.5rem;

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    font-size: ${({ theme }) => theme.fontSizes.micro};
    line-height: 1.5;
  }
`

/* Tidslinjen */

const Tidslinje = styled.div`
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
`

const TidslinjeHode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  margin-bottom: 1.25rem;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.025em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: ${({ theme }) => theme.fontSizes.small};
  }
`

const Maned = styled.section`
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: 1rem;
  padding: 1.25rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  h3 {
    margin: 0.2rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.small};
    font-weight: 600;
    text-transform: capitalize;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.6rem;
  }
`

const Liste = styled.ol`
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Rad = styled.li<{ $neste: boolean }>`
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  padding: 0.85rem 1rem;
  border: 1px solid ${({ theme, $neste }) => ($neste ? theme.colors.accent : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $neste }) => ($neste ? theme.colors.accentSoft : theme.colors.surface)};

  @media (max-width: 520px) {
    grid-template-columns: 3rem minmax(0, 1fr);
  }
`

const Dag = styled.div`
  text-align: center;
  line-height: 1.1;

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.title};
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
  }

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: ${({ theme }) => theme.fontSizes.micro};
  }
`

const Innhold = styled.div`
  min-width: 0;

  a {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
      text-decoration: underline;
    }
  }

  p {
    margin: 0.15rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.small};
    line-height: 1.5;
  }

  small {
    display: block;
    margin-top: 0.25rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: ${({ theme }) => theme.fontSizes.micro};
  }
`

const Mer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Merke = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  white-space: nowrap;

  @media (max-width: 520px) {
    display: none;
  }
`

/* ------------------------------------------------------------------ */
/* Komponenten                                                         */
/* ------------------------------------------------------------------ */

const FEILTEKST: Record<Exclude<Oppslag, { ok: true }>['grunn'], string> = {
  ugyldig: 'Det ser ikke ut som et gyldig organisasjonsnummer. Det har ni siffer.',
  'finnes-ikke': 'Fant ingen bedrift med det nummeret i Enhetsregisteret.',
  slettet: 'Bedriften er slettet fra Enhetsregisteret.',
  nett: 'Fikk ikke svar fra Brønnøysundregistrene. Prøv igjen, eller fyll inn selv under.',
}

const ingenAbonnement = () => () => {}

const DAGER = Array.from({ length: 31 }, (_, i) => i + 1)

export default function Fristkalender() {
  const [params, settParams] = useSearchParams()
  const profil = useMemo(() => lesProfil(params), [params])
  const orgnr = params.get('org')

  const [tekst, settTekst] = useState(orgnr ?? '')
  const [enhet, settEnhet] = useState<Enhet | null>(null)
  const [feil, settFeil] = useState<string | null>(null)
  const [henter, settHenter] = useState(false)

  // «I dag» er `null` i den forhåndsrendrede HTML-en og settes først i
  // nettleseren. Ellers ville siden vist fristene fra den dagen den ble bygget.
  const idag = useSyncExternalStore(ingenAbonnement, iDag, () => null)

  const frister = useMemo(() => (idag ? fristerFor(profil, idag, ettArFrem(idag)) : []), [profil, idag])
  const neste = frister[0] ?? null

  const endre = useCallback(
    (endringer: Partial<Profil>) => {
      settParams(skrivProfil({ ...profil, ...endringer }, orgnr), { replace: true })
    },
    [profil, orgnr, settParams],
  )

  const hent = useCallback(
    async (nr: string, brukForslag: boolean) => {
      settHenter(true)
      settFeil(null)
      const svar = await slaOpp(nr)
      settHenter(false)
      if (!svar.ok) {
        settEnhet(null)
        settFeil(FEILTEKST[svar.grunn])
        return
      }
      settEnhet(svar.enhet)
      if (brukForslag) {
        settParams(skrivProfil({ ...profil, ...forslag(svar.enhet) }, svar.enhet.orgnr), { replace: true })
      }
    },
    [profil, settParams],
  )

  // Åpnes en delt lenke med org=, henter vi navnet – men rører ikke valgene i lenken.
  const forsteOrgnr = useState(orgnr)[0]
  useEffect(() => {
    if (!forsteOrgnr) return
    let aktiv = true
    void slaOpp(forsteOrgnr).then((svar) => {
      if (aktiv && svar.ok) settEnhet(svar.enhet)
    })
    return () => {
      aktiv = false
    }
  }, [forsteOrgnr])

  function sendInn(e: FormEvent) {
    e.preventDefault()
    void hent(tekst, true)
  }

  function lastNed() {
    lastNedIcs(frister, enhet?.navn ?? (profil.form === 'as' ? 'aksjeselskap' : 'enkeltpersonforetak'))
  }

  const perManed = useMemo(() => {
    const grupper = new Map<string, Frist[]>()
    for (const f of frister) {
      const nokkel = f.dato.slice(0, 7)
      grupper.set(nokkel, [...(grupper.get(nokkel) ?? []), f])
    }
    return [...grupper.entries()]
  }, [frister])

  const [visAlt, settVisAlt] = useState(false)
  const synlige = visAlt ? perManed : perManed.slice(0, 3)

  const antall = (k: Kategori) => frister.filter((f) => f.kategori === k).length

  return (
    <>
      <Rutenett>
        <Venstre>
          <Bolk>
            <BolkHode>
              <h2>Finn bedriften din</h2>
              <p>Vi slår opp i Enhetsregisteret og fyller ut det vi kan. Ingenting lagres.</p>
            </BolkHode>
            <Sok onSubmit={sendInn}>
              <Orgfelt
                value={tekst}
                onChange={(e) => settTekst(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="123 456 789"
                aria-label="Organisasjonsnummer"
              />
              <Knapp type="submit" disabled={henter}>
                {henter ? 'Henter …' : 'Hent fristene'}
              </Knapp>
            </Sok>
            {feil ? <Melding $feil role="alert">{feil}</Melding> : null}
            {enhet ? (
              <Firmakort>
                <strong>{enhet.navn}</strong>
                <span>
                  {enhet.formnavn}
                  {enhet.kommune ? ` · ${enhet.kommune.charAt(0)}${enhet.kommune.slice(1).toLowerCase()}` : ''}
                  {' · '}
                  {enhet.mvaRegistrert ? 'mva-registrert' : 'ikke mva-registrert'}
                  {enhet.ansatte > 0 ? ` · ${enhet.ansatte} ansatte` : ''}
                </span>
              </Firmakort>
            ) : null}
            {enhet && !enhet.form ? (
              <Melding>
                Vi har foreløpig regler for enkeltpersonforetak og aksjeselskap. Velg den som ligger
                nærmest under.
              </Melding>
            ) : null}
            {!enhet && !feil ? <Melding>Ikke noe orgnummer for hånden? Svar på spørsmålene under.</Melding> : null}
          </Bolk>

          <Bolk>
            <BolkHode>
              <h2>Sjekk at dette stemmer</h2>
              <p>Registeret vet ikke alt. Det du velger her, bestemmer fristene.</p>
            </BolkHode>

            <Sporsmal>
              <legend>Selskapsform</legend>
              <Valg $kolonner={2}>
                {([
                  ['enk', 'Enkeltpersonforetak', 'Du og foretaket er samme skattyter'],
                  ['as', 'Aksjeselskap', 'Selskapet er egen skattyter'],
                ] as Array<[Selskapsform, string, string]>).map(([v, navn, hint]) => (
                  <Valgknapp key={v} type="button" $valgt={profil.form === v} aria-pressed={profil.form === v} onClick={() => endre({ form: v })}>
                    <strong>{navn}</strong>
                    <small>{hint}</small>
                  </Valgknapp>
                ))}
              </Valg>
            </Sporsmal>

            <Sporsmal>
              <legend>Mva-melding</legend>
              <Valg $kolonner={3}>
                {([
                  ['tomaaned', 'Annenhver måned', 'Det vanlige'],
                  ['aar', 'Én gang i året', 'Under 1 mill. i omsetning'],
                  ['ingen', 'Ikke mva-registrert', 'Under 50 000 kr'],
                ] as Array<[Mvatermin, string, string]>).map(([v, navn, hint]) => (
                  <Valgknapp key={v} type="button" $valgt={profil.mva === v} aria-pressed={profil.mva === v} onClick={() => endre({ mva: v })}>
                    <strong>{navn}</strong>
                    <small>{hint}</small>
                  </Valgknapp>
                ))}
              </Valg>
            </Sporsmal>

            <Sporsmal>
              <legend>Betaler bedriften ut lønn?</legend>
              <Valg $kolonner={2}>
                <Valgknapp type="button" $valgt={profil.lonn} aria-pressed={profil.lonn} onClick={() => endre({ lonn: true })}>
                  <strong>Ja</strong>
                  <small>Også lønn til deg selv i et AS</small>
                </Valgknapp>
                <Valgknapp type="button" $valgt={!profil.lonn} aria-pressed={!profil.lonn} onClick={() => endre({ lonn: false })}>
                  <strong>Nei</strong>
                  <small>Ingen a-melding</small>
                </Valgknapp>
              </Valg>
              {profil.lonn ? (
                <Dagvalg>
                  Lønningsdag
                  <select value={profil.lonningsdag} onChange={(e) => endre({ lonningsdag: Number(e.target.value) })}>
                    {DAGER.map((d) => (
                      <option key={d} value={d}>
                        Den {d}. i måneden
                      </option>
                    ))}
                  </select>
                </Dagvalg>
              ) : null}
            </Sporsmal>
          </Bolk>
        </Venstre>

        <Kort aria-live="polite">
          {neste && idag ? (
            <>
              <KortStikkord>Neste frist</KortStikkord>
              <StortTall>{nar(dagerTil(idag, neste.dato))}</StortTall>
              <NesteTittel>{neste.tittel}</NesteTittel>
              <Under>
                {langDato(neste.dato)}. {neste.hva}
              </Under>
              <Skille />
              <Linje>
                <span>Frister de neste 12 månedene</span>
                <span>{frister.length}</span>
              </Linje>
              {(['mva', 'lonn', 'skatt', 'arsoppgjor'] as Kategori[])
                .filter((k) => antall(k) > 0)
                .map((k) => (
                  <Linje key={k}>
                    <span>{KATEGORI[k]}</span>
                    <span>{antall(k)}</span>
                  </Linje>
                ))}
              <Handling>
                <Knapp variant="hvit" ikon="pilNed" onClick={lastNed}>
                  Legg alle i kalenderen
                </Knapp>
                <p>
                  Én fil for iPhone, Outlook og Google Kalender. Hver frist får et varsel tre dager
                  før, med lenke til riktig sted hos Skatteetaten.
                </p>
              </Handling>
            </>
          ) : (
            <>
              <KortStikkord>Neste frist</KortStikkord>
              <StortTall>–</StortTall>
              <Under>Fristene dine kommer her.</Under>
            </>
          )}
        </Kort>
      </Rutenett>

      {idag && frister.length > 0 ? (
        <Tidslinje>
          <TidslinjeHode>
            <h2>{enhet ? `Fristene til ${enhet.navn}` : 'Fristene dine'}</h2>
            <p>
              {kortDato(idag)} – {kortDato(ettArFrem(idag))} {ettArFrem(idag).slice(0, 4)}
            </p>
          </TidslinjeHode>
          {synlige.map(([nokkel, liste]) => (
            <Maned key={nokkel} aria-label={maned(`${nokkel}-01`)}>
              <h3>{maned(`${nokkel}-01`)}</h3>
              <Liste>
                {liste.map((f) => (
                  <Rad key={f.id} $neste={f === neste}>
                    <Dag>
                      <strong>{Number(f.dato.slice(8))}</strong>
                      <span>{fmt(f.dato, { weekday: 'short' })}</span>
                    </Dag>
                    <Innhold>
                      <a href={f.lenke} target="_blank" rel="noopener noreferrer">
                        {f.tittel}
                      </a>
                      <p>{f.hva}</p>
                      {f.dato !== f.regeldato ? (
                        <small>Flyttet fra {kortDato(f.regeldato)} fordi den dagen er helg eller helligdag.</small>
                      ) : null}
                    </Innhold>
                    <Merke>{KATEGORI[f.kategori]}</Merke>
                  </Rad>
                ))}
              </Liste>
            </Maned>
          ))}
          {perManed.length > 3 ? (
            <Mer>
              <Knapp variant="myk" ikon={visAlt ? undefined : 'pilNed'} onClick={() => settVisAlt(!visAlt)}>
                {visAlt
                  ? 'Vis bare de neste tre månedene'
                  : `Vis hele året – ${frister.length - synlige.reduce((n, [, l]) => n + l.length, 0)} frister til`}
              </Knapp>
            </Mer>
          ) : null}
        </Tidslinje>
      ) : null}
    </>
  )
}

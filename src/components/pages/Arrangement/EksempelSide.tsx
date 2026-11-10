import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useSEO } from '../../../hooks/useSEO'

/**
 * Eksempel på en arrangementsside – for en OPPDIKTET fagdag.
 *
 * Siden viser hva kunden får: et eget uttrykk i arrangementets farger,
 * program, talere, praktisk info og påmelding. Den er bevisst ikke i Vimzos
 * farger og har verken vår navbar eller fot – den skal se ut som kundens side.
 *
 * Tre ting holder den ærlig:
 *  – banneret øverst sier at arrangementet ikke finnes, og lenker tilbake
 *  – `noindex`, og den står ikke i sitemap: en oppdiktet fagdag skal aldri
 *    dukke opp i et søk eller i et AI-svar som om den var ekte
 *  – påmeldingen sender ingenting, og sier det når man trykker
 *
 * Navn, arrangør og sted er oppdiktet. Ingen ekte personer eller
 * organisasjoner er brukt.
 */

const DATO = new Date('2027-04-22T09:00:00+02:00')

const PROGRAM = [
  { tid: '09.00', tittel: 'Kaffe, registrering og stands', hvem: '' },
  { tid: '09.30', tittel: 'Velkommen – året som var, og det som kommer', hvem: 'Marit Eksempel, arrangør' },
  { tid: '10.15', tittel: 'Nye krav til energi i eldre bygg: hva betyr de i praksis?', hvem: 'Tor Demo, byggingeniør' },
  { tid: '11.30', tittel: 'Lunsj og utstillere', hvem: '' },
  { tid: '12.30', tittel: 'Lærlingen som ble – slik holder du på de unge', hvem: 'Sara Prøve, daglig leder' },
  { tid: '13.30', tittel: 'Paneldebatt: Hvem skal bygge Innlandet om ti år?', hvem: 'Alle talerne' },
  { tid: '15.00', tittel: 'Oppsummering og mingling', hvem: '' },
] as const

const TALERE = [
  { navn: 'Marit Eksempel', rolle: 'Arrangør', tema: 'Året som var, og det som kommer' },
  { navn: 'Tor Demo', rolle: 'Byggingeniør', tema: 'Energikrav i eldre bygg' },
  { navn: 'Sara Prøve', rolle: 'Daglig leder', tema: 'Lærlinger som blir' },
] as const

const UTSTILLERE = ['Trelast Eksempel', 'Verktøy & Co (eksempel)', 'Fjellstein Demo', 'Isolasjon Prøve', 'Arbeidsklær Eksempel', 'Varmepumpe Demo']

const ingenAbonnement = () => () => {}
const dagerTil = () => Math.max(0, Math.ceil((DATO.getTime() - Date.now()) / 86_400_000))

/**
 * Dager igjen til fagdagen. Hentes fra nettleserens klokke; uten en klokke
 * (server, test) er svaret `null`, og siden viser en strek i stedet for et
 * tall som ville vært feil i morgen.
 */
function useDagerIgjen() {
  return useSyncExternalStore(ingenAbonnement, dagerTil, () => null)
}

export default function EksempelSide() {
  const dager = useDagerIgjen()
  const [pameldt, setPameldt] = useState(false)

  useSEO({
    title: 'Eksempel: arrangementsside for en fagdag | Vimzo',
    description:
      'En eksempelside laget av Vimzo for å vise hvordan en arrangementsside kan se ut. Arrangementet er oppdiktet.',
    noindex: true,
  })

  function meldPa(e: FormEvent) {
    e.preventDefault()
    setPameldt(true)
  }

  return (
    <Side>
      <Banner role="note">
        <span>
          <strong>Eksempel.</strong> Laget av Vimzo for å vise hva en arrangementsside kan være. Fagdagen,
          navnene og arrangøren er oppdiktet.
        </span>
        <Link to="/arrangement">← Tilbake til arrangementssider</Link>
      </Banner>

      <Helt>
        <Innhold>
          <Dato>Torsdag 22. april 2027 · Lillehammer</Dato>
          <h1>
            Fagdag for
            <br />
            håndverkere
          </h1>
          <Ingress>Ett døgn med faget, folka og det som kommer. Foredrag, utstillere og god tid til å prate.</Ingress>
          <Handlinger>
            <Primar href="#pamelding">Meld deg på</Primar>
            <Sekundar href="#program">Se programmet</Sekundar>
          </Handlinger>
          <Fakta>
            <li>
              <strong>{dager === null ? '–' : dager}</strong>
              <span>dager igjen</span>
            </li>
            <li>
              <strong>3</strong>
              <span>foredrag</span>
            </li>
            <li>
              <strong>{UTSTILLERE.length}</strong>
              <span>utstillere</span>
            </li>
          </Fakta>
        </Innhold>
      </Helt>

      <Bolk id="program">
        <Innhold>
          <h2>Program</h2>
          <Program>
            {PROGRAM.map((p) => (
              <li key={p.tid}>
                <time>{p.tid}</time>
                <div>
                  <strong>{p.tittel}</strong>
                  {p.hvem && <span>{p.hvem}</span>}
                </div>
              </li>
            ))}
          </Program>
        </Innhold>
      </Bolk>

      <Bolk $lys>
        <Innhold>
          <h2>Talere</h2>
          <Talere>
            {TALERE.map((t) => (
              <li key={t.navn}>
                <Initialer aria-hidden="true">
                  {t.navn
                    .split(' ')
                    .map((d) => d[0])
                    .join('')}
                </Initialer>
                <strong>{t.navn}</strong>
                <span>{t.rolle}</span>
                <em>{t.tema}</em>
              </li>
            ))}
          </Talere>

          <h2 className="neste">Utstillere</h2>
          <Utstillere>
            {UTSTILLERE.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </Utstillere>
        </Innhold>
      </Bolk>

      <Bolk>
        <Innhold>
          <To>
            <div>
              <h2>Praktisk</h2>
              <Praktisk>
                <div>
                  <dt>Når</dt>
                  <dd>Torsdag 22. april 2027, kl. 09.00–16.00</dd>
                </div>
                <div>
                  <dt>Hvor</dt>
                  <dd>Storsalen, Lillehammer sentrum (oppdiktet sted)</dd>
                </div>
                <div>
                  <dt>Pris</dt>
                  <dd>Gratis for medlemmer, 450 kr for andre. Lunsj inkludert.</dd>
                </div>
                <div>
                  <dt>Parkering</dt>
                  <dd>Gratis parkering bak bygget. Ti minutter å gå fra stasjonen.</dd>
                </div>
              </Praktisk>
            </div>

            <Skjema id="pamelding" onSubmit={meldPa}>
              <h2>Meld deg på</h2>
              {pameldt ? (
                <Takk role="status">
                  <strong>Dette er et eksempel.</strong> Ingen påmelding ble sendt. På en ekte side får
                  deltakeren en bekreftelse på e-post, og arrangøren en oversikt over hvem som kommer.
                </Takk>
              ) : (
                <>
                  <label>
                    Navn
                    <input name="navn" autoComplete="name" required />
                  </label>
                  <label>
                    E-post
                    <input name="epost" type="email" autoComplete="email" required />
                  </label>
                  <label>
                    Firma
                    <input name="firma" autoComplete="organization" />
                  </label>
                  <button type="submit">Meld meg på</button>
                  <small>Eksempel – ingenting sendes.</small>
                </>
              )}
            </Skjema>
          </To>
        </Innhold>
      </Bolk>

      <Fot>
        <Innhold>
          <span>Arrangør: Fjellbygg-nettverket (oppdiktet) · fagdag.eksempel.no</span>
          <Link to="/arrangement">Siden er laget av Vimzo – se hva en arrangementsside koster</Link>
        </Innhold>
      </Fot>
    </Side>
  )
}

/* ------------------------------------------------------------------ stil
 *
 * Eget fargesett, med vilje: skogsgrønt og varm oransje, som en fagdag i
 * Innlandet kunne hatt. Det er hele poenget – kundens side skal se ut som
 * kunden, ikke som oss. Kontrastene holder AA.
 */

const C = {
  skog: '#1F2A24',
  skogLys: '#2B3A31',
  papir: '#F6F2EA',
  papirMork: '#ECE6DA',
  oransje: '#E87434',
  oransjeTekst: '#B4521C',
  blek: 'rgba(246, 242, 234, 0.75)',
  blekMork: '#5A5247',
}

const Side = styled.div`
  /* <main> setter av plass til Vimzos navbar, som ikke vises her. */
  margin-top: calc(-1 * var(--nav-hoyde));
  min-height: 100vh;
  background: ${C.papir};
  color: ${C.skog};
`

const Banner = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding: 0.7rem clamp(1rem, 4vw, 2rem);
  background: #13111f;
  color: #fff;
  font-size: var(--fs-small);
  line-height: 1.45;

  a {
    flex-shrink: 0;
    color: #b6a9ff;
    font-weight: 600;
    text-decoration: none;
  }
`

const Innhold = styled.div`
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
`

const Helt = styled.header`
  padding: clamp(4rem, 10vw, 7rem) 0 clamp(3.5rem, 8vw, 5.5rem);
  background:
    radial-gradient(70% 90% at 100% 0%, rgba(232, 116, 52, 0.32) 0%, rgba(232, 116, 52, 0) 60%),
    ${C.skog};
  color: ${C.papir};

  h1 {
    margin: 0.8rem 0 0;
    font-size: var(--fs-display);
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: var(--ls-display);
    color: ${C.papir};
  }
`

const Dato = styled.p`
  margin: 0;
  font-size: var(--fs-body);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #f0a46e;
`

const Ingress = styled.p`
  max-width: 34ch;
  margin: 1.4rem 0 0;
  font-size: var(--fs-lead);
  line-height: 1.5;
  color: ${C.blek};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
`

const Primar = styled.a`
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  background: ${C.oransje};
  color: ${C.skog};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: #f08a50;
  }
`

const Sekundar = styled.a`
  padding: 0.85rem 1.5rem;
  border: 1px solid rgba(246, 242, 234, 0.35);
  border-radius: 999px;
  color: ${C.papir};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    border-color: ${C.papir};
  }
`

const Fakta = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 3rem;
  margin: 3rem 0 0;
  padding: 1.5rem 0 0;
  border-top: 1px solid rgba(246, 242, 234, 0.18);
  list-style: none;

  li {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
    color: ${C.papir};
  }

  span {
    font-size: var(--fs-small);
    color: ${C.blek};
  }
`

const Bolk = styled.section<{ $lys?: boolean }>`
  padding: clamp(3rem, 7vw, 5rem) 0;
  background: ${({ $lys }) => ($lys ? C.papirMork : C.papir)};
  scroll-margin-top: 3rem;

  h2 {
    margin: 0 0 1.5rem;
    font-size: var(--fs-heading);
    font-weight: 600;
    letter-spacing: var(--ls-heading);
    color: ${C.skog};
  }

  h2.neste {
    margin-top: 3rem;
  }
`

const Program = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 5rem 1fr;
    gap: 1rem;
    padding: 1.1rem 0;
    border-bottom: 1px solid rgba(31, 42, 36, 0.12);
  }

  time {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    color: ${C.oransjeTekst};
  }

  strong {
    display: block;
    font-size: var(--fs-body);
    font-weight: 600;
  }

  span {
    display: block;
    margin-top: 0.2rem;
    font-size: var(--fs-small);
    color: ${C.blekMork};
  }
`

const Talere = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 18px;
    background: ${C.papir};
  }

  strong {
    margin-top: 1rem;
    font-size: var(--fs-body);
  }

  span {
    font-size: var(--fs-small);
    color: ${C.blekMork};
  }

  em {
    margin-top: 0.6rem;
    font-style: normal;
    font-size: var(--fs-body);
    color: ${C.skog};
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Initialer = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${C.skog};
  color: #f0a46e !important;
  font-size: var(--fs-body) !important;
  font-weight: 600;
`

const Utstillere = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 0.55rem 1rem;
    border: 1px solid rgba(31, 42, 36, 0.18);
    border-radius: 999px;
    font-size: var(--fs-body);
    font-weight: 500;
  }
`

const To = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Praktisk = styled.dl`
  margin: 0;

  div {
    padding: 1rem 0;
    border-bottom: 1px solid rgba(31, 42, 36, 0.12);
  }

  dt {
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${C.oransjeTekst};
  }

  dd {
    margin: 0.3rem 0 0;
    font-size: var(--fs-body);
    line-height: 1.5;
  }
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.5rem, 3vw, 2.2rem);
  border-radius: 22px;
  background: ${C.skog};
  color: ${C.papir};
  scroll-margin-top: 3rem;

  h2 {
    margin: 0 0 0.25rem;
    color: ${C.papir};
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: var(--fs-small);
    font-weight: 600;
  }

  input {
    padding: 0.75rem 0.9rem;
    border: 1px solid rgba(246, 242, 234, 0.25);
    border-radius: 12px;
    background: ${C.skogLys};
    color: ${C.papir};
    font-family: inherit;
    font-size: var(--fs-body);

    &:focus {
      outline: 2px solid ${C.oransje};
      outline-offset: 1px;
    }
  }

  button {
    margin-top: 0.4rem;
    padding: 0.9rem;
    border: 0;
    border-radius: 999px;
    background: ${C.oransje};
    color: ${C.skog};
    font-family: inherit;
    font-size: var(--fs-body);
    font-weight: 600;
    cursor: pointer;
  }

  small {
    font-size: var(--fs-small);
    color: ${C.blek};
  }
`

const Takk = styled.p`
  margin: 0;
  font-size: var(--fs-body);
  line-height: 1.6;
  color: ${C.blek};

  strong {
    color: ${C.papir};
  }
`

const Fot = styled.footer`
  padding: 2rem 0;
  background: ${C.skog};
  color: ${C.blek};
  font-size: var(--fs-small);

  > div {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.75rem 2rem;
  }

  a {
    color: #f0a46e;
    font-weight: 600;
    text-decoration: none;
  }
`

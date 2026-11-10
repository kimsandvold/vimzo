import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Knapp, Seksjon, Tittel, Wrap } from '../../../ui'
import Icon from '../../shared/Icon'
import Sidehode from '../../layout/Sidehode'
import Sporsmalsliste from '../../shared/Sporsmalsliste'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, navnesjekkLd } from '../../../lib/jsonLd'
import { faqFor } from '../../../data/faq'
import {
  MAKS_NAVN,
  PATENTSTYRET,
  brregLenke,
  domeneforslag,
  sjekkDomene,
  sjekkRegisteret,
  type Domenestatus,
  type Enhet,
  type Registersvar,
} from '../../../lib/navnesjekk'

/**
 * Navnesjekken: et gratis verktøy for den som skal starte firma.
 *
 * Det er det første folk lurer på – «er navnet ledig?» – og de søker etter
 * det lenge før de tenker på logo eller nettside. Derfor står siden åpent,
 * uten innlogging, og slutter med det naturlige neste steget: logoen for
 * navnet.
 *
 * Navnet ligger i adressen (`?navn=…`), så et svar kan deles og bokmerkes,
 * og tilbake-knappen virker. Alt spørres direkte fra nettleseren; se
 * lib/navnesjekk.ts for kildene.
 */
export default function NavnesjekkSide() {
  const sporsmal = faqFor('navn')
  useSEO({
    title: 'Navnesjekk – er firmanavnet ledig? | Vimzo',
    description:
      'Sjekk gratis om firmanavnet er ledig: samme og lignende navn i Brønnøysundregistrene, og om .no-domenet ' +
      'er ledig. Svar på sekunder, uten innlogging.',
    jsonLd: [brodsmuler([{ navn: 'Navnesjekk', sti: '/navnesjekk' }]), navnesjekkLd(), faqLd(sporsmal)],
  })

  const [sok, setSok] = useSearchParams()
  const navn = (sok.get('navn') ?? '').trim().slice(0, MAKS_NAVN)
  const [felt, setFelt] = useState(navn)

  function send(e: FormEvent) {
    e.preventDefault()
    const n = felt.trim()
    setSok(n ? { navn: n } : {}, { replace: false })
  }

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Navnesjekk' }]}
        stikkord="Gratis verktøy"
        tittel="Er firmanavnet ledig?"
        ingress="Sjekk navnet mot Brønnøysundregistrene og .no-domenet – på sekunder, uten innlogging."
        handlinger={
      <Sokeskjema onSubmit={send} role="search">
        <label htmlFor="navn">Firmanavn</label>
        <div>
          <input
            id="navn"
            type="text"
            inputMode="text"
            autoComplete="organization"
            placeholder="F.eks. Fjordbakeriet"
            maxLength={MAKS_NAVN}
            value={felt}
            onChange={(e) => setFelt(e.target.value)}
            autoFocus={!navn}
          />
          <button type="submit" disabled={!felt.trim()}>
            <Icon navn="sok" storrelse={18} tykkelse={2} />
            <span>Sjekk navnet</span>
          </button>
        </div>
      </Sokeskjema>
        }
      />

      {navn && (
        <Seksjon $flate="surface" $tett>
          <Wrap>
            <Resultat key={navn} navn={navn} />
          </Wrap>
        </Seksjon>
      )}

      <Seksjon $tett aria-labelledby="sporsmal-navn">
        <Wrap>
          <Smal>
            <Tittel id="sporsmal-navn" $niva="medium">
              Før du bestemmer deg
            </Tittel>
            <Sporsmalsliste sporsmal={sporsmal} />
          </Smal>
        </Wrap>
      </Seksjon>
    </>
  )
}

/* ------------------------------------------------------------- resultat */

function Resultat({ navn }: { navn: string }) {
  const [register, setRegister] = useState<Registersvar | 'feil' | null>(null)
  const domener = domeneforslag(navn)
  const [domenestatus, setDomenestatus] = useState<Record<string, Domenestatus>>({})

  // Komponenten får ny `key` for hvert navn, så state starter tom hver gang.
  useEffect(() => {
    const avbryt = new AbortController()
    sjekkRegisteret(navn, avbryt.signal)
      .then(setRegister)
      .catch(() => !avbryt.signal.aborted && setRegister('feil'))
    for (const d of domeneforslag(navn))
      sjekkDomene(d, avbryt.signal)
        .then((s) => setDomenestatus((m) => ({ ...m, [d]: s })))
        .catch(() => {})
    return () => avbryt.abort()
  }, [navn])

  const iBruk = register && register !== 'feil' && register.like.some((e) => !e.inaktiv)
  const hovedDomene = domener[0]
  const domeneLedig = hovedDomene && domenestatus[hovedDomene] === 'ledig'

  return (
    <>
      <Kort aria-live="polite">
        <Kolonne aria-labelledby="register-tittel">
          <Kilde>
            <Icon navn="dokument" storrelse={16} tykkelse={2} /> Brønnøysundregistrene
          </Kilde>
          {register === null ? (
            <Laster />
          ) : register === 'feil' ? (
            <Dom id="register-tittel" $tone="noytral">
              Fikk ikke svar fra registeret. Prøv igjen om litt.
            </Dom>
          ) : (
            <Register navn={navn} svar={register} />
          )}
        </Kolonne>

        <Kolonne aria-labelledby="domene-tittel">
          <Kilde>
            <Icon navn="globus" storrelse={16} tykkelse={2} /> Domene
          </Kilde>
          {domener.length === 0 ? (
            <Dom id="domene-tittel" $tone="noytral">
              Navnet gir ikke noe gyldig .no-domene.
            </Dom>
          ) : (
            <>
              <Dom id="domene-tittel" $tone={!domenestatus[hovedDomene] ? 'noytral' : domeneLedig ? 'ledig' : 'opptatt'}>
                {!domenestatus[hovedDomene]
                  ? 'Sjekker domenet …'
                  : domeneLedig
                    ? `${hovedDomene} er ledig`
                    : domenestatus[hovedDomene] === 'opptatt'
                      ? `${hovedDomene} er tatt`
                      : `Fikk ikke sjekket ${hovedDomene}`}
              </Dom>
              <Liste>
                {domener.map((d) => (
                  <li key={d}>
                    <span>{d}</span>
                    <Status $s={domenestatus[d]}>
                      {domenestatus[d] === 'ledig'
                        ? 'Ledig'
                        : domenestatus[d] === 'opptatt'
                          ? 'Tatt'
                          : domenestatus[d] === 'feil'
                            ? 'Ukjent'
                            : '…'}
                    </Status>
                  </li>
                ))}
              </Liste>
              <Merknad>«Ledig» betyr ledig akkurat nå – domenet er ikke reservert for deg.</Merknad>
            </>
          )}
        </Kolonne>
      </Kort>

      <Videre>
        <div>
          <h2>{iBruk ? 'Fant du et annet navn?' : `Klar for «${navn}»?`}</h2>
          <p>
            {iBruk
              ? 'Prøv en variant over – eller se hvordan navnet ser ut som logo før du bestemmer deg.'
              : 'Se navnet som logo på sekunder. Det koster ingenting å designe.'}
          </p>
        </div>
        <Knapp til={`/logo?navn=${encodeURIComponent(navn)}`} ikon="pilHoyre" stor>
          Lag logo for navnet
        </Knapp>
      </Videre>

      <Kildeinfo>
        Søket er en pekepinn: om navnet kan registreres, avgjør Foretaksregisteret. Sjekk også{' '}
        <a href={PATENTSTYRET} target="_blank" rel="noopener noreferrer">
          varemerker hos Patentstyret
        </a>
        .
      </Kildeinfo>
    </>
  )
}

function Register({ navn, svar }: { navn: string; svar: Registersvar }) {
  const aktive = svar.like.filter((e) => !e.inaktiv)
  const dom =
    aktive.length > 0
      ? { tone: 'opptatt' as const, tekst: `${aktive.length === 1 ? 'Et foretak' : `${aktive.length} foretak`} heter «${navn}»` }
      : svar.like.length > 0
        ? { tone: 'noytral' as const, tekst: `Navnet er brukt av et foretak som er slettet eller avvikles` }
        : svar.antallBegynnerLikt > 0
          ? { tone: 'ledig' as const, tekst: `Ingen heter akkurat «${navn}»` }
          : { tone: 'ledig' as const, tekst: `Ingen registrerte foretak heter «${navn}»` }

  const vis = [...svar.like, ...svar.begynnerLikt, ...svar.lignende].slice(0, 6)
  return (
    <>
      <Dom id="register-tittel" $tone={dom.tone}>
        {dom.tekst}
      </Dom>
      {vis.length > 0 && (
        <>
          <Undertittel>
            {svar.like.length ? 'Samme og lignende navn' : 'Lignende navn i registeret'}
            {svar.antallBegynnerLikt > svar.begynnerLikt.length && ` · ${svar.antallBegynnerLikt} begynner likt`}
          </Undertittel>
          <Liste>
            {vis.map((e) => (
              <Foretak key={e.orgnr} e={e} lik={svar.like.includes(e)} />
            ))}
          </Liste>
        </>
      )}
    </>
  )
}

function Foretak({ e, lik }: { e: Enhet; lik: boolean }) {
  return (
    <li>
      <a href={brregLenke(e.orgnr)} target="_blank" rel="noopener noreferrer">
        <strong>{e.navn}</strong>
        <small>
          {[e.form, e.sted, e.inaktiv ? 'Slettet eller under avvikling' : ''].filter(Boolean).join(' · ')}
        </small>
      </a>
      {lik && <Status $s={e.inaktiv ? 'feil' : 'opptatt'}>Samme</Status>}
    </li>
  )
}

function Laster() {
  return (
    <Skjelett aria-label="Søker i registeret">
      <span />
      <span />
      <span />
    </Skjelett>
  )
}

/* ------------------------------------------------------------------ stil */

const Sokeskjema = styled.form`
  width: min(100%, 640px);

  /* Feltet sier selv hva det er; etiketten er for skjermlesere. */
  label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  > div {
    display: flex;
    gap: 0.5rem;
    padding: 0.4rem;
    border: 1.5px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.surface};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      box-shadow ${({ theme }) => theme.transitions.default};

    &:focus-within {
      border-color: ${({ theme }) => theme.colors.accentVivid};
      box-shadow:
        ${({ theme }) => theme.shadows.lg},
        0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
    }
  }

  input {
    flex: 1;
    min-width: 0;
    min-height: 56px;
    padding: 0 1.25rem;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: var(--fs-lead);
    color: ${({ theme }) => theme.colors.ink};

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.inkSubtle};
    }
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
    padding: 0 1.5rem;
    border: 0;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.accentVivid};
    color: ${({ theme }) => theme.colors.accentOn};
    font: inherit;
    font-size: var(--fs-body);
    font-weight: 600;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transitions.default};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.accentVividHover};
    }

    &:disabled {
      opacity: 0.55;
      cursor: default;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    button span {
      display: none;
    }

    button {
      padding: 0 1.1rem;
    }
  }
`

const Kort = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  max-width: 1040px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Kolonne = styled.section`
  display: grid;
  align-content: start;
  gap: 0.9rem;
  min-width: 0;

  & + & {
    @media (min-width: 861px) {
      padding-left: clamp(1.5rem, 4vw, 3rem);
      border-left: 1px solid ${({ theme }) => theme.colors.border};
    }

    @media (max-width: 860px) {
      padding-top: 1.5rem;
      border-top: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`

const Kilde = styled.p`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

type Tone = 'ledig' | 'opptatt' | 'noytral'

const Dom = styled.h2<{ $tone: Tone }>`
  margin: 0;
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: var(--ls-title);
  line-height: 1.3;
  overflow-wrap: anywhere;
  color: ${({ theme, $tone }) =>
    $tone === 'ledig' ? theme.colors.success : $tone === 'opptatt' ? theme.colors.warning : theme.colors.ink};
`

const Undertittel = styled.p`
  margin: 0.4rem 0 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Liste = styled.ul`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 52px;
    padding: 0.5rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: var(--fs-body);
  }

  li:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  a {
    display: grid;
    min-width: 0;
    color: inherit;
    text-decoration: none;

    &:hover strong {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  strong {
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Status = styled.span<{ $s?: Domenestatus }>`
  flex: none;
  padding: 0.2rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: var(--fs-micro);
  font-weight: 600;

  ${({ theme, $s }) =>
    $s === 'ledig'
      ? css`
          background: ${theme.colors.successSoft};
          color: ${theme.colors.success};
        `
      : $s === 'opptatt'
        ? css`
            background: ${theme.colors.warningSoft};
            color: ${theme.colors.warning};
          `
        : css`
            background: ${theme.colors.sunken};
            color: ${theme.colors.inkSubtle};
          `}
`

const Merknad = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Videre = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  max-width: 1040px;
  margin: 1.25rem auto 0;
  padding: clamp(1.5rem, 4vw, 2.25rem) clamp(1.5rem, 4vw, 2.5rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.accentSoft};

  h2 {
    margin: 0 0 0.3rem;
    font-size: var(--fs-title);
    font-weight: 600;
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  > div {
    flex: 1 1 320px;
  }
`

const Kildeinfo = styled.p`
  max-width: 1040px;
  margin: 1.25rem auto 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkSubtle};

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Skjelett = styled.div`
  display: grid;
  gap: 0.75rem;

  span {
    height: 18px;
    border-radius: 9px;
    background: ${({ theme }) => theme.colors.sunken};
    animation: puls 1.4s ease-in-out infinite;
  }

  span:first-child {
    width: 70%;
    height: 26px;
  }

  span:last-child {
    width: 85%;
  }

  @keyframes puls {
    50% {
      opacity: 0.55;
    }
  }
`

const Smal = styled.div`
  max-width: 820px;
  margin: 0 auto;
`

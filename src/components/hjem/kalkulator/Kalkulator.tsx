import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { STARTSTEG, gaTil as stegGaTil, skalVidere, videreFra, type Stegtilstand } from '../../../lib/kalkulatorSteg'
import styled, { css, keyframes } from 'styled-components'
import Icon from '../../shared/Icon'
import Estimat from './Estimat'
import Oppsummering from './Oppsummering'
import LogoVelger from './LogoVelger'
import { BRANSJER } from '../../../data/bransjer'
import { formaterPris, formaterRamme } from '../../../data/pakker'
import { useDomenesjekk } from '../../../hooks/useDomenesjekk'
import {
  BILDER,
  foreslaDomene,
  fotoInngar,
  LOGO,
  OMFANG,
  STARTSVAR,
  VERKTOY,
  lagBrief,
  regnUt,
  type Svar,
} from '../../../data/kalkulator'

const STEG = ['Bransje', 'Omfang', 'Innhold', 'Verktøy', 'Bedrift'] as const

/**
 * Kalkulatoren på forsiden.
 *
 * Den gjør to jobber på én gang. Kunden får et ærlig anslag og en liste over
 * hva som pleier å inngå før han har snakket med et menneske – det er grunnen
 * til å bli værende. Og vi får et ferdig brief i stedet for «hei, hva koster
 * en nettside?», slik at samtalen kan handle om det som faktisk avgjør prisen.
 *
 * Fire steg, aldri flere, og estimatet står ved siden av hele veien. Ingen
 * trenger å fullføre for å få noe ut av det, og ingenting sendes noe sted før
 * man trykker send.
 */
export default function Kalkulator() {
  /** Steg, lengste steg og retning – reglene står i src/lib/kalkulatorSteg.ts. */
  const [tilstand, setTilstand] = useState<Stegtilstand>(STARTSTEG)
  const { steg, retning } = tilstand
  const [svar, setSvar] = useState<Svar>(STARTSVAR)
  const navnId = useId()
  const stedId = useId()
  const domeneId = useId()
  // Sjekker bare når kunden faktisk trenger et nytt. Eier han det alt,
  // ville «opptatt» vært et svar om hans eget domene.
  const domenestatus = useDomenesjekk(svar.domenevalg === 'trenger' ? svar.domene : '')
  const [oppsummering, setOppsummering] = useState(false)
  const toppRef = useRef<HTMLDivElement>(null)

  const estimat = regnUt(svar)
  const sett = <K extends keyof Svar>(nokkel: K, verdi: Svar[K]) => setSvar((s) => ({ ...s, [nokkel]: verdi }))

  function vekslVerktoy(id: string) {
    setSvar((s) => ({
      ...s,
      verktoy: s.verktoy.includes(id) ? s.verktoy.filter((v) => v !== id) : [...s.verktoy, id],
    }))
  }

  /**
   * Bytt steg, og ta med kunden opp til starten av det nye.
   *
   * På en telefon står «Neste» nederst i et steg som kan være to skjermer
   * høyt. Uten dette landet man midt i neste steg og måtte lete seg opp
   * igjen – det var det som gjorde flyten hakkete. Står toppen alt på
   * skjermen, rører vi ingenting; da ville et hopp bare vært uro.
   */
  function rullTilTopp() {
    const el = toppRef.current
    if (!el) return
    const navHoyde = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-hoyde')) || 72
    const topp = el.getBoundingClientRect().top
    if (topp < navHoyde || topp > window.innerHeight * 0.5) {
      window.scrollTo({
        top: window.scrollY + topp - navHoyde - 12,
        behavior: 'smooth',
      })
    }
  }

  /** Kundens eget trykk – på et steg, «Neste» eller «Tilbake» – vinner alltid over en ventende «videre». */
  function gaTil(i: number) {
    window.clearTimeout(videre.current)
    setTilstand((t) => stegGaTil(t, i, STEG.length))
    rullTilTopp()
  }

  /**
   * Videre av seg selv etter et valg som bare har ett svar.
   *
   * Bransje og omfang er ett trykk hver. Å måtte trykke «Neste» etter et
   * spørsmål man allerede har svart på, er det som gjør et skjema til et
   * skjema. Den korte pausen lar kunden se at valget ble tatt før steget
   * skifter – uten den føles det som om noe hoppet.
   *
   * Men bare første gang steget besvares. Har kunden gått tilbake for å bytte
   * bransje, blir han stående – ellers ble han sendt til steg to fra steg fem.
   * Og fyrer tidtakeren etter at kunden har flyttet seg selv, skjer ingenting.
   */
  const videre = useRef<number | undefined>(undefined)

  function videreEtter(fra: number) {
    // Et lite dunk i hånda på telefoner som støtter det (Android). Ingen
    // lyd, ingen animasjon – bare bekreftelsen man kjenner fra en ekte knapp.
    navigator.vibrate?.(8)
    window.clearTimeout(videre.current)
    if (!skalVidere(tilstand, fra, STEG.length)) return
    videre.current = window.setTimeout(() => {
      setTilstand((t) => videreFra(t, fra, STEG.length))
      rullTilTopp()
    }, 320)
  }

  // Ingen «videre» som fyrer etter at kalkulatoren er borte.
  useEffect(() => () => window.clearTimeout(videre.current), [])

  /**
   * Vis oppsummeringen. Den sender ingenting før kunden selv trykker send.
   * Mangler omfanget, finnes det ikke noe anslag å oppsummere – da går vi
   * til steget der det velges i stedet.
   */
  function send() {
    if (!estimat.klar) {
      gaTil(1)
      return
    }
    setOppsummering(true)
  }

  return (
    // «Fri sone»: kalkulatoren har sin egen «Ta en prat om dette», så den
    // flytende kontaktknappen viker mens den er på skjermen.
    <Rute data-fri-sone>
      <Panel>
        <Stegrad ref={toppRef} role="tablist" aria-label="Steg i kalkulatoren">
          {STEG.map((navn, i) => (
            <Stegknapp
              key={navn}
              type="button"
              role="tab"
              aria-selected={i === steg}
              $aktiv={i === steg}
              $passert={i < steg}
              onClick={() => gaTil(i)}
            >
              <Strek aria-hidden="true" />
              <span>{navn}</span>
            </Stegknapp>
          ))}
        </Stegrad>

        <Felt key={steg} $retning={retning}>
          {steg === 0 && (
            <Gruppe>
              <Sporsmal as="legend">Hva driver du med?</Sporsmal>
              <Fliser>
                {BRANSJER.map((b) => (
                  <Flis
                    key={b.id}
                    type="button"
                    $valgt={svar.bransje.id === b.id}
                    aria-pressed={svar.bransje.id === b.id}
                    onClick={() => {
                      sett('bransje', b)
                      videreEtter(0)
                    }}
                  >
                    {b.navn}
                  </Flis>
                ))}
              </Fliser>
            </Gruppe>
          )}

          {steg === 1 && (
            <Gruppe>
              <Sporsmal as="legend">Hvor mye skal fram på siden?</Sporsmal>
              <Stabel>
                {OMFANG.map((o) => (
                  <Valg
                    key={o.verdi}
                    type="button"
                    $valgt={svar.omfang === o.verdi}
                    aria-pressed={svar.omfang === o.verdi}
                    onClick={() => {
                      sett('omfang', o.verdi)
                      videreEtter(1)
                    }}
                  >
                    <Prikk aria-hidden="true" />
                    <Valgtekst>
                      <strong>{o.navn}</strong>
                      <em>{o.hint}</em>
                    </Valgtekst>
                  </Valg>
                ))}
              </Stabel>
            </Gruppe>
          )}

          {steg === 2 && (
            <>
              <Gruppe>
                <Sporsmal as="legend">Bilder</Sporsmal>
                <Stabel>
                  {BILDER.map((b) => {
                    const dekket = b.verdi === 'trenger' && fotoInngar(svar)
                    return (
                      <Valg
                        key={b.verdi}
                        type="button"
                        $valgt={svar.bilder === b.verdi}
                        aria-pressed={svar.bilder === b.verdi}
                        onClick={() => sett('bilder', b.verdi)}
                      >
                        <Prikk aria-hidden="true" />
                        <Valgtekst>
                          <strong>{b.navn}</strong>
                          <em>{b.hint}</em>
                        </Valgtekst>
                        {b.pris !== undefined &&
                          (dekket ? (
                            <Valgpris $dekket>inngår</Valgpris>
                          ) : (
                            <Valgpris>
                              {b.fraPris && <small>fra </small>}
                              {formaterPris(b.pris)} kr
                            </Valgpris>
                          ))}
                      </Valg>
                    )
                  })}
                </Stabel>
              </Gruppe>

              <Gruppe>
                <Sporsmal as="legend">Logo</Sporsmal>
                <Stabel>
                  {LOGO.map((l) => (
                    <Fragment key={l.verdi}>
                      <Valg
                        type="button"
                        $valgt={svar.logo === l.verdi}
                        aria-pressed={svar.logo === l.verdi}
                        onClick={() => sett('logo', l.verdi)}
                      >
                        <Prikk aria-hidden="true" />
                        <Valgtekst>
                          <strong>{l.navn}</strong>
                          <em>{l.hint}</em>
                        </Valgtekst>
                        {l.pris !== undefined && (
                          <Valgpris>
                            {l.fraPris && <small>fra </small>}
                            {formaterPris(l.pris)} kr
                          </Valgpris>
                        )}
                      </Valg>
                      {/* Velgeren står rett under valget den hører til, og lastes
                        først når valget er tatt – se LogoVelger. */}
                      {l.verdi === 'verktoy' && svar.logo === 'verktoy' && (
                        <LogoVelger valgt={svar.logodesign} onVelg={(v) => sett('logodesign', v)} />
                      )}
                    </Fragment>
                  ))}
                </Stabel>
              </Gruppe>
            </>
          )}

          {steg === 3 && (
            <>
              <Gruppe>
                <Sporsmal as="legend">Skal siden gjøre noe mer?</Sporsmal>
                <Hjelp>Valgfritt. Alt skreddersys, så prisene er fra-priser.</Hjelp>
                <Rutenett>
                  {VERKTOY.map((v) => (
                    <Verktoykort
                      key={v.id}
                      type="button"
                      $valgt={svar.verktoy.includes(v.id)}
                      aria-pressed={svar.verktoy.includes(v.id)}
                      onClick={() => vekslVerktoy(v.id)}
                    >
                      <Icon navn={v.ikon} storrelse={18} tykkelse={1.8} />
                      <strong>{v.navn}</strong>
                      <Kortpris>
                        {v.fraPris && <small>fra </small>}
                        {formaterPris(v.pris)} kr
                      </Kortpris>
                    </Verktoykort>
                  ))}
                </Rutenett>
                <Fotnote>Ingen månedsavgift til andre. Data lagres i Europa.</Fotnote>
              </Gruppe>
            </>
          )}
          {steg === 4 && (
            <>
              <div>
                <Sporsmal>Hvem lager vi den for?</Sporsmal>
                <Hjelp>Alt er valgfritt. Med navnet ditt foreslår vi et domene og sjekker om det er ledig.</Hjelp>
              </div>
              <Parrad>
                <Merkelapp htmlFor={navnId}>
                  Firmanavn
                  <input
                    id={navnId}
                    value={svar.navn}
                    onChange={(e) => sett('navn', e.target.value)}
                    placeholder="F.eks. Hansen Rør"
                    autoComplete="organization"
                  />
                </Merkelapp>
                <Merkelapp htmlFor={stedId}>
                  Sted
                  <input
                    id={stedId}
                    value={svar.sted}
                    onChange={(e) => sett('sted', e.target.value)}
                    placeholder="F.eks. Lillehammer"
                    autoComplete="address-level2"
                  />
                </Merkelapp>
              </Parrad>

              <Gruppe>
                <Etikettrad as="legend">
                  Domene <Valgfritt>valgfritt</Valgfritt>
                </Etikettrad>
                <Brikker>
                  <Brikke
                    type="button"
                    $valgt={svar.domenevalg === 'trenger'}
                    aria-pressed={svar.domenevalg === 'trenger'}
                    onClick={() => sett('domenevalg', 'trenger')}
                  >
                    Jeg trenger et nytt
                  </Brikke>
                  <Brikke
                    type="button"
                    $valgt={svar.domenevalg === 'har'}
                    aria-pressed={svar.domenevalg === 'har'}
                    onClick={() => sett('domenevalg', 'har')}
                  >
                    Jeg har et allerede
                  </Brikke>
                </Brikker>
                <SkjultEtikett htmlFor={domeneId}>
                  {svar.domenevalg === 'har' ? 'Hvilket domene har du?' : 'Hvilket domene vil du ha?'}
                </SkjultEtikett>
                <Domenefelt
                  id={domeneId}
                  value={svar.domene}
                  onChange={(e) => sett('domene', e.target.value)}
                  placeholder={foreslaDomene(svar.navn) || 'hansen-ror.no'}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </Gruppe>
              {svar.domenevalg === 'har' && (
                <Domenesvar $status="info">
                  Fint – da peker vi det hit. Si fra hvis du har e-post på domenet, så flytter vi den uten at noe
                  stopper underveis.
                </Domenesvar>
              )}

              {/* «Ledig akkurat nå», aldri «reservert» – noen kan rekke å
                  registrere det mellom oppslaget og bestillingen. */}
              {domenestatus !== 'tom' && (
                <Domenesvar $status={domenestatus}>
                  {domenestatus === 'sjekker' && 'Sjekker …'}
                  {domenestatus === 'ledig' && (
                    <>
                      <Icon navn="sjekk" storrelse={13} tykkelse={3} />
                      Ledig akkurat nå – vi registrerer det i ditt navn
                    </>
                  )}
                  {domenestatus === 'opptatt' &&
                    'Opptatt. Eier du det selv, velg «Jeg har et allerede» – ellers finner vi et som ligner.'}
                  {domenestatus === 'ugyldig' && 'Skriv hele domenet, for eksempel hansen-ror.no'}
                  {domenestatus === 'feil' && 'Fikk ikke sjekket akkurat nå. Vi sjekker det uansett før vi begynner.'}
                </Domenesvar>
              )}
            </>
          )}
        </Felt>

        <Bunn>
          {steg > 0 ? (
            <Tilbake type="button" onClick={() => gaTil(steg - 1)} aria-label="Tilbake">
              <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
              <span>Tilbake</span>
            </Tilbake>
          ) : (
            <span />
          )}

          {/* Summen i lomma. Under 1040 px står estimatkortet under skjemaet,
              hundrevis av piksler unna – her holdes tallet ved tommelen mens
              man svarer. Skjult for skjermlesere: kortet leser det opp. */}
          <Lommesum aria-hidden="true">
            <span>Ditt anslag</span>
            {estimat.klar ? <strong>{formaterRamme(estimat.ramme)} kr</strong> : <em>Velg omfang</em>}
          </Lommesum>

          {steg < STEG.length - 1 ? (
            <Neste type="button" onClick={() => gaTil(steg + 1)}>
              Neste
              <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
            </Neste>
          ) : (
            <Neste type="button" onClick={send}>
              <span className="lang">Ta en prat om dette</span>
              <span className="kort">Send</span>
              <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
            </Neste>
          )}
        </Bunn>
      </Panel>

      <Estimat estimat={estimat} svar={svar} onSend={send} onVelgOmfang={() => gaTil(1)} />

      <Oppsummering
        apen={oppsummering}
        onLukk={() => setOppsummering(false)}
        svar={svar}
        estimat={estimat}
        brief={lagBrief(svar, estimat)}
      />
    </Rute>
  )
}

/* ------------------------------------------------------------------ flater */

/**
 * Hvert steg glir inn fra den siden man er på vei mot – fra høyre fram, fra
 * venstre tilbake. Retningen forteller hvor i flyten man er, uten ord.
 */
const inn = keyframes`
  from { opacity: 0; transform: translateX(var(--fra)); }
  to   { opacity: 1; transform: none; }
`

/**
 * To spalter som ikke er like.
 *
 * De var 1.05 mot 0.95 før – praktisk talt symmetrisk, og da leste de som to
 * likeverdige bokser ved siden av hverandre. Men de er ikke likeverdige:
 * skjemaet er noe du gjør, estimatet er grunnen til at du gjør det.
 *
 * Hierarkiet ligger ikke i bredden, men i materialet. Skjemaet har mistet
 * kortet sitt og står rett på papiret; estimatet er fortsatt en mørk, tung
 * flate. Da trenger ikke spalten å være bredest for å vinne – og skjemaet får
 * plassen det faktisk trenger til femten bransjebrikker.
 */
const Rute = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.86fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: start;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

/**
 * Skjemaet, uten kort.
 *
 * Det lå i en hvit boks med skygge før. Boksen var halvtom nederst, og tom
 * plass inne i et kort leser som uferdig – mens den samme plassen på papiret
 * bare leser som luft. Feltene, brikkene og kortene inni er fortsatt hvite,
 * så de løfter seg nå fra papiret i stedet for å forsvinne i en hvit flate.
 */
const Panel = styled.div`
  display: flex;
  flex-direction: column;
  /* Lavere enn før. 460 px holdt knapperaden i ro nederst i kortet, men uten
     kortet ble det bare et tomt felt med en strek svevende i. Nå er minimum
     omtrent så høyt som steg 1 trenger, så knappen hopper lite mellom steg
     uten at det oppstår dødt rom på de korte stegene. */
  min-height: 340px;
  padding-top: 0.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 0;
  }
`

/** Feltet vokser, så knapperaden står på samme sted uansett hvilket steg man er på. */
const Felt = styled.div<{ $retning: 1 | -1 }>`
  --fra: ${({ $retning }) => $retning * 18}px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.75rem 0 1.5rem;
  animation: ${inn} 0.4s ${({ theme }) => theme.easing.soft} both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/* -------------------------------------------------------------- stegrekken */

/**
 * Stegrekken: fire streker med navnet under.
 *
 * Den var piller med nummer i sirkler, og på en telefon måtte de fleste
 * navnene skjules for å få plass. Streker sier det samme – hvor langt
 * du har kommet og hvor mye som er igjen – med halvparten av blekket, og
 * alle navnene får plass på 320 px.
 */
const Stegrad = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.4rem;
  /* Rom over når siden ruller hit, så navbaren ikke legger seg oppå. */
  scroll-margin-top: calc(var(--nav-hoyde) + 1rem);
`

const Strek = styled.span`
  display: block;
  height: 3px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    background: ${({ theme }) => theme.colors.ink};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s ${({ theme }) => theme.easing.soft};
  }
`

const Stegknapp = styled.button<{ $aktiv: boolean; $passert: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
  /* Hele kolonnen er trykkflate, ikke bare streken: 44 px høy. */
  padding: 0.5rem 0 0.35rem;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  letter-spacing: var(--ls-small);
  text-align: left;
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.ink : theme.colors.inkSubtle)};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.default};

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${({ $aktiv, $passert }) =>
    ($aktiv || $passert) &&
    css`
      ${Strek}::after {
        transform: scaleX(1);
      }
    `}

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

/* --------------------------------------------------------------- spørsmål */

const Gruppe = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
`

/**
 * Spørsmålet i hvert steg, stort.
 *
 * Det sto i brødtekstgrad før, som en etikett over et skjema. Nå er hvert
 * steg ett spørsmål, og spørsmålet er overskriften – det er det kunden
 * skal tenke på, ikke feltene under.
 */
const Sporsmal = styled.p`
  margin: 0 0 0.35rem;
  padding: 0;
  font-size: var(--fs-title);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: var(--ls-title);
  color: ${({ theme }) => theme.colors.ink};
  text-wrap: balance;
`

/**
 * Bransjene som fliser, to i bredden på telefon.
 *
 * De var små piller i en klump. Som åpningsspørsmål må de være det
 * motsatte: store, rolige flater man treffer med tommelen uten å sikte.
 */
const Fliser = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr 1fr;
  }
`

const Flis = styled.button<{ $valgt: boolean }>`
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0.75rem 1rem;
  border: 1.5px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: var(--ls-body);
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Hjelp = styled.p`
  margin: 0 0 0.85rem;
  font-size: var(--fs-small);
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.inkSubtle};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Parrad = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

/**
 * Etikett med felt under. Samme stil som spørsmålene («Hva driver du med?») –
 * de sto i versaler før, og da hadde kalkulatoren tre ulike etikettstiler på
 * én skjerm.
 */
const Merkelapp = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: var(--ls-body);
  color: ${({ theme }) => theme.colors.ink};

  input {
    width: 100%;
    min-height: 52px;
    padding: 0 1rem;
    /* Fylt grått uten kant: et felt leser som et felt av tonen alene, og en
       strek rundt hvert av dem var mye linjer på liten plass. */
    border: 1.5px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.sunken};
    font-family: inherit;
    /* 16 px: under det zoomer iPhone inn når feltet får fokus. */
    font-size: var(--fs-body);
    font-weight: 500;
    letter-spacing: var(--ls-body);
    color: ${({ theme }) => theme.colors.ink};
    text-transform: none;
    transition: all ${({ theme }) => theme.transitions.default};

    &::placeholder {
      color: ${({ theme }) => theme.colors.inkSubtle};
    }

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      background: ${({ theme }) => theme.colors.surface};
      box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
    }
  }
`

/**
 * Etiketten og «valgfritt» på samme linje.
 *
 * `Merkelapp` er en kolonne, så uten dette omslaget ble de to til hver sin
 * rad – og «valgfritt» sto og svevde over feltet som om det var en egen
 * overskrift.
 */
const Etikettrad = styled.span`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  font-size: var(--fs-body);
  font-weight: 600;
  letter-spacing: var(--ls-body);
  color: ${({ theme }) => theme.colors.ink};
`

/** «valgfritt» inne i en feltetikett. Små bokstaver, så den ikke roper. */
const Valgfritt = styled.span`
  font-size: var(--fs-micro);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: none;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

/**
 * Svaret på domeneoppslaget.
 *
 * Står rett under feltet og ikke som en boks ved siden av – dette er en
 * bekreftelse, ikke en feilmelding, og den skal lese som om noen nikker.
 */
const Domenesvar = styled.p<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.45rem 0 0;
  font-size: var(--fs-small);
  line-height: 1.45;
  color: ${({ theme, $status }) => ($status === 'ledig' ? theme.colors.success : theme.colors.inkSubtle)};

  svg {
    flex-shrink: 0;
  }
`

const Brikker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
`

/**
 * Etikett for skjermlesere.
 *
 * Feltet har en `legend` over seg med to brikker, så en synlig etikett i
 * tillegg ville vært støy. Men feltet spør om to forskjellige ting avhengig
 * av hvilken brikke som er valgt, og det må en skjermleser få vite.
 */
const SkjultEtikett = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`

/** Domenefeltet. Står utenfor `Merkelapp`, siden etiketten her er en legend. */
const Domenefelt = styled.input`
  width: 100%;
  min-height: 52px;
  margin-top: 0.6rem;
  padding: 0 1rem;
  border: 1.5px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.sunken};
  transition: all ${({ theme }) => theme.transitions.default};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: var(--ls-body);
  color: ${({ theme }) => theme.colors.ink};

  &::placeholder {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentVivid};
    background: ${({ theme }) => theme.colors.surface};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
  }
`

/**
 * Brikkene. Valgt er en lys indigo tone, ikke svart – med femten av dem på
 * én skjerm var én svart pille det første og hardeste øyet traff.
 */
const Brikke = styled.button<{ $valgt: boolean }>`
  min-height: 40px;
  padding: 0 1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  box-shadow: ${({ theme, $valgt }) => ($valgt ? `inset 0 0 0 1.5px ${theme.colors.accentVivid}` : 'none')};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  letter-spacing: var(--ls-small);
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
    background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.border)};
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Stabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.6rem;
`

/**
 * Radioprikken.
 *
 * Den er tegnet i CSS og ikke som ikon, fordi den må kunne animere mellom
 * tom og fylt uten at noe hopper. `box-shadow` som innerring i stedet for
 * `border`, så størrelsen er den samme i begge tilstander.
 */
const Prikk = styled.span`
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: inset 0 0 0 1.5px ${({ theme }) => theme.colors.borderStrong};
  transition: all ${({ theme }) => theme.transitions.default};
`

/** Felles stil for de klikkbare valgene. Brukes av både radiovalg og bryteren. */
const valgStil = css<{ $valgt: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  padding: 1rem 1.1rem;
  border: 1.5px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  strong {
    display: block;
    font-size: var(--fs-body);
    font-weight: 600;
    letter-spacing: var(--ls-body);
    color: ${({ theme }) => theme.colors.ink};
  }

  em {
    display: block;
    margin-top: 0.12rem;
    font-size: var(--fs-small);
    font-style: normal;
    line-height: 1.45;
    /* inkMuted, ikke inkSubtle: på den blå flaten til et valgt alternativ
       falt den lyseste grået under 4.5:1. */
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  }

  /* Én myk glorie i stedet for den globale ringen. Ringen sto tre piksler
     utenfor kanten, og sammen med kanten til et valgt kort ble det to
     streker rundt samme ting. */
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }

  ${({ $valgt, theme }) =>
    $valgt &&
    css`
      ${Prikk} {
        background: ${theme.colors.accentVivid};
        box-shadow:
          inset 0 0 0 1.5px ${theme.colors.accentVivid},
          inset 0 0 0 4px ${theme.colors.surface};
      }
    `}
`

const Valg = styled.button<{ $valgt: boolean }>`
  ${valgStil}
`

/** Tekstdelen av et valg. Tar plassen som blir igjen når prisen har fått sin. */
const Valgtekst = styled.span`
  flex: 1;
  min-width: 0;
`

/**
 * Hva valget koster, på samme linje som valget.
 *
 * «inngår» settes i aksentfarge fordi det er en god nyhet – det betyr at
 * pakken kunden allerede har havnet i, dekker jobben.
 */
const Valgpris = styled.span<{ $dekket?: boolean }>`
  flex-shrink: 0;
  margin-top: 0.1rem;
  font-family: ${({ theme, $dekket }) => ($dekket ? theme.fonts.body : theme.fonts.mono)};
  font-size: var(--fs-small);
  font-weight: 600;
  letter-spacing: var(--ls-small);
  white-space: nowrap;
  color: ${({ theme, $dekket }) => ($dekket ? theme.colors.success : theme.colors.inkMuted)};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: var(--fs-micro);
    font-weight: 500;
    letter-spacing: var(--ls-micro);
  }
`

/**
 * Prisen på verktøykortet.
 *
 * Den sto ikke her før, og da valgte man i blinde – beløpet dukket først opp
 * i estimatet ved siden av. Et valg som koster 4 900 skal si det der valget
 * tas. «fra» settes mindre og i brødskrift, så tallet fortsatt er det man
 * leser først, men forbeholdet er umulig å overse.
 */
const Kortpris = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: var(--ls-micro);
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkSubtle};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: var(--fs-micro);
    font-weight: 500;
    letter-spacing: var(--ls-micro);
  }
`

const Fotnote = styled.p`
  margin: 0.7rem 0 0;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
`

/**
 * Et verktøy: ikon, navn og pris på én linje.
 *
 * Kortene hadde en forklaring under navnet før, og ni kort med tre linjer
 * tekst hver ble en vegg. Navnet sier nok til å velge; hva verktøyet gjør
 * i detalj, er det samtalen etterpå er til for.
 */
const Verktoykort = styled.button<{ $valgt: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 56px;
  padding: 0.75rem 1rem;
  border: 1.5px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  svg {
    flex-shrink: 0;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
    transition: color ${({ theme }) => theme.transitions.default};
  }

  strong {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-body);
    font-weight: 500;
    letter-spacing: var(--ls-body);
    line-height: 1.25;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  }

  ${Kortpris} {
    flex-shrink: 0;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
  }

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

/* ------------------------------------------------------------------- bunn */

/**
 * Knapperaden.
 *
 * På en stor skjerm ligger den rolig under skjemaet. Under 1040 px blir den
 * en linje som følger tommelen: den limer seg til bunnen av skjermen så
 * lenge kalkulatoren er synlig, med summen i midten. Da trenger man aldri
 * å rulle for å finne «Neste», og aldri lete etter hva valget kostet.
 *
 * `sticky`, ikke `fixed` – den slipper når skjemaet er rullet forbi, og
 * legger seg på plassen sin i stedet for å henge over resten av siden.
 */
const Bunn = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 1040px) {
    position: sticky;
    bottom: 0;
    z-index: 5;
    gap: 0.75rem;
    margin: 0 -1.25rem;
    padding: 0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.86);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);

    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      background: #fff;
    }
  }
`

/** Bare på små skjermer – på store står estimatkortet rett ved siden av. */
const Lommesum = styled.div`
  display: none;

  @media (max-width: 1040px) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;

    span {
      font-size: var(--fs-micro);
      font-weight: 500;
      color: ${({ theme }) => theme.colors.inkSubtle};
    }

    strong {
      font-size: var(--fs-body);
      font-weight: 600;
      letter-spacing: var(--ls-body);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: ${({ theme }) => theme.colors.ink};
    }

    em {
      font-size: var(--fs-body);
      font-style: normal;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.ink};
    }
  }
`

const Tilbake = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 0.25rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: none;
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transitions.default},
    background ${({ theme }) => theme.transitions.default};

  svg {
    transform: rotate(180deg);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }

  /* Bare pila på telefon – plassen trengs til summen. */
  @media (max-width: 1040px) {
    width: 44px;
    padding: 0;
    background: ${({ theme }) => theme.colors.sunken};
    color: ${({ theme }) => theme.colors.ink};

    span {
      display: none;
    }
  }
`

/**
 * Den eneste knappen i kalkulatoren som har farge.
 *
 * Flateindigoen med hvit tekst, 5.9:1. Alt annet i skjemaet er svart og
 * hvitt, så det finnes aldri tvil om hvor man trykker for å komme videre.
 */
const Neste = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0 1.5rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 600;
  letter-spacing: var(--ls-body);
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:active {
    transform: scale(0.97);
  }

  .kort {
    display: none;
  }

  @media (max-width: 1040px) {
    .lang {
      display: none;
    }
    .kort {
      display: inline;
    }
  }
`

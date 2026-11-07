import { useId, useState } from 'react'
import styled, { css } from 'styled-components'
import Icon from '../../shared/Icon'
import Estimat from './Estimat'
import Oppsummering from './Oppsummering'
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

const STEG = ['Bedrift', 'Omfang', 'Innhold', 'Verktøy'] as const

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
  const [steg, setSteg] = useState(0)
  const [svar, setSvar] = useState<Svar>(STARTSVAR)
  const navnId = useId()
  const stedId = useId()
  const domeneId = useId()
  // Sjekker bare når kunden faktisk trenger et nytt. Eier han det alt,
  // ville «opptatt» vært et svar om hans eget domene.
  const domenestatus = useDomenesjekk(svar.domenevalg === 'trenger' ? svar.domene : '')
  const [oppsummering, setOppsummering] = useState(false)

  const estimat = regnUt(svar)
  const sett = <K extends keyof Svar>(nokkel: K, verdi: Svar[K]) => setSvar((s) => ({ ...s, [nokkel]: verdi }))

  function vekslVerktoy(id: string) {
    setSvar((s) => ({
      ...s,
      verktoy: s.verktoy.includes(id) ? s.verktoy.filter((v) => v !== id) : [...s.verktoy, id],
    }))
  }

  /**
   * Vis oppsummeringen. Den sender ingenting før kunden selv trykker send.
   * Mangler omfanget, finnes det ikke noe anslag å oppsummere – da går vi
   * til steget der det velges i stedet.
   */
  function send() {
    if (!estimat.klar) {
      setSteg(1)
      return
    }
    setOppsummering(true)
  }

  return (
    <Rute>
      <Panel>
        <Stegrad role="tablist" aria-label="Steg i kalkulatoren">
          {STEG.map((navn, i) => (
            <Stegknapp
              key={navn}
              type="button"
              role="tab"
              aria-selected={i === steg}
              $aktiv={i === steg}
              $passert={i < steg}
              onClick={() => setSteg(i)}
            >
              <Nummer aria-hidden="true">{i < steg ? <Icon navn="sjekk" storrelse={11} tykkelse={3.2} /> : i + 1}</Nummer>
              <Etikett $aktiv={i === steg}>{navn}</Etikett>
            </Stegknapp>
          ))}
        </Stegrad>

        <Lommesum aria-hidden="true">
          <span>{estimat.klar ? estimat.pakke.navn : 'Ditt anslag'}</span>
          <strong>
            {estimat.klar ? `${formaterRamme(estimat.ramme)} kr` : 'Velg omfang i steg 2'}
          </strong>
        </Lommesum>

        <Felt>
          {steg === 0 && (
            <>
              <Parrad>
                <Merkelapp htmlFor={navnId}>
                  Firmanavn
                  <input
                    id={navnId}
                    value={svar.navn}
                    onChange={(e) => sett('navn', e.target.value)}
                    placeholder="Hansen Rør"
                    autoComplete="organization"
                  />
                </Merkelapp>
                <Merkelapp htmlFor={stedId}>
                  Sted
                  <input
                    id={stedId}
                    value={svar.sted}
                    onChange={(e) => sett('sted', e.target.value)}
                    placeholder="Lillehammer"
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
                  Fint – da peker vi det hit. Si fra hvis du har e-post på domenet, så flytter vi
                  den uten at noe stopper underveis.
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

              <Gruppe>
                <Overskrift as="legend">Hva driver du med?</Overskrift>
                <Brikker>
                  {BRANSJER.map((b) => (
                    <Brikke
                      key={b.id}
                      type="button"
                      $valgt={svar.bransje.id === b.id}
                      aria-pressed={svar.bransje.id === b.id}
                      onClick={() => sett('bransje', b)}
                    >
                      {b.navn}
                    </Brikke>
                  ))}
                </Brikker>
              </Gruppe>
            </>
          )}

          {steg === 1 && (
            <Gruppe>
              <Overskrift as="legend">Hvor mye skal fram på siden?</Overskrift>
              <Hjelp>Dette er det eneste valget som bestemmer hvilken pakke du havner i.</Hjelp>
              <Stabel>
                {OMFANG.map((o) => (
                  <Valg
                    key={o.verdi}
                    type="button"
                    $valgt={svar.omfang === o.verdi}
                    aria-pressed={svar.omfang === o.verdi}
                    onClick={() => sett('omfang', o.verdi)}
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
                <Overskrift as="legend">Bilder</Overskrift>
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
                <Overskrift as="legend">Logo</Overskrift>
                <Stabel>
                  {LOGO.map((l) => (
                    <Valg
                      key={l.verdi}
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
                  ))}
                </Stabel>
              </Gruppe>
            </>
          )}

          {steg === 3 && (
            <>
              <Gruppe>
                <Overskrift as="legend">Skal siden gjøre noe mer enn å stå der?</Overskrift>
                <Hjelp>
                  Verktøyene skreddersys for bedriften din – de hentes ikke fra en hylle. Derfor er
                  beløpene under <strong>fra-priser</strong>. Hva det faktisk lander på, avtaler vi
                  når vi vet hva du trenger, og da står det skriftlig.
                </Hjelp>
                <Rutenett>
                  {VERKTOY.map((v) => (
                    <Verktoykort
                      key={v.id}
                      type="button"
                      $valgt={svar.verktoy.includes(v.id)}
                      aria-pressed={svar.verktoy.includes(v.id)}
                      onClick={() => vekslVerktoy(v.id)}
                    >
                      <Kortopp>
                        <Icon navn={v.ikon} storrelse={18} tykkelse={1.8} />
                        <Kortpris>
                          {v.fraPris && <small>fra </small>}
                          {formaterPris(v.pris)} kr
                        </Kortpris>
                      </Kortopp>
                      <strong>{v.navn}</strong>
                      <em>{v.hint}</em>
                    </Verktoykort>
                  ))}
                </Rutenett>
                <Fotnote>
                  Alt bygges inn i din egen side, så det påløper ingen månedsavgift til andre. Verktøy
                  som tar imot opplysninger krever database, og noen trenger også innlogging for
                  kundene dine – da varierer månedsprisen for drift også. Dataene lagres i Europa.
                </Fotnote>
              </Gruppe>

            </>
          )}
        </Felt>

        <Bunn>
          {steg > 0 ? (
            <Tilbake type="button" onClick={() => setSteg((s) => s - 1)}>
              <Icon navn="pilHoyre" storrelse={15} tykkelse={2} />
              Tilbake
            </Tilbake>
          ) : (
            <span />
          )}

          {steg < STEG.length - 1 ? (
            <Neste type="button" onClick={() => setSteg((s) => s + 1)}>
              Neste
              <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
            </Neste>
          ) : (
            <Neste type="button" onClick={send}>
              Ta en prat om dette
              <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
            </Neste>
          )}
        </Bunn>
      </Panel>

      <Estimat estimat={estimat} svar={svar} onSend={send} onVelgOmfang={() => setSteg(1)} />

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
const Felt = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 0 0.5rem;
`

/* -------------------------------------------------------------- stegrekken */

const Stegrad = styled.div`
  display: flex;
  gap: 0.25rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Nummer = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: ${({ theme }) => theme.colors.neutral[200]};
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: 0.75rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  transition: all ${({ theme }) => theme.transitions.default};
`

const Stegknapp = styled.button<{ $aktiv: boolean; $passert: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.7rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  ${({ $aktiv, $passert, theme }) =>
    $aktiv
      ? css`
          background: ${theme.colors.ink};
          color: ${theme.colors.inkInverted};
          ${Nummer} {
            background: ${theme.colors.accentVivid};
            color: ${theme.colors.accentOn};
          }
        `
      : $passert &&
        css`
          color: ${theme.colors.ink};
          ${Nummer} {
            background: ${theme.colors.accentSoft};
            color: ${theme.colors.accentInk};
          }
        `}

  &:hover:not(:disabled) {
    color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.inkInverted : theme.colors.ink)};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    padding: 0.4rem 0.5rem;
  }
`

/**
 * Navnet på steget.
 *
 * På små skjermer er det bare plass til ett av dem, og da er det det man
 * står på som betyr noe – de andre klarer seg med nummeret. Alternativet var
 * å skjule alle fire, men da mister raden evnen til å si hvor man er, og en
 * stegindikator uten det er bare dekor.
 */
const Etikett = styled.span<{ $aktiv: boolean }>`
  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    display: ${({ $aktiv }) => ($aktiv ? 'inline' : 'none')};
  }
`

/**
 * Summen i lomma.
 *
 * Under 1040 px legger estimatkortet seg under kalkulatoren, og da er tallet
 * utenfor skjermen hele tiden mens man svarer – på en telefon er det hundrevis
 * av piksler ned. Denne linja holder beløpet synlig der valgene tas. Den er
 * `aria-hidden`, fordi det fulle estimatet står rett under og leses opp der;
 * skjermlesere skal ikke høre tallet to ganger.
 */
const Lommesum = styled.div`
  display: none;

  @media (max-width: 1040px) {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.9rem;
    padding: 0.6rem 0.85rem;
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.accentSoft};

    span {
      font-size: 0.75rem;
      font-weight: 650;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: ${({ theme }) => theme.colors.accentInk};
    }

    strong {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: ${({ theme }) => theme.colors.accentInk};
    }
  }
`

/* --------------------------------------------------------------- spørsmål */

const Gruppe = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
`

const Overskrift = styled.p`
  margin: 0 0 0.2rem;
  padding: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.colors.ink};
`

const Hjelp = styled.p`
  margin: 0 0 0.85rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.inkSubtle};

  strong {
    font-weight: 650;
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

const Merkelapp = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};

  input {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    /* Hvit, ikke papir: flaten under er nå papir, og papir på papir
       forsvinner. Feltet skal lese som et felt. */
    background: ${({ theme }) => theme.colors.surface};
    font-family: inherit;
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: -0.01em;
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
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
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
`

/** «valgfritt» inne i en feltetikett. Små bokstaver, så den ikke roper. */
const Valgfritt = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
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
  font-size: 0.875rem;
  line-height: 1.45;
  color: ${({ theme, $status }) =>
    $status === 'ledig' ? theme.colors.success : theme.colors.inkSubtle};

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
  margin-top: 0.6rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.ink};

  &::placeholder {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentVivid};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
`

const Brikke = styled.button<{ $valgt: boolean }>`
  padding: 0.44rem 0.85rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? 'transparent' : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.ink : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.inkInverted : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? 'transparent' : theme.colors.borderStrong)};
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.inkInverted : theme.colors.ink)};
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
  padding: 0.85rem 1rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  strong {
    display: block;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: ${({ theme }) => theme.colors.ink};
  }

  em {
    display: block;
    margin-top: 0.12rem;
    font-size: 0.8125rem;
    font-style: normal;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.borderStrong)};
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
  font-size: ${({ $dekket }) => ($dekket ? '0.75rem' : '0.8125rem')};
  font-weight: 600;
  letter-spacing: ${({ $dekket }) => ($dekket ? '-0.005em' : '-0.03em')};
  white-space: nowrap;
  color: ${({ theme, $dekket }) => ($dekket ? theme.colors.success : theme.colors.inkSubtle)};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0;
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
const Kortopp = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`

const Kortpris = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkSubtle};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0;
  }
`

const Fotnote = styled.p`
  margin: 0.7rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
`

const Verktoykort = styled.button<{ $valgt: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  svg {
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
    transition: color ${({ theme }) => theme.transitions.default};
  }

  ${Kortpris} {
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkSubtle)};
  }

  strong {
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: ${({ theme }) => theme.colors.ink};
  }

  em {
    font-size: 0.75rem;
    font-style: normal;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    border-color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : theme.colors.borderStrong)};
  }
`

/* ------------------------------------------------------------------- bunn */

const Bunn = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Tilbake = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.25rem;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 550;
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.default};

  svg {
    transform: rotate(180deg);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

/**
 * Den eneste knappen i kalkulatoren som har farge.
 *
 * Flateindigoen med hvit tekst, 5.9:1. Tekstindigoen hadde vært mørkere og
 * klart mer, men en knapp skal lyse opp raden – ikke gå i ett med den.
 */
const Neste = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0 1.4rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:active {
    transform: scale(0.985);
  }
`

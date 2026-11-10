import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled, { css, keyframes } from 'styled-components'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, logoverktoyLd } from '../../../lib/jsonLd'
import { faqFor } from '../../../data/faq'
import Sporsmalsliste from '../../shared/Sporsmalsliste'
import { BRANSJER } from '../../../data/bransjer'
import { Wrap } from '../../../ui'
import Icon from '../../shared/Icon'
import LogoSvg from './LogoSvg'
import { ApneProfil, ProfilMiniatyrer, Vannmerke } from './Profil'
import Bestilling from './Bestilling'
import { Bekreft, Innlogging } from './Innlogging'
import { PRODUKTER, formaterKr, innloggingMulig, loggUt, serialiser, useBruker } from './kjop'
import { OPPGRADERING } from '../../../data/logoprodukter'
import {
  NETTSIDE,
  dekod,
  hentDesign,
  kjopFraSky,
  kod,
  lagreDesign,
  lagreLokalt,
  lesLokalt,
  merkSomKjopt,
} from './lagring'
import { BRANSJETEMA, FAMILIER, PALETTER, SKRIFTSTILER, STILER, SYMBOLER, type Familie } from './merker'
import { LogoFonter, useFonter } from './fonter'
import { sokIkoner, useBransjeikoner, type Ikon } from './ikoner'
import { ABSTRAKT_NAVN, abstraktSerie } from './abstrakt'
import { STANDARD, finnSkrift, visningsnavn, lagForslag, type Design, type Innhold, type MerkeId } from './motor'
import { INNEBYGD, sendTilKalkulator } from '../../../lib/innebygd'

/**
 * Logoverktøyet.
 *
 * Bygget slik folk kjenner logoverktøy i dag: navn, stil, et rutenett med
 * forslag, og så en editor for den du liker best. Standardveien er tre steg
 * og gir en god logo uten at man rører en eneste innstilling. Alle
 * valgene ligger i editoren – gruppert, med de vanligste først og de fine
 * justeringene bak «Flere valg».
 *
 * Å lage og se på logoen koster ingenting, men krever innlogging – da har
 * hver logo en eier, og arbeidet lagres underveis. Filene bestilles.
 */
export default function LogoSide() {
  useSEO({
    title: 'Lag logo – logoverktøy på norsk for bedrifter | Vimzo',
    description:
      `Lag logo på norsk: skriv navnet og velg blant ferdige forslag. Gratis å lage – filene fra ` +
      `${formaterKr(PRODUKTER.logo.pris)} eks. mva, klare til trykk og gravering.`,
    jsonLd: [brodsmuler([{ navn: 'Lag logo', sti: '/logo' }]), logoverktoyLd(), faqLd(faqFor('logo'))],
  })

  const bruker = useBruker()
  const [bekreftet, setBekreftet] = useState(false)

  // I modalen: Esc lukker den, også når fokus er her inne i rammen.
  // Står en dialog eller meny åpen her, tar den Esc selv (defaultPrevented).
  useEffect(() => {
    if (!INNEBYGD) return
    const ved = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('dialog[open]'))
        sendTilKalkulator({ type: 'vimzo:logo-lukk' })
    }
    window.addEventListener('keydown', ved)
    return () => window.removeEventListener('keydown', ved)
  }, [])
  const fonterKlare = useFonter()

  const trengerBekreftelse =
    bruker && !bruker.emailVerified && !bekreftet && bruker.providerData.some((p) => p.providerId === 'password')

  return (
    <>
      <LogoFonter />
      {/* «Fri sone»: verktøyet har sin egen bunnlinje, så den flytende
          kontaktknappen viker. */}
      <Flate data-fri-sone data-fonter={fonterKlare ? 'klare' : 'laster'}>
        {bruker === undefined ? (
          <Wrap>
            <Laster aria-live="polite">Et øyeblikk …</Laster>
          </Wrap>
        ) : !bruker ? (
          <Landing />
        ) : trengerBekreftelse ? (
          <Wrap>
            <Smal>
              <Topptittel>Bekreft e-posten din</Topptittel>
              <Bekreft bruker={bruker} onBekreftet={() => setBekreftet(true)} />
            </Smal>
          </Wrap>
        ) : (
          <Verktoy uid={bruker.uid} epost={bruker.email ?? ''} bruker={bruker} />
        )}
      </Flate>
    </>
  )
}

/* -------------------------------------------------------------------- landing */

/**
 * Det man ser før man er logget inn.
 *
 * Ikke en salgsside – en smakebit på resultatet. Tre ekte forslag fra den
 * samme generatoren som verktøyet bruker, ved siden av innloggingen. Den som
 * kommer hit, skal se kvaliteten før han gir fra seg e-postadressen.
 */
function Landing() {
  const eksempler = useMemo(
    () => [
      {
        innhold: { navn: 'Fjord Rør', slagord: 'Rørlegger i Bergen' },
        design: {
          ...STANDARD,
          merke: 'drape',
          beholder: 'flis',
          skrift: 'fet',
          palett: 'fjord',
        } as Design,
      },
      {
        innhold: { navn: 'Lind & Co', slagord: 'Frisør' },
        design: {
          ...STANDARD,
          merke: 'blad',
          oppsett: 'over',
          skrift: 'elegant',
          palett: 'salvie',
        } as Design,
      },
      {
        innhold: { navn: 'Berg Bygg', slagord: 'Tømrer siden 1998' },
        design: {
          ...STANDARD,
          merke: 'fjell',
          beholder: 'sirkel',
          skrift: 'tung',
          palett: 'terrakotta',
        } as Design,
      },
    ],
    [],
  )
  return (
    <Wrap>
      <Landingsgitter>
        <div>
          {!INNEBYGD && <Stikk>Lag logo på norsk</Stikk>}
          <h1>Lag en logo som ser tegnet ut.</h1>
          <Ingress>
            {INNEBYGD
              ? 'Skriv navnet, velg en stil og plukk blant ferdige forslag. Logg inn først, så lagres logoen på kontoen din.'
              : 'Skriv navnet, velg en stil og plukk blant ferdige forslag. Logg inn, så designer du så mye du vil – gratis.'}
          </Ingress>
          <Steg>
            <li>
              <b>1</b>Navn og bransje
            </li>
            <li>
              <b>2</b>Stil og farger
            </li>
            <li>
              <b>3</b>Velg og tilpass
            </li>
          </Steg>
          <InnloggingsBoks>
            {innloggingMulig ? <Innlogging /> : <Ingress>Logoverktøyet er ikke tilgjengelig akkurat nå.</Ingress>}
            {INNEBYGD ? (
              <Smaatekst>
                Logoen følger med nettsiden og faktureres sammen med den, når siden er ferdig. Du betaler ingenting
                nå.
              </Smaatekst>
            ) : (
              <Smaatekst>
                Filene koster {formaterKr(PRODUKTER.logo.pris)} eks. mva, eller {formaterKr(PRODUKTER.profil.pris)}{' '}
                eks. mva med hel visuell profil. De er klare til trykk og gravering, og logoen kan brukes rett på
                nettsiden Vimzo lager for deg.
              </Smaatekst>
            )}
          </InnloggingsBoks>
        </div>

        <Utstilling aria-label="Eksempler på logoer laget med verktøyet">
          {eksempler.map((e, i) => {
            const p = PALETTER.find((x) => x.id === e.design.palett)!
            return (
              <Utstillingskort
                key={e.innhold.navn}
                $bg={i === 1 ? p.lys : i === 2 ? p.primaer : '#fff'}
                $stor={i === 0}
              >
                <LogoSvg design={e.design} innhold={e.innhold} variant={i === 2 ? 'negativ' : 'positiv'} />
              </Utstillingskort>
            )
          })}
        </Utstilling>
      </Landingsgitter>

      {!INNEBYGD && (
        <Sporsmal aria-labelledby="logo-sporsmal">
          <h2 id="logo-sporsmal">Vanlige spørsmål om logoen</h2>
          <Sporsmalsliste sporsmal={faqFor('logo')} />
        </Sporsmal>
      )}
    </Wrap>
  )
}

/* -------------------------------------------------------------------- verktøy */

const STEG = ['Navn', 'Stil', 'Forslag', 'Tilpass', 'Profil', 'Bestill'] as const
/** I kalkulatoren slutter verktøyet ved «Tilpass» – profil og filer følger med nettsiden. */
const STEGLISTE: readonly string[] = INNEBYGD ? STEG.slice(0, 4) : STEG

function Verktoy({
  uid,
  epost,
  bruker,
}: {
  uid: string
  epost: string
  bruker: NonNullable<ReturnType<typeof useBruker>>
}) {
  const [sok] = useSearchParams()
  // En lenke fra profilsiden (`?d=…`) går foran det som er lagret lokalt.
  const lagret = useMemo(() => {
    // «Lag en ny» fra kalkulatoren: start blankt, ikke på forrige logo.
    if (INNEBYGD && sok.has('ny')) return null
    // Fra navnesjekken (`?navn=…`): en ny logo for akkurat det navnet.
    if (sok.has('navn')) return null
    const lokalt = lesLokalt(uid)
    const d = sok.get('d')
    const fraLenke = d ? dekod(d) : null
    return fraLenke ? { bransje: 'annet', stiler: [], ...lokalt, ...fraLenke } : lokalt
  }, [uid, sok])
  const [steg, setSteg] = useState(lagret ? (sok.get('steg') === 'bestill' ? 5 : 3) : 0)
  const [innhold, setInnhold] = useState<Innhold>(
    lagret?.innhold ?? { navn: (sok.get('navn') ?? '').trim().slice(0, 32), slagord: '' },
  )
  // Navnet fra navnesjekken er brukt nå. Ta det ut av adressen, så en ny
  // innlasting fortsetter på logoen i stedet for å starte på nytt.
  useEffect(() => {
    if (!sok.has('navn')) return
    const url = new URL(window.location.href)
    url.searchParams.delete('navn')
    window.history.replaceState(window.history.state, '', url)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- én gang, ved oppstart
  }, [])
  const [bransje, setBransje] = useState(lagret?.bransje ?? '')
  const [stiler, setStiler] = useState<string[]>(lagret?.stiler ?? [])
  const [familier, setFamilier] = useState<Familie[]>([])
  const [historikk, sendHistorikk] = useReducer(historikkReduserer, lagret?.design ?? STANDARD, (d) => ({
    naa: d,
    fortid: [],
    framtid: [],
    sist: 0,
  }))
  const design = historikk.naa
  const setDesign = useCallback(
    (d: Design | ((d: Design) => Design)) => sendHistorikk({ type: 'sett', d, t: performance.now() }),
    [],
  )
  const angre = useCallback(() => sendHistorikk({ type: 'angre' }), [])
  const gjenta = useCallback(() => sendHistorikk({ type: 'gjenta' }), [])
  const [bestilling, setBestilling] = useState(lagret?.bestilling)
  // Kjøpt = det finnes en bestilling av nøyaktig dette designet. Endres noe, er det et nytt design.
  const kjopt = Boolean(bestilling && bestilling.design === serialiser(design, innhold))
  // Frigitt av Vimzo med nettsiden: ingen bestilling, ingen faktura herfra.
  const frigitt = kjopt && bestilling?.id === NETTSIDE
  const [fro, setFro] = useState(1)

  /* ---------------------------------------------------- lagring i skyen */

  /**
   * Designet lagres på kundens konto, så det ligger på Min side og følger
   * ham til en annen maskin. Det opprettes først når navnet er skrevet – et
   * tomt design er ikke verdt en rad – og lagres så to sekunder etter siste
   * endring og ved hvert stegbytte. localStorage er bare reserven.
   */
  const [designId, setDesignId] = useState<string | null>(sok.get('design') ?? lagret?.designId ?? null)
  const idRef = useRef(designId)
  const sist = useRef('')
  const [lagring, setLagring] = useState<'' | 'lagrer' | 'lagret' | 'feil'>('')
  const skyMulig = innloggingMulig && uid !== 'demo'

  const lagreNa = useCallback(async (): Promise<string | null> => {
    if (!skyMulig || !innhold.navn.trim()) return idRef.current
    const data = serialiser(design, innhold)
    if (data === sist.current && idRef.current) return idRef.current
    setLagring('lagrer')
    try {
      const { logoSvg } = await import('./eksport')
      const svg = await logoSvg(design, innhold).catch(() => '')
      const id = await lagreDesign(idRef.current, {
        navn: innhold.navn.trim(),
        design: data,
        forhandsvisning: svg.length <= 30000 ? svg : '',
      })
      idRef.current = id
      sist.current = data
      setDesignId(id)
      setLagring('lagret')
      return id
    } catch (e) {
      console.error(e)
      setLagring('feil')
      return idRef.current
    }
  }, [skyMulig, design, innhold])

  useEffect(() => {
    if (!skyMulig || !innhold.navn.trim() || serialiser(design, innhold) === sist.current) return
    const t = window.setTimeout(() => void lagreNa(), 2000)
    return () => window.clearTimeout(t)
  }, [skyMulig, design, innhold, lagreNa])

  // /logo?design=<id> fra Min side: hent designet, og om det er kjøpt.
  useEffect(() => {
    const id = sok.get('design')
    if (!id || !skyMulig) return
    let aktiv = true
    hentDesign(id)
      .then((d) => {
        if (!aktiv || !d) return
        const o = JSON.parse(d.design) as { design: Design; innhold: Innhold }
        const r = dekod(kod(o))
        if (!r) return
        const data = serialiser(r.design, r.innhold)
        sist.current = data
        idRef.current = d.id
        sendHistorikk({ type: 'nullstill', d: r.design })
        setInnhold(r.innhold)
        setDesignId(d.id)
        // Kjøpt i verktøyet, eller frigitt med nettsiden – begge gir rene filer.
        const kjop = kjopFraSky(d, data)
        if (kjop) setBestilling(kjop)
        setSteg(sok.get('lastned') || sok.get('steg') === 'bestill' ? 5 : 3)
      })
      .catch((e) => console.error(e))
    return () => {
      aktiv = false
    }
  }, [sok, skyMulig])

  // Bare i utvikling, med demobrukeren: lar testskriptet lage ZIP-pakken
  // uten å legge inn en ekte bestilling. Finnes ikke i produksjonsbygget.
  useEffect(() => {
    if (!import.meta.env.DEV || uid !== 'demo') return
    const w = window as unknown as { __vimzoTestPakke?: () => Promise<void> }
    w.__vimzoTestPakke = () => import('./eksport').then((e) => e.lastNedPakke(design, innhold, 'profil', 'TEST-0001'))
    return () => {
      delete w.__vimzoTestPakke
    }
  }, [uid, design, innhold])

  // Lagres underveis, per bruker – så logoen er der neste gang.
  useEffect(() => {
    lagreLokalt(uid, { design, innhold, bransje, stiler, bestilling, designId: designId ?? undefined })
  }, [uid, design, innhold, bransje, stiler, bestilling, designId])

  const bransjeikoner = useBransjeikoner(bransje || 'annet')
  const forslag = useMemo(
    () => lagForslag({ bransje, stiler, familier, ikoner: bransjeikoner }, fro),
    [bransje, stiler, familier, bransjeikoner, fro],
  )

  // Hvert stegbytte flytter fokus til stegets overskrift, så tastatur og
  // skjermleser starter øverst i det nye steget – ikke på en knapp som er borte.
  const stegRef = useRef<HTMLDivElement>(null)
  const forsteSteg = useRef(true)
  useEffect(() => {
    if (forsteSteg.current) {
      forsteSteg.current = false
      return
    }
    stegRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [steg])

  function ga(i: number) {
    void lagreNa()
    setSteg(i)
    if (i === 2) setKunngjoring(`${forslag.length} forslag er klare.`)
    const rolig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: rolig ? 'auto' : 'smooth' })
  }

  useRovingTabindex(stegRef)

  async function vedBestilt(b: { id: string; produkt: 'logo' | 'profil' }) {
    setBestilling({ ...b, design: serialiser(design, innhold) })
    // Knytt kjøpet til designet på Min side. Reglene krever at
    // bestillingen finnes og er kundens egen – det er den nå.
    const id = await lagreNa()
    if (id) await merkSomKjopt(id, b.id, b.produkt).catch((e) => console.error(e))
  }

  // Navnet mangler: si det, og sett markøren der det skal skrives.
  const [navnFeil, setNavnFeil] = useState(false)
  const navnRef = useRef<HTMLInputElement>(null)
  function videre() {
    if (steg === 0 && !innhold.navn.trim()) {
      setNavnFeil(true)
      navnRef.current?.focus()
      return
    }
    ga(steg + 1)
  }

  /**
   * Kalkulatoren: lagre designet og send det tilbake. Kalkulatoren lukker
   * modalen og velger logoen – den lister den også fra kontoen, men
   * meldingen gjør at valget er der med en gang.
   */
  const [brukerLogo, setBrukerLogo] = useState(false)
  async function brukILogo() {
    setBrukerLogo(true)
    try {
      sist.current = '' // tving en lagring, så forhåndsvisningen er fersk
      const id = await lagreNa()
      if (!id) {
        setKunngjoring('Kunne ikke lagre logoen. Prøv igjen om litt.')
        return
      }
      const { logoSvg } = await import('./eksport')
      const svg = await logoSvg(design, innhold).catch(() => '')
      sendTilKalkulator({
        type: 'vimzo:logo-valgt',
        logo: { id, navn: innhold.navn.trim(), forhandsvisning: svg.length <= 30000 ? svg : '' },
      })
    } finally {
      setBrukerLogo(false)
    }
  }

  // Kunngjøringen for skjermlesere: forslagene kommer uten at noe lastes.
  const [kunngjoring, setKunngjoring] = useState('')

  // Overskriftene bruker samme smarte store bokstaver som logoen («ola hansen» → «Ola Hansen»).
  const navn = innhold.navn.trim() ? visningsnavn(innhold.navn, finnSkrift('manrope')) : ''

  return (
    <>
      <Verktoylinje>
        <Wrap>
          <Linjeinnhold>
            <Stegrad aria-label="Steg">
              <div>
                {STEGLISTE.map((s, i) => (
                  <Stegknapp
                    key={s}
                    type="button"
                    $aktiv={i === steg}
                    $passert={i < steg}
                    disabled={i > 0 && !navn}
                    aria-current={i === steg ? 'step' : undefined}
                    onClick={() => ga(i)}
                  >
                    <i />
                    <span>{s}</span>
                  </Stegknapp>
                ))}
              </div>
              {/* På telefon er det ikke plass til seks navn – bare det aktive, med tall. */}
              <Stegnavn aria-hidden="true">
                {STEGLISTE[steg]} <span>· {steg + 1} av {STEGLISTE.length}</span>
              </Stegnavn>
            </Stegrad>
            <Konto>
              {/* Alltid i DOM-en: en statusregion må finnes før teksten endres. */}
              <Lagret
                role="status"
                title={
                  lagring === 'feil'
                    ? 'Kunne ikke lagre til kontoen akkurat nå. Endringene er lagret i denne nettleseren.'
                    : undefined
                }
              >
                {lagring === 'lagrer'
                  ? 'Lagrer …'
                  : lagring === 'lagret'
                    ? 'Lagret'
                    : lagring === 'feil'
                      ? 'Lagret på denne enheten'
                      : ''}
              </Lagret>
              <span>{epost}</span>
              {!INNEBYGD && (
                <button type="button" onClick={() => loggUt()}>
                  Logg ut
                </button>
              )}
            </Konto>
          </Linjeinnhold>
        </Wrap>
      </Verktoylinje>

      <Skjult aria-live="polite" role="status">
        {kunngjoring}
      </Skjult>

      <Wrap>
        <Stegflate key={steg} ref={stegRef}>
          {steg === 0 && (
            <Smal>
              <Topptittel tabIndex={-1}>Hva heter bedriften?</Topptittel>
              <div>
                <Stort
                  ref={navnRef}
                  aria-label="Firmanavn"
                  value={innhold.navn}
                  onChange={(e) => {
                    setNavnFeil(false)
                    setInnhold((x) => ({
                      ...x,
                      navn: e.target.value.slice(0, 32),
                    }))
                  }}
                  placeholder="Firmanavn"
                  autoComplete="organization"
                  maxLength={32}
                  autoFocus
                  aria-invalid={navnFeil || undefined}
                  aria-describedby={navnFeil ? 'navn-feil' : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && videre()}
                />
                {navnFeil && (
                  <Feilmelding id="navn-feil" role="alert">
                    Skriv navnet på bedriften for å gå videre.
                  </Feilmelding>
                )}
                {!INNEBYGD && (
                  <Navnelenke
                    to={innhold.navn.trim() ? `/navnesjekk?navn=${encodeURIComponent(innhold.navn.trim())}` : '/navnesjekk'}
                  >
                    Usikker på navnet? Sjekk om det er ledig <span aria-hidden="true">→</span>
                  </Navnelenke>
                )}
              </div>
              <Felt>
                <label htmlFor="slagord">
                  Slagord <small>valgfritt</small>
                </label>
                <input
                  id="slagord"
                  value={innhold.slagord}
                  onChange={(e) =>
                    setInnhold((x) => ({
                      ...x,
                      slagord: e.target.value.slice(0, 40),
                    }))
                  }
                  placeholder="F.eks. Rørlegger i Bergen"
                  maxLength={40}
                />
              </Felt>
              <Gruppe>
                <legend>Bransje</legend>
                <Brikker role="group" aria-label="Bransje" {...PILER}>
                  {BRANSJER.map((b) => (
                    <Brikke
                      key={b.id}
                      type="button"
                      $valgt={bransje === b.id}
                      aria-pressed={bransje === b.id}
                      onClick={() => setBransje(b.id)}
                    >
                      {b.navn}
                    </Brikke>
                  ))}
                </Brikker>
              </Gruppe>
            </Smal>
          )}

          {steg === 1 && (
            <Smal $bred>
              <Topptittel tabIndex={-1}>Hvilken stil passer {navn || 'bedriften'}?</Topptittel>
              <Hjelp>Velg én eller to. Hopp over, så får du litt av alt.</Hjelp>
              <Stilgitter role="group" aria-label="Stil" {...PILER}>
                {STILER.map((s) => {
                  const valgt = stiler.includes(s.id)
                  const eks: Design = {
                    ...STANDARD,
                    merke: symbolFor(bransje),
                    skrift: s.skrift[0],
                    beholder: s.beholdere[0],
                    oppsett: 'side',
                    palett: s.palett,
                    slagord: false,
                  }
                  return (
                    <Stilkort
                      key={s.id}
                      type="button"
                      $valgt={valgt}
                      aria-pressed={valgt}
                      onClick={() => setStiler((x) => (valgt ? x.filter((y) => y !== s.id) : [...x, s.id].slice(-2)))}
                    >
                      <Stilprove>
                        <LogoSvg design={eks} innhold={{ navn: navn || 'Ditt firma', slagord: '' }} />
                      </Stilprove>
                      <strong>{s.navn}</strong>
                      <span>{s.beskrivelse}</span>
                    </Stilkort>
                  )
                })}
              </Stilgitter>
              <Gruppe>
                <legend>Farger du liker</legend>
                <Fargegitter role="group" aria-label="Farger du liker" {...PILER}>
                  {FAMILIER.map((f) => {
                    const valgt = familier.includes(f.id)
                    const prover = PALETTER.filter((pl) => pl.familie === f.id)
                    return (
                      <Fargeflis
                        key={f.id}
                        type="button"
                        $valgt={valgt}
                        aria-pressed={valgt}
                        onClick={() => setFamilier((x) => (valgt ? x.filter((y) => y !== f.id) : [...x, f.id]))}
                      >
                        <Fargestripe aria-hidden="true">
                          {[...prover.map((pl) => pl.primaer), prover[0].aksent].slice(0, 4).map((h, i) => (
                            <i key={i} style={{ background: h }} />
                          ))}
                        </Fargestripe>
                        <span>{f.navn}</span>
                      </Fargeflis>
                    )
                  })}
                </Fargegitter>
              </Gruppe>
            </Smal>
          )}

          {steg === 2 && (
            <>
              <Hode>
                <div>
                  <Topptittel tabIndex={-1}>Forslag til {navn}</Topptittel>
                  <Hjelp>Velg den du liker best. Alt kan endres etterpå.</Hjelp>
                </div>
              </Hode>
              <Forslagsgitter {...PILER}>
                {forslag.map((d, i) => {
                  const p = PALETTER.find((x) => x.id === d.palett)!
                  const mork = i % 4 === 2
                  return (
                    <Forslagskort
                      key={`${fro}-${i}`}
                      type="button"
                      $bg={mork ? p.primaer : i % 4 === 1 ? p.lys : '#fff'}
                      onClick={() => {
                        setDesign(d)
                        ga(3)
                      }}
                      aria-label={`Velg forslag ${i + 1}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <LogoSvg design={d} innhold={innhold} variant={mork ? 'negativ' : 'positiv'} />
                    </Forslagskort>
                  )
                })}
              </Forslagsgitter>
            </>
          )}

          {steg === 3 && (
            <div data-vannmerke={kjopt ? 'av' : undefined}>
              <Editor
                design={design}
                setDesign={setDesign}
                angre={historikk.fortid.length ? angre : undefined}
                gjenta={historikk.framtid.length ? gjenta : undefined}
                kunngjor={setKunngjoring}
                innhold={innhold}
                setInnhold={setInnhold}
                ikoner={bransjeikoner}
              />
            </div>
          )}

          {steg === 4 && (
            <>
              <Hode>
                <div>
                  <Topptittel tabIndex={-1}>Profilen til {navn}</Topptittel>
                  <Hjelp>Seks ark – logo, farger, skrift og bruk. Klikk på et ark for å se det stort.</Hjelp>
                </div>
                <Handlinger>
                  <ApneProfil design={design} innhold={innhold}>
                    Åpne profilen
                  </ApneProfil>
                  <Sekundar as={Link} to={`/logo/profil?d=${kod({ design, innhold })}`}>
                    Egen side
                    <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
                  </Sekundar>
                </Handlinger>
              </Hode>
              {kjopt && bestilling?.produkt === 'logo' && (
                <Oppgrader>
                  Logoen er din. Vil du ha hele profilen også – profilbok, signatur og bilder til sosiale medier?{' '}
                  {designId ? (
                    <Link to={`/min-side/studio/${designId}?oppgrader=1`}>
                      Oppgrader for {formaterKr(OPPGRADERING.pris)}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => ga(5)}>
                      Bestill {PRODUKTER.profil.navn.toLowerCase()}
                    </button>
                  )}
                </Oppgrader>
              )}
              <div data-vannmerke={kjopt && bestilling?.produkt === 'profil' ? 'av' : undefined}>
                <ProfilMiniatyrer design={design} innhold={innhold} />
              </div>
            </>
          )}

          {steg === 5 &&
            (() => {
              const skjema = (
                <Bestilling
                  design={design}
                  innhold={innhold}
                  bruker={bruker}
                  bestilt={kjopt ? bestilling : null}
                  autoLastNed={sok.get('lastned') === '1'}
                  designId={designId}
                  onBestilt={vedBestilt}
                />
              )
              // Kjøpt eller frigitt: logoen stor ved siden av kvitteringen.
              if (kjopt)
                return (
                  <Bestillingsgitter>
                    <div>
                      <Topptittel tabIndex={-1}>Filene dine</Topptittel>
                      <Hjelp>
                        {frigitt
                          ? 'Valgt sammen med nettsiden – fakturaen kommer med den.'
                          : 'Ferdige filer uten vannmerke, klare til trykk og skjerm.'}
                      </Hjelp>
                      <Bestillingsprove>
                        <LogoSvg design={design} innhold={innhold} />
                      </Bestillingsprove>
                    </div>
                    {skjema}
                  </Bestillingsgitter>
                )
              // Bestilling: produktene og skjemaet side om side, logoen
              // som en liten påminnelse i hodet – hele steget på én skjerm.
              return (
                <>
                  <Hode>
                    <div>
                      <Topptittel tabIndex={-1}>Bestill filene</Topptittel>
                      <Hjelp>Ferdige filer uten vannmerke, klare til trykk og skjerm.</Hjelp>
                    </div>
                    <Miniprove aria-hidden="true">
                      <LogoSvg design={design} innhold={innhold} />
                    </Miniprove>
                  </Hode>
                  {skjema}
                </>
              )
            })()}
        </Stegflate>
      </Wrap>

      {steg !== 5 && (
        <Bunnlinje>
          <Wrap>
            <Bunninnhold $bredde={steg === 0 ? '620px' : steg === 1 ? '1080px' : undefined}>
              {steg > 0 ? (
                <Tilbake type="button" onClick={() => ga(steg - 1)} aria-label="Tilbake">
                  <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
                </Tilbake>
              ) : (
                <span />
              )}
              {steg === 2 ? (
                <Sekundar
                  type="button"
                  onClick={() => {
                    setFro((f) => f + 1)
                    setKunngjoring('Tolv nye forslag er klare.')
                  }}
                >
                  <Icon navn="gnist" storrelse={16} tykkelse={2} />
                  Flere forslag
                </Sekundar>
              ) : (
                <Hovedknapp
                  type="button"
                  onClick={INNEBYGD && steg === 3 ? brukILogo : videre}
                  disabled={brukerLogo}
                  aria-busy={brukerLogo || undefined}
                >
                  {steg === 0
                    ? 'Neste'
                    : steg === 1
                      ? 'Vis forslag'
                      : steg === 3
                        ? INNEBYGD
                          ? brukerLogo
                            ? 'Lagrer …'
                            : 'Bruk denne logoen'
                          : 'Se profilen'
                        : kjopt
                          ? 'Last ned filene'
                          : 'Bestill filene'}
                  <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
                </Hovedknapp>
              )}
            </Bunninnhold>
          </Wrap>
        </Bunnlinje>
      )}
    </>
  )
}

/* --------------------------------------------------------------------- editor */

type Fane = 'ikon' | 'oppsett' | 'skrift' | 'farger' | 'flere'

/**
 * Editoren. Fem faner, aldri alt på én gang. Hver fane viser valgene som
 * små, ekte forhåndsvisninger av logoen – man velger det man ser, ikke et
 * navn på en innstilling.
 */
function Editor({
  design,
  setDesign,
  angre,
  gjenta,
  kunngjor,
  innhold,
  setInnhold,
  ikoner,
}: {
  design: Design
  setDesign: (d: Design | ((d: Design) => Design)) => void
  /** Finnes bare når det er noe å angre. */
  angre?: () => void
  /** Finnes bare når det er noe å gjøre om. */
  gjenta?: () => void
  kunngjor: (tekst: string) => void
  innhold: Innhold
  setInnhold: (i: Innhold | ((i: Innhold) => Innhold)) => void
  ikoner: readonly Ikon[]
}) {
  const [fane, setFane] = useState<Fane>('ikon')
  const [merkefane, setMerkefane] = useState<'symboler' | 'abstrakte' | 'monogram' | 'tekst'>(
    design.merke === 'abstrakt' ? 'abstrakte' : design.merke === 'monogram' ? 'monogram' : 'symboler',
  )
  const [serie, setSerie] = useState(1)
  const [sok, setSok] = useState('')
  const [treff, setTreff] = useState<Ikon[] | null>(null)
  const [soker, setSoker] = useState(false)
  const [sokefeil, setSokefeil] = useState(false)

  async function finn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSoker(true)
    setSokefeil(false)
    try {
      const t = await sokIkoner(sok)
      setTreff(t)
      kunngjor(t.length ? `${t.length} symboler funnet.` : 'Ingen treff.')
    } catch {
      setTreff(null)
      setSokefeil(true)
    } finally {
      setSoker(false)
    }
  }

  /**
   * Angre og gjør om med tastaturet, som i alle andre designverktøy:
   * ⌘/Ctrl+Z og ⇧⌘/Ctrl+Z (eller Ctrl+Y). I et tekstfelt får feltet
   * beholde sin egen angring.
   */
  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'range' && (t as HTMLInputElement).type !== 'checkbox') || t.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      const fram = (k === 'z' && e.shiftKey) || (k === 'y' && !e.shiftKey)
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        angre?.()
      } else if (fram) {
        e.preventDefault()
        gjenta?.()
      }
    }
    window.addEventListener('keydown', tast)
    return () => window.removeEventListener('keydown', tast)
  }, [angre, gjenta])

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const cmd = mac ? '⌘' : 'Ctrl+'

  const velgIkon = (ikon: Ikon) => setDesign((d) => ({ ...d, merke: 'ikon', ikon }))
  const ikonvalg = (liste: readonly Ikon[]) =>
    liste.map((ikon) => (
      <Valgrute
        key={ikon.id}
        type="button"
        $valgt={design.merke === 'ikon' && design.ikon?.id === ikon.id}
        aria-pressed={design.merke === 'ikon' && design.ikon?.id === ikon.id}
        aria-label={ikon.id
          .split(':')[1]
          .replace(/-fill$/, '')
          .replace(/-/g, ' ')}
        onClick={() => velgIkon(ikon)}
      >
        <LogoSvg design={{ ...design, merke: 'ikon', ikon }} innhold={innhold} kunMerke />
      </Valgrute>
    ))
  const piler = PILER
  const editorRef = useRef<HTMLDivElement>(null)
  useRovingTabindex(editorRef)
  const sett = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((d) => ({ ...d, [k]: v }))
  const p = PALETTER.find((x) => x.id === design.palett) ?? PALETTER[0]

  return (
    <Editorgitter ref={editorRef}>
      <Skjult as="h1" tabIndex={-1}>
        Tilpass logoen
      </Skjult>
      <Scene>
        <Hovedlerret>
          <Vannmerke>
            <div style={{ width: 'min(100%, 520px)' }}>
              <LogoSvg design={design} innhold={innhold} />
            </div>
          </Vannmerke>
          <Angrerad>
            <Rund
              type="button"
              onClick={angre}
              disabled={!angre}
              aria-label="Angre"
              aria-keyshortcuts={mac ? 'Meta+Z' : 'Control+Z'}
              title={`Angre (${cmd}Z)`}
            >
              <PilBue />
            </Rund>
            <Rund
              type="button"
              onClick={gjenta}
              disabled={!gjenta}
              aria-label="Gjør om"
              aria-keyshortcuts={mac ? 'Shift+Meta+Z' : 'Shift+Control+Z'}
              title={`Gjør om (⇧${cmd}Z)`}
            >
              <PilBue speil />
            </Rund>
          </Angrerad>
        </Hovedlerret>
        <Smaalerret>
          <Minilerret $bg={p.primaer}>
            <LogoSvg design={design} innhold={innhold} variant="negativ" />
          </Minilerret>
          <Minilerret $bg={p.lys}>
            <LogoSvg design={design} innhold={innhold} kunMerke />
          </Minilerret>
        </Smaalerret>
      </Scene>

      <Kontroller>
        <Faner role="tablist" aria-label="Tilpass logoen" {...piler}>
          {(
            [
              ['ikon', 'Merke'],
              ['oppsett', 'Oppsett'],
              ['skrift', 'Skrift'],
              ['farger', 'Farger'],
              ['flere', 'Flere valg'],
            ] as const
          ).map(([id, n]) => (
            <Fanen
              key={id}
              id={`fane-${id}`}
              type="button"
              role="tab"
              aria-selected={fane === id}
              aria-controls="fanepanel"
              aria-label={id === 'flere' ? n : undefined}
              $aktiv={fane === id}
              onClick={() => setFane(id)}
            >
              {id === 'flere' ? (
                <>
                  <span className="lang">{n}</span>
                  <span className="kort" aria-hidden="true">
                    Mer
                  </span>
                </>
              ) : (
                n
              )}
            </Fanen>
          ))}
        </Faner>

        <Fanepanel role="tabpanel" id="fanepanel" aria-labelledby={`fane-${fane}`} key={fane}>
          {fane === 'ikon' && (
            <>
              <Segment $antall={4} role="tablist" aria-label="Type merke" {...piler}>
                {(
                  [
                    ['symboler', 'Symboler'],
                    ['abstrakte', 'Abstrakte'],
                    ['monogram', 'Monogram'],
                    ['tekst', 'Kun tekst'],
                  ] as const
                ).map(([id, n]) => (
                  <Segmentknapp
                    key={id}
                    id={`merke-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={merkefane === id}
                    aria-controls="merkepanel"
                    $valgt={merkefane === id}
                    onClick={() => setMerkefane(id)}
                  >
                    {n}
                  </Segmentknapp>
                ))}
              </Segment>

              <Merkepanel role="tabpanel" id="merkepanel" aria-labelledby={`merke-${merkefane}`}>
              {merkefane === 'symboler' && (
                <>
                  <Sokefelt onSubmit={finn} role="search">
                    <label htmlFor="ikonsok">Søk etter symbol</label>
                    <div>
                      <input
                        id="ikonsok"
                        value={sok}
                        onChange={(e) => setSok(e.target.value)}
                        placeholder="F.eks. hammer, leaf, coffee"
                        enterKeyHint="search"
                      />
                      <button type="submit" disabled={soker || sok.trim().length < 2}>
                        {soker ? '…' : 'Søk'}
                      </button>
                    </div>
                    <small>Søk på engelsk. Ikonene er fra åpne ikonbibliotek (Iconify).</small>
                  </Sokefelt>
                  {sokefeil && (
                    <Feilmelding role="alert">Søket virker ikke akkurat nå. Prøv igjen om litt.</Feilmelding>
                  )}
                  {treff && (
                    <>
                      <Undertittel>{treff.length ? 'Treff' : 'Ingen treff. Prøv et annet ord, gjerne på engelsk.'}</Undertittel>
                      {treff.length > 0 && (
                        <Valggitter $kol={6} {...piler}>
                          {ikonvalg(treff)}
                        </Valggitter>
                      )}
                    </>
                  )}
                  {ikoner.length > 0 && (
                    <>
                      <Undertittel>Foreslått for bransjen</Undertittel>
                      <Valggitter $kol={6} {...piler}>
                        {ikonvalg(ikoner)}
                      </Valggitter>
                    </>
                  )}
                  <Undertittel>Enkle former</Undertittel>
                  <Valggitter $kol={6} {...piler}>
                    {SYMBOLER.map((sy) => (
                      <Valgrute
                        key={sy.id}
                        type="button"
                        $valgt={design.merke === sy.id}
                        aria-pressed={design.merke === sy.id}
                        aria-label={sy.navn}
                        onClick={() =>
                          setDesign((d) => ({
                            ...d,
                            merke: sy.id,
                            oppsett: d.oppsett === 'ordbilde' ? 'side' : d.oppsett,
                          }))
                        }
                      >
                        <LogoSvg design={{ ...design, merke: sy.id }} innhold={innhold} kunMerke />
                      </Valgrute>
                    ))}
                  </Valggitter>
                </>
              )}

              {merkefane === 'abstrakte' && (
                <>
                  <Valggitter $kol={6} {...piler}>
                    {abstraktSerie(serie).map((a, i) => {
                      const valgt = design.merke === 'abstrakt' && design.abstrakt?.fro === a.fro
                      return (
                        <Valgrute
                          key={a.fro}
                          type="button"
                          $valgt={valgt}
                          aria-pressed={valgt}
                          aria-label={`Abstrakt merke ${i + 1}, ${ABSTRAKT_NAVN[a.familie]}`}
                          onClick={() =>
                            setDesign((d) => ({
                              ...d,
                              merke: 'abstrakt',
                              abstrakt: a,
                              oppsett: d.oppsett === 'ordbilde' ? 'side' : d.oppsett,
                            }))
                          }
                        >
                          <LogoSvg design={{ ...design, merke: 'abstrakt', abstrakt: a }} innhold={innhold} kunMerke />
                        </Valgrute>
                      )
                    })}
                  </Valggitter>
                  <Generer
                    type="button"
                    onClick={() => {
                      setSerie((x) => x + 1)
                      kunngjor('Tolv nye abstrakte merker.')
                    }}
                  >
                    <Icon navn="gnist" storrelse={16} tykkelse={2} />
                    Generer flere
                  </Generer>
                </>
              )}

              {merkefane === 'monogram' && (
                <Valggitter $kol={3} {...piler}>
                  {(['ingen', 'flis', 'sirkel'] as const).map((b) => (
                    <Valgrute
                      key={b}
                      type="button"
                      $valgt={design.merke === 'monogram' && design.beholder === b}
                      aria-pressed={design.merke === 'monogram' && design.beholder === b}
                      aria-label={`Initialer, ${b}`}
                      onClick={() =>
                        setDesign((d) => ({
                          ...d,
                          merke: 'monogram',
                          beholder: b,
                          oppsett: d.oppsett === 'ordbilde' ? 'side' : d.oppsett,
                        }))
                      }
                    >
                      <LogoSvg design={{ ...design, merke: 'monogram', beholder: b }} innhold={innhold} kunMerke />
                    </Valgrute>
                  ))}
                </Valggitter>
              )}

              {merkefane === 'tekst' && (
                <Valggitter $kol={1}>
                  <Valgrute
                    type="button"
                    $hoy
                    $valgt={design.oppsett === 'ordbilde'}
                    aria-pressed={design.oppsett === 'ordbilde'}
                    onClick={() => sett('oppsett', 'ordbilde')}
                  >
                    <LogoSvg design={{ ...design, oppsett: 'ordbilde' }} innhold={innhold} />
                    <small>Bare navnet – et rent ordbilde</small>
                  </Valgrute>
                </Valggitter>
              )}
              </Merkepanel>
              <Undertittel id="beholder-tittel">Form rundt ikonet</Undertittel>
              <Segment role="group" aria-labelledby="beholder-tittel" {...piler}>
                {(
                  [
                    ['ingen', 'Ingen'],
                    ['flis', 'Flis'],
                    ['sirkel', 'Sirkel'],
                  ] as const
                ).map(([id, n]) => (
                  <Segmentknapp
                    key={id}
                    type="button"
                    $valgt={design.beholder === id}
                    aria-pressed={design.beholder === id}
                    onClick={() => sett('beholder', id)}
                  >
                    {n}
                  </Segmentknapp>
                ))}
              </Segment>
            </>
          )}

          {fane === 'oppsett' && (
            <Valggitter $kol={2} {...piler}>
              {(
                [
                  ['side', 'Side om side'],
                  ['over', 'Ikon over'],
                  ['ordbilde', 'Bare navn'],
                  ['kun-merke', 'Bare ikon'],
                ] as const
              ).map(([id, n]) => (
                <Valgrute
                  key={id}
                  type="button"
                  $valgt={design.oppsett === id}
                  aria-pressed={design.oppsett === id}
                  $hoy
                  onClick={() => sett('oppsett', id)}
                >
                  <LogoSvg design={{ ...design, oppsett: id }} innhold={innhold} />
                  <small>{n}</small>
                </Valgrute>
              ))}
            </Valggitter>
          )}

          {fane === 'skrift' && (
            <>
              <Segment $antall={4} role="group" aria-label="Bokstaver" {...piler}>
                {(
                  [
                    ['stil', 'Som stilen'],
                    ['skrevet', 'Som skrevet'],
                    ['store', 'STORE'],
                    ['sma', 'små'],
                  ] as const
                ).map(([id, n]) => (
                  <Segmentknapp
                    key={id}
                    type="button"
                    $valgt={design.bokstaver === id}
                    aria-pressed={design.bokstaver === id}
                    onClick={() => sett('bokstaver', id)}
                  >
                    {n}
                  </Segmentknapp>
                ))}
              </Segment>
              <Liste aria-label="Skrift" role="group" {...piler}>
                {SKRIFTSTILER.map((s) => (
                  <Listevalg
                    key={s.id}
                    type="button"
                    $valgt={design.skrift === s.id}
                    aria-pressed={design.skrift === s.id}
                    onClick={() => sett('skrift', s.id)}
                  >
                    <div>
                      <LogoSvg
                        design={{
                          ...design,
                          skrift: s.id,
                          oppsett: 'ordbilde',
                          slagord: false,
                          sperring: 0,
                        }}
                        innhold={innhold}
                        hoyde={26}
                      />
                    </div>
                    <small>{s.navn}</small>
                  </Listevalg>
                ))}
              </Liste>
            </>
          )}

          {fane === 'farger' && (
            <Liste aria-label="Farger" role="group" {...piler}>
              {PALETTER.map((pl) => (
                <Listevalg
                  key={pl.id}
                  type="button"
                  $valgt={design.palett === pl.id}
                  aria-pressed={design.palett === pl.id}
                  onClick={() => sett('palett', pl.id)}
                >
                  <Fargerad>
                    {[pl.primaer, pl.aksent, pl.mork, pl.lys].map((h, i) => (
                      <i key={i} style={{ background: h }} />
                    ))}
                  </Fargerad>
                  <small>{pl.navn}</small>
                </Listevalg>
              ))}
            </Liste>
          )}

          {fane === 'flere' && (
            <Flere>
              <Felt>
                <label htmlFor="e-navn">Navn</label>
                <input
                  id="e-navn"
                  value={innhold.navn}
                  onChange={(e) =>
                    setInnhold((x) => ({
                      ...x,
                      navn: e.target.value.slice(0, 32),
                    }))
                  }
                />
              </Felt>
              <Felt>
                <label htmlFor="e-slagord">Slagord</label>
                <input
                  id="e-slagord"
                  value={innhold.slagord}
                  onChange={(e) =>
                    setInnhold((x) => ({
                      ...x,
                      slagord: e.target.value.slice(0, 40),
                    }))
                  }
                />
              </Felt>
              <Bryter>
                <input type="checkbox" checked={design.slagord} onChange={(e) => sett('slagord', e.target.checked)} />
                Vis slagord
              </Bryter>
              <Bryter>
                <input
                  type="checkbox"
                  checked={design.merkefarge === 'aksent'}
                  onChange={(e) => sett('merkefarge', e.target.checked ? 'aksent' : 'primaer')}
                />
                Ikon i aksentfargen
              </Bryter>
              <Glider
                navn="Ikonstørrelse"
                min={0.6}
                max={1.6}
                verdi={design.merkestorrelse}
                onChange={(v) => sett('merkestorrelse', v)}
              />
              <Glider navn="Avstand" min={0.4} max={2} verdi={design.avstand} onChange={(v) => sett('avstand', v)} />
              <Glider
                navn="Bokstavavstand"
                min={-0.06}
                max={0.3}
                steg={0.005}
                verdi={design.sperring}
                onChange={(v) => sett('sperring', v)}
              />
              <Tilbakestill
                type="button"
                onClick={() =>
                  setDesign((d) => ({
                    ...d,
                    merkestorrelse: 1,
                    avstand: 1,
                    sperring: 0,
                  }))
                }
              >
                Tilbakestill justeringer
              </Tilbakestill>
            </Flere>
          )}
        </Fanepanel>
      </Kontroller>
    </Editorgitter>
  )
}

function Glider({
  navn,
  min,
  max,
  steg = 0.05,
  verdi,
  onChange,
}: {
  navn: string
  min: number
  max: number
  steg?: number
  verdi: number
  onChange: (v: number) => void
}) {
  const id = `g-${navn}`
  return (
    <Glidefelt>
      <label htmlFor={id}>{navn}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={steg}
        value={verdi}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Glidefelt>
  )
}

/* -------------------------------------------------------------------- hjelpere */

/* ------------------------------------------------------- angre og gjør om */

interface Historikk {
  naa: Design
  fortid: Design[]
  framtid: Design[]
  /** Tidspunktet for siste endring – raske endringer (en glider) blir ett steg. */
  sist: number
}

type Historikkhandling =
  | { type: 'sett'; d: Design | ((d: Design) => Design); t: number }
  | { type: 'angre' }
  | { type: 'gjenta' }
  | { type: 'nullstill'; d: Design }

const MAKS_HISTORIKK = 100

/**
 * Designet med historikk. Hver endring legger det forrige designet på
 * stabelen; endringer som kommer tettere enn 500 ms (en glider som dras,
 * piltaster gjennom fargene) slås sammen til ett steg, slik Figma og Canva
 * gjør det – ellers må man trykke angre femti ganger.
 */
function historikkReduserer(h: Historikk, a: Historikkhandling): Historikk {
  if (a.type === 'nullstill') return { naa: a.d, fortid: [], framtid: [], sist: 0 }
  if (a.type === 'angre') {
    const forrige = h.fortid[h.fortid.length - 1]
    if (!forrige) return h
    return { naa: forrige, fortid: h.fortid.slice(0, -1), framtid: [h.naa, ...h.framtid], sist: 0 }
  }
  if (a.type === 'gjenta') {
    const neste = h.framtid[0]
    if (!neste) return h
    return { naa: neste, fortid: [...h.fortid, h.naa], framtid: h.framtid.slice(1), sist: 0 }
  }
  const ny = typeof a.d === 'function' ? a.d(h.naa) : a.d
  if (JSON.stringify(ny) === JSON.stringify(h.naa)) return h
  const sammen = a.t - h.sist < 500 && h.fortid.length > 0
  return {
    naa: ny,
    fortid: sammen ? h.fortid : [...h.fortid, h.naa].slice(-MAKS_HISTORIKK),
    framtid: [],
    sist: a.t,
  }
}

/* --------------------------------------------------------------- piltaster */

/**
 * Rutenett og lister av valg styres med piltastene (WAI-ARIA «roving
 * tabindex»): Tab går inn i gruppen og ut igjen i ett trykk, pilene flytter
 * innenfor. Opp og ned hopper en hel rad – antallet kolonner leses fra
 * oppsettet, så det stemmer på alle skjermbredder. I faner velger pilene
 * fanen med en gang.
 */
function pilTast(e: ReactKeyboardEvent<HTMLElement>) {
  const gruppe = e.currentTarget
  const knapper = [...gruppe.querySelectorAll<HTMLButtonElement>(':scope > button:not(:disabled)')]
  const i = knapper.indexOf(document.activeElement as HTMLButtonElement)
  if (i < 0) return
  const topp = knapper[0].offsetTop
  const kolonner = Math.max(1, knapper.filter((k) => k.offsetTop === topp).length)
  const neste =
    e.key === 'ArrowRight'
      ? i + 1
      : e.key === 'ArrowLeft'
        ? i - 1
        : e.key === 'ArrowDown'
          ? i + kolonner
          : e.key === 'ArrowUp'
            ? i - kolonner
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? knapper.length - 1
                : null
  if (neste === null) return
  e.preventDefault()
  const mal = knapper[Math.max(0, Math.min(knapper.length - 1, neste))]
  mal.focus()
  if (mal.getAttribute('role') === 'tab') mal.click()
}

const PILER = { 'data-piler': '', onKeyDown: pilTast } as const

/** Bare ett valg i hver gruppe kan nås med Tab: det valgte, ellers det første. */
function useRovingTabindex(rot: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    rot.current?.querySelectorAll<HTMLElement>('[data-piler]').forEach((gruppe) => {
      const knapper = [...gruppe.querySelectorAll<HTMLButtonElement>(':scope > button')]
      const aktiv =
        knapper.find((k) => k === document.activeElement) ??
        knapper.find((k) =>
          ['aria-pressed', 'aria-selected', 'aria-checked'].some((a) => k.getAttribute(a) === 'true'),
        ) ??
        knapper[0]
      knapper.forEach((k) => (k.tabIndex = k === aktiv ? 0 : -1))
    })
  })
}

/** Pilen i angreknappen: en halv bue med spiss. Speilet for «gjør om». */
function PilBue({ speil = false }: { speil?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={speil ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

/** Det første symbolet som passer bransjen – til forhåndsvisningene. */
function symbolFor(bransje: string): MerkeId {
  const tema = BRANSJETEMA[bransje] ?? 'alle'
  return SYMBOLER.find((s) => s.passer.includes(tema))?.id ?? 'rute'
}

/* --------------------------------------------------------------------- stiler */

const inn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`

const fokus = css`
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

/**
 * Felles for alle knapper og valg: litt mørkere ved hover (bare der det
 * finnes en mus), et lite trykk ved klikk, og overganger på 150–200 ms.
 * `filter` gjør at det samme virker på grå, blå og hvite flater.
 */
const trykk = css`
  transition:
    filter 0.15s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      filter: brightness(0.96);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

/** Synlig bare for skjermlesere. */
const Skjult = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`

const Feilmelding = styled.p`
  margin: 0.5rem 0 0;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.error};
`

const Flate = styled.div`
  min-height: calc(100vh - var(--nav-hoyde));
  padding: clamp(1.5rem, 4vw, 3rem) 0 7rem;
  background: #fff;
`

const Laster = styled.p`
  padding: 4rem 0;
  font-size: var(--fs-body);
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Stikk = styled.p`
  margin: 0 0 1rem;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Ingress = styled.p`
  margin: 1rem 0 0;
  max-width: 46ch;
  font-size: var(--fs-lead);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Landingsgitter = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;

  h1 {
    margin: 0;
    font-size: var(--fs-display);
    letter-spacing: var(--ls-display);
    line-height: 1;
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Steg = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.sunken};
    font-size: var(--fs-micro);
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const InnloggingsBoks = styled.div`
  display: grid;
  gap: 1rem;
  max-width: 420px;
  margin-top: 2rem;
`

const Smaatekst = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

/** Under bretten: korte svar, i samme trekkspill som resten av nettstedet. */
const Sporsmal = styled.section`
  display: grid;
  gap: 1.25rem;
  max-width: 760px;
  margin: clamp(4rem, 9vw, 7rem) auto 0;

  h2 {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
  }
`

const Utstilling = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 960px) {
    order: -1;

    /* I kalkulatorens modal har kunden alt bestemt seg – innloggingen først. */
    html[data-innebygd] & {
      display: none;
    }
  }
`

const Utstillingskort = styled.div<{ $bg: string; $stor?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  grid-column: ${({ $stor }) => ($stor ? 'span 2' : 'auto')};
  aspect-ratio: ${({ $stor }) => ($stor ? '2 / 1' : '1')};
  padding: ${({ $stor }) => ($stor ? '12% 16%' : '18%')};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  animation: ${inn} 0.3s ${({ theme }) => theme.easing.soft} both;
`

const Verktoylinje = styled.div`
  position: sticky;
  top: var(--nav-hoyde);
  z-index: 50;
  margin: calc(-1 * clamp(1.5rem, 4vw, 3rem)) 0 clamp(1.5rem, 4vw, 2.5rem);
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Linjeinnhold = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
`

const Stegrad = styled.nav`
  flex: 1;
  min-width: 0;
  max-width: 640px;

  > div {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.35rem;
  }
`

/** Det aktive steget i klartekst – bare på telefon, der stegnavnene ikke får plass. */
const Stegnavn = styled.p`
  display: none;
  margin: 0;
  font-size: var(--fs-micro);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  @media (max-width: 600px) {
    display: block;
  }
`

const Stegknapp = styled.button<{ $aktiv: boolean; $passert: boolean }>`
  display: grid;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.35rem 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: var(--fs-micro);
  font-weight: 500;
  text-align: left;
  color: ${({ $aktiv, theme }) => ($aktiv ? theme.colors.ink : theme.colors.inkSubtle)};
  cursor: pointer;

  i {
    display: block;
    height: 3px;
    border-radius: 3px;
    background: ${({ $aktiv, $passert, theme }) => ($aktiv || $passert ? theme.colors.ink : theme.colors.border)};
    transition: background ${({ theme }) => theme.transitions.default};
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.colors.ink};
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Telefon: bare strekene, men med et trykkflate på 44 px. */
  @media (max-width: 600px) {
    min-height: 44px;
    align-content: center;
    padding: 0;

    span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }

  /* Ingen boks ved museklikk – bare en myk glorie for tastatur. */
  &:focus {
    outline: none;
  }

  &:focus-visible {
    border-radius: 6px;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

/** Lagringsstatus – alltid rolig grå. Feiler skyen, ligger alt lokalt likevel. */
const Lagret = styled.em`
  font-size: var(--fs-micro);
  font-style: normal;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Konto = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkSubtle};

  span {
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    min-height: 44px;
    padding: 0 0.5rem;
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    ${fokus}

    @media (hover: hover) {
      &:hover {
        text-decoration: underline;
      }
    }
  }

  @media (max-width: 860px) {
    span {
      display: none;
    }
  }

  @media (max-width: 600px) {
    em {
      display: none;
    }
  }
`

const Stegflate = styled.div`
  animation: ${inn} 0.3s ${({ theme }) => theme.easing.soft} both;

  h1:focus {
    outline: none;
  }
`

/**
 * Hvert steg er én samlet komposisjon midt på siden – ikke et skjema som
 * starter oppe til venstre og lar resten av skjermen stå tom.
 */
const Smal = styled.div<{ $bred?: boolean }>`
  display: grid;
  gap: 1.75rem;
  max-width: ${({ $bred }) => ($bred ? '1080px' : '620px')};
  margin: 0 auto;

  > h1,
  > h1 + p {
    text-align: center;
  }

  > h1 + p {
    margin-top: -1rem;
  }
`

const Topptittel = styled.h1`
  margin: 0;
  font-size: var(--fs-heading);
  letter-spacing: var(--ls-heading);
  line-height: 1.05;
`

const Hjelp = styled.p`
  margin: 0.5rem 0 0;
  font-size: var(--fs-body);
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Stort = styled.input`
  width: 100%;
  min-height: 72px;
  padding: 0 1.25rem;
  border: 1.5px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};
  font-family: inherit;
  font-size: var(--fs-title);
  font-weight: 500;
  letter-spacing: var(--ls-title);
  color: ${({ theme }) => theme.colors.ink};

  &::placeholder {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentVivid};
    background: #fff;
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
  }
`

const Felt = styled.div`
  display: grid;
  gap: 0.4rem;

  label {
    font-size: var(--fs-small);
    font-weight: 500;
  }

  small {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  input {
    min-height: 50px;
    padding: 0 1rem;
    border: 1.5px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.sunken};
    font: inherit;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.ink};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      background: #fff;
      box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
    }
  }
`

const Gruppe = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    margin-bottom: 0.6rem;
    font-size: var(--fs-small);
    font-weight: 500;
  }
`

const Brikker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const valgt = css`
  background: ${({ theme }) => theme.colors.accentSoft};
  box-shadow: inset 0 0 0 1.5px ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentInk};
`

const Brikke = styled.button<{ $valgt: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sunken};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;
  ${({ $valgt }) => $valgt && valgt}
  ${trykk}
  ${fokus}
`

const Fargegitter = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 760px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const Fargeflis = styled.button<{ $valgt: boolean }>`
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.65rem;
  border: 1.5px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  font-family: inherit;
  cursor: pointer;
  ${trykk}
  ${fokus}

  span {
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Fargestripe = styled.span`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: 40px;
  overflow: hidden;
  border-radius: 8px;

  i {
    display: block;
  }
`

/** Seks stiler: én rad på stor skjerm, 3 × 2 på nettbrett, 2 × 3 på telefon. */
const Stilgitter = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Stilkort = styled.button<{ $valgt: boolean }>`
  display: grid;
  gap: 0.2rem;
  padding: 0.75rem 0.75rem 1rem;
  border: 1.5px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  ${trykk}
  ${fokus}

  strong {
    margin-top: 0.5rem;
    font-size: var(--fs-body);
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }

  span {
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Stilprove = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  padding: 0 10%;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: #fff;
`

const Hode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-bottom: 1.25rem;
`

const Sekundar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentSoft};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accentInk};
  text-decoration: none;
  cursor: pointer;
  ${trykk}
  ${fokus}
`

/**
 * Tolv forslag, alltid hele rader: 4 × 3 på stor skjerm, 3 × 4 på nettbrett,
 * 2 × 6 på telefon. Kortene er brede, så alle tolv står på én skjerm.
 */
const Forslagsgitter = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
`

const Forslagskort = styled.button<{ $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 19 / 10;
  min-width: 0;
  padding: 7% 12%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ $bg }) => $bg};
  cursor: pointer;
  animation: ${inn} 0.3s ${({ theme }) => theme.easing.soft} both;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  svg {
    max-height: 100%;
  }

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 30px -20px rgba(29, 29, 31, 0.35);
    }
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    aspect-ratio: 4 / 3;
    padding: 12%;
  }

  ${fokus}
`

const Editorgitter = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 3vw, 2.5rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Scene = styled.div`
  display: grid;
  gap: 0.75rem;
  position: sticky;
  top: calc(var(--nav-hoyde) + 5rem);

  @media (max-width: 960px) {
    position: static;
  }
`

const Hovedlerret = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  padding: 9% 10%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: #fff;

  svg {
    max-height: 220px;
  }
`

const Angrerad = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  gap: 0.25rem;
`

const Rund = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  ${trykk}
  ${fokus}

  &:disabled {
    opacity: 0.35;
  }
`

const Merkepanel = styled.div`
  display: grid;
  gap: 1rem;
`

const Smaalerret = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
`

const Minilerret = styled.div<{ $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 2 / 1;
  padding: 10% 14%;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ $bg }) => $bg};

  &:last-child {
    aspect-ratio: 1;
    padding: 24%;
  }

  svg {
    max-height: 100%;
  }
`

const Kontroller = styled.div`
  display: grid;
  gap: 1rem;
`

const Faner = styled.div`
  display: grid;
  grid-auto-columns: minmax(0, auto);
  grid-auto-flow: column;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sunken};
`

const Fanen = styled.button<{ $aktiv: boolean }>`
  min-height: 44px;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 999px;
  background: ${({ $aktiv }) => ($aktiv ? '#fff' : 'transparent')};
  box-shadow: ${({ $aktiv }) => ($aktiv ? '0 1px 3px rgba(29,29,31,0.12)' : 'none')};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ $aktiv, theme }) => ($aktiv ? theme.colors.ink : theme.colors.inkMuted)};
  white-space: nowrap;
  cursor: pointer;

  .kort {
    display: none;
  }

  /* «Flere valg» får ikke plass ved siden av fire andre på en smal telefon. */
  @media (max-width: 480px) {
    .lang {
      display: none;
    }

    .kort {
      display: inline;
    }
  }
  ${trykk}
  ${fokus}
`

const Fanepanel = styled.div`
  display: grid;
  gap: 1rem;
  animation: ${inn} 0.3s ${({ theme }) => theme.easing.soft} both;
`

/** Seks i bredden på stor skjerm, så tolv merker er to rader; fire på smal skjerm. */
const Valggitter = styled.div<{ $kol: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $kol }) => $kol}, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 1200px) and (min-width: 961px), (max-width: 560px) {
    grid-template-columns: repeat(${({ $kol }) => Math.min($kol, 4)}, minmax(0, 1fr));
  }
`

const Valgrute = styled.button<{ $valgt: boolean; $hoy?: boolean }>`
  display: grid;
  place-items: center;
  gap: 0.5rem;
  aspect-ratio: ${({ $hoy }) => ($hoy ? '4 / 3' : '1')};
  padding: ${({ $hoy }) => ($hoy ? '12% 14% 0.6rem' : '18%')};
  border: 1.5px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  cursor: pointer;
  ${trykk}
  ${fokus}

  svg {
    max-height: 100%;
  }

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: var(--fs-micro);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

/** Til navnesjekken – under navnefeltet, for den som ikke har bestemt seg. */
const Navnelenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 44px;
  margin-top: 0.25rem;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accentHover};
  }
`

const Oppgrader = styled.p`
  margin: 0 0 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.accentInk};

  button,
  a {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 600;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    ${fokus}
  }
`

const Sokefelt = styled.form`
  display: grid;
  gap: 0.4rem;

  label {
    font-size: var(--fs-small);
    font-weight: 500;
  }

  > div {
    display: flex;
    gap: 0.4rem;
  }

  input {
    flex: 1;
    min-width: 0;
    min-height: 46px;
    padding: 0 1rem;
    border: 1.5px solid transparent;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.sunken};
    font: inherit;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.ink};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      background: #fff;
    }
  }

  button {
    min-height: 46px;
    padding: 0 1.2rem;
    border: 0;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.ink};
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 600;
    color: #fff;
    cursor: pointer;

    ${trykk}
    ${fokus}
  }

  small {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Generer = styled.button`
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 1.2rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentSoft};
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accentInk};
  cursor: pointer;
  ${trykk}
  ${fokus}
`

const Undertittel = styled.p`
  margin: 0.5rem 0 0;
  font-size: var(--fs-small);
  font-weight: 500;
`

const Segment = styled.div<{ $antall?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $antall }) => $antall ?? 3}, 1fr);
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sunken};
`

const Segmentknapp = styled.button<{ $valgt: boolean }>`
  min-height: 44px;
  min-width: 0;
  padding: 0 0.25rem;
  white-space: nowrap;

  /* Fire valg på en smal telefon: ett hakk mindre, men aldri to linjer. */
  @media (max-width: 420px) {
    font-size: var(--fs-micro);
  }
  border: 0;
  border-radius: 999px;
  background: ${({ $valgt }) => ($valgt ? '#fff' : 'transparent')};
  box-shadow: ${({ $valgt }) => ($valgt ? '0 1px 3px rgba(29,29,31,0.12)' : 'none')};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ $valgt, theme }) => ($valgt ? theme.colors.ink : theme.colors.inkMuted)};
  cursor: pointer;
  ${trykk}
  ${fokus}
`

const Liste = styled.div`
  display: grid;
  gap: 0.4rem;
  max-height: 520px;
  overflow-y: auto;
  padding: 2px;
`

const Listevalg = styled.button<{ $valgt: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 60px;
  padding: 0.6rem 1rem;
  border: 1.5px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentSoft : theme.colors.sunken)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  ${trykk}
  ${fokus}

  > div {
    min-width: 0;
    overflow: hidden;
  }

  small {
    flex-shrink: 0;
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Fargerad = styled.span`
  display: flex;

  i {
    width: 30px;
    height: 30px;
    margin-right: -6px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #fff;
  }
`

const Flere = styled.div`
  display: grid;
  gap: 1rem;
`

const Bryter = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  font-size: var(--fs-body);
  cursor: pointer;

  input {
    width: 20px;
    height: 20px;
    accent-color: ${({ theme }) => theme.colors.accentVivid};
  }
`

const Glidefelt = styled.div`
  display: grid;
  gap: 0.4rem;

  label {
    font-size: var(--fs-small);
    font-weight: 500;
  }

  input {
    width: 100%;
    min-height: 44px;
    accent-color: ${({ theme }) => theme.colors.accentVivid};
  }
`

const Tilbakestill = styled.button`
  justify-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  ${fokus}

  @media (hover: hover) {
    &:hover {
      text-decoration: underline;
    }
  }
`

const Bestillingsgitter = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Miniprove = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 72px;
  padding: 0.75rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};

  svg {
    max-height: 100%;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    display: none;
  }
`

const Bestillingsprove = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  margin-top: 1.5rem;
  padding: 14%;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.sunken};
`

/**
 * Knapperaden. På en stor skjerm står den rett under steget, der øyet
 * slutter å lese. På telefon ligger den fast nederst, ved tommelen.
 */
const Bunnlinje = styled.div`
  margin-top: clamp(2rem, 4vw, 3rem);

  @media (max-width: 960px) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    margin: 0;
    padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.92);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const Bunninnhold = styled.div<{ $bredde?: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: ${({ $bredde }) => $bredde ?? 'none'};
  margin: 0 auto;
`

const Tilbake = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  ${trykk}
  ${fokus}

  svg {
    transform: rotate(180deg);
  }
`

const Hovedknapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0 1.6rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.accentVividHover};
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  ${fokus}
`

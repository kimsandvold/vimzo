import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Dempet, Felt, Knapp } from '../Admin/felles'
import MinSideRamme from '../MinSide/Ramme'
import { useMinSide } from '../MinSide/kontekst'
import type { Profil } from '../../../lib/profil'
import { useAdmin as useKonto } from '../Admin/kontekst'
import { OPPGRADERING, PRODUKTER } from '../../../data/logoprodukter'
import Icon from '../../shared/Icon'
import { hentDesign } from '../../../lib/logodesign'
import { VILKAR, girProfil, hentLogobestilling, oppgraderTilProfil, type Logobestilling } from '../../../lib/logobestillinger'
import { lagreSignaturbilder, signaturbildeUrl } from '../../../lib/signaturbilder'
import { LogoFonter, useFonter } from './fonter'
import { NETTSIDE, dekod, kod, merkSomKjopt } from './lagring'
import { STANDARD, type Design, type Innhold } from './motor'
import { PRODUKTER as PRODUKTKORT, erTest, formaterKr } from './kjop'
import type { Metadata } from './eksport'
import {
  OPPSETT,
  MAKS_SIGNATUR,
  TOM_SIGNATUR,
  bildeforhold,
  bildetFor,
  kopierFormatert,
  lagSignaturbilder,
  signaturDokument,
  signaturHtml,
  signaturTekst,
  type Oppsett,
  type Signaturdata,
} from './signatur'
import {
  FORSLAG,
  INNLEGGSFORMATER,
  MAKS_TEKST,
  MALER,
  PROFILSETT,
  bildefilnavn,
  innlegg,
  lastNed,
  lastNedAlt,
  profilbilde,
  somPng,
  type Format,
  type Innleggstekst,
  type MalId,
} from './some'

/**
 * Studioet: e-postsignatur og bilder til sosiale medier, laget av logoen
 * kunden har kjøpt.
 *
 * Ligger under Min side (/min-side/studio/<logo-id>) fordi det er noe
 * kunden kommer tilbake til – en ny signatur når en kollega begynner, et
 * nytt innlegg hver uke. Det inngår i «Logo + visuell profil», og i logoer
 * som er frigitt med en nettside. En logo kjøpt alene får se hva det er,
 * men ikke bruke det. Et utkast likeså – med en vei til å bestille.
 *
 * I utvikling åpner `/min-side/studio/test?test=1` studioet med en
 * eksempellogo, uten innlogging og uten å skrive noe til Firestore
 * (`&tilstand=utkast` eller `=logo` viser de låste utgavene). Grenen er
 * `import.meta.env.DEV && …` og finnes ikke i produksjonsbygget.
 */
export default function StudioSide() {
  if (import.meta.env.DEV && erTest())
    return (
      <Testramme>
        <Studio test visTittel bruker={{ epost: 'kari@fjordbakeriet.no', navn: 'Kari Nordmann' }} />
      </Testramme>
    )
  return (
    <MinSideRamme
      seoTittel="Signatur og sosiale medier – Min side – Vimzo"
      ingress="Logg inn for å lage e-postsignatur og bilder til sosiale medier."
      tittel="Signatur og sosiale medier"
      undertittel="E-postsignatur og bilder til sosiale medier, laget av logoen din."
    >
      <InnloggetStudio />
    </MinSideRamme>
  )
}

/**
 * Den innloggede: venter på profilen fra Min side, så signaturen kan fylles
 * ut med navn, tittel og kontaktinfo derfra første gang den åpnes.
 */
function InnloggetStudio() {
  const { bruker } = useKonto()
  const { profil } = useMinSide()
  if (profil === undefined) return <Dempet>Laster …</Dempet>
  return (
    <Studio
      bruker={{ epost: bruker.email ?? '', navn: bruker.displayName ?? '' }}
      profilforslag={profil ? signaturFraProfil(profil) : {}}
    />
  )
}

/** Profilen på Min side, som felt i signaturen. Tomme felt utelates. */
function signaturFraProfil(p: Profil): Partial<Signaturdata> {
  const b = p.bedrift
  const felt: Partial<Signaturdata> = {
    navn: p.person.navn,
    tittel: p.person.tittel,
    telefon: p.person.telefon || b?.telefon || '',
    epost: p.person.epost || b?.epost || '',
    nettside: b?.nettside ?? '',
    adresse: b ? [b.adresse, [b.postnr, b.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '',
  }
  return Object.fromEntries(Object.entries(felt).filter(([, v]) => v)) as Partial<Signaturdata>
}

/** Hva kunden har: profilen (alt er åpent), bare logoen, eller et utkast. */
type Tilstand = 'apen' | 'logo' | 'utkast'

interface Grunnlag {
  design: Design
  innhold: Innhold
  tilstand: Tilstand
  /** Bestillingen eller NETTSIDE – står i metadataene i bildene. */
  ordreId: string
  /** Fra bestillingen, til å fylle ut signaturen første gang. */
  forslag: Partial<Signaturdata>
  /** Endres når logoen endres – bildeadressen i signaturen følger den. */
  versjon: string
  /** Logobestillingen, når logoen er kjøpt alene – det er den som oppgraderes. */
  logokjop: Logobestilling | null
  /** Sant rett etter en oppgradering i denne økten – da takker vi og viser veien til filene. */
  oppgradert?: boolean
}

/** Eksempellogoen i testmodus. `?tilstand=utkast|logo` viser de låste utgavene. */
function testgrunnlag(): Grunnlag {
  const t = new URLSearchParams(location.search).get('tilstand')
  return {
    design: STANDARD,
    innhold: { navn: 'Fjordbakeriet', slagord: 'Bakt hver morgen' },
    tilstand: t === 'logo' || t === 'utkast' ? t : 'apen',
    ordreId: 'test',
    forslag: { navn: 'Kari Nordmann', telefon: '900 00 000' },
    versjon: 'test',
    logokjop:
      t === 'logo'
        ? {
            id: 'test-logo',
            uid: 'test',
            epost: 'kari@fjordbakeriet.no',
            produkt: 'logo',
            pris: PRODUKTER.logo.pris,
            oppgraderer: null,
            bedrift: 'Fjordbakeriet AS',
            orgnr: '912345678',
            adresse: 'Strandgata 1',
            postnr: '5013',
            poststed: 'Bergen',
            navn: 'Kari Nordmann',
            telefon: '900 00 000',
            merknad: '',
            design: '',
            vilkar: '',
            status: 'levert',
            opprettet: Date.now(),
            oppdatert: Date.now(),
          }
        : null,
  }
}

function Studio({
  bruker,
  profilforslag = {},
  test = false,
  visTittel = false,
}: {
  bruker: { epost: string; navn: string }
  /** Fra profilen på Min side – går foran det som står på bestillingen. */
  profilforslag?: Partial<Signaturdata>
  test?: boolean
  /** Bare i testrammen – på Min side står tittelen i sidehodet. */
  visTittel?: boolean
}) {
  const { id = '' } = useParams()
  const [grunnlag, setGrunnlag] = useState<Grunnlag | null | 'feil'>(() => (import.meta.env.DEV && test ? testgrunnlag() : null))
  const [fane, setFane] = useState<'signatur' | 'some'>('signatur')
  useFonter()

  useEffect(() => {
    let aktiv = true
    if (test) return
    ;(async () => {
      const d = await hentDesign(id)
      if (!d) return setGrunnlag('feil')
      // Det kjøpte designet står på bestillingen. Endrer kunden logoen etterpå,
      // er det fortsatt den kjøpte som er hans.
      const b = d.bestillingId ? await hentLogobestilling(d.bestillingId) : null
      const kilde = b?.design || d.design
      const renset = dekod(kod(JSON.parse(kilde) as { design: Design; innhold: Innhold }))
      if (!renset) return setGrunnlag('feil')
      if (!aktiv) return
      setGrunnlag({
        ...renset,
        tilstand: (b && girProfil(b.produkt)) || d.frigitt ? 'apen' : d.bestillingId ? 'logo' : 'utkast',
        logokjop: b?.produkt === 'logo' ? b : null,
        ordreId: d.bestillingId ?? NETTSIDE,
        forslag: b
          ? {
              navn: b.navn,
              telefon: b.telefon,
              adresse: [b.adresse, [b.postnr, b.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', '),
            }
          : {},
        versjon: kod(renset).slice(-12),
      })
    })().catch((e) => {
      console.error(e)
      if (aktiv) setGrunnlag('feil')
    })
    return () => {
      aktiv = false
    }
  }, [id, test])

  if (grunnlag === null) return <Dempet>Laster …</Dempet>
  if (grunnlag === 'feil')
    return (
      <Tom>
        <h1>Fant ikke logoen</h1>
        <p>Den kan være slettet, eller tilhøre en annen konto.</p>
        <Knapp as={Link} to="/min-side">
          Til Min side
        </Knapp>
      </Tom>
    )

  const bedrift = grunnlag.innhold.navn.trim() || 'firmaet'
  return (
    <>
      <LogoFonter />
      <Topp>
        <div>
          {visTittel && <h1>Signatur og sosiale medier</h1>}
          <p>{grunnlag.tilstand === 'apen' ? `Alt i profilen til ${bedrift}, klart til bruk.` : `Slik blir det med logoen til ${bedrift}.`}</p>
        </div>
        <Faner role="tablist" aria-label="Velg verktøy">
          <Fane role="tab" aria-selected={fane === 'signatur'} $valgt={fane === 'signatur'} onClick={() => setFane('signatur')}>
            E-postsignatur
          </Fane>
          <Fane role="tab" aria-selected={fane === 'some'} $valgt={fane === 'some'} onClick={() => setFane('some')}>
            Sosiale medier
          </Fane>
        </Faner>
      </Topp>

      {grunnlag.tilstand !== 'apen' && (
        <Last
          id={id}
          tilstand={grunnlag.tilstand}
          logokjop={grunnlag.logokjop}
          test={test}
          onOppgradert={(ordreId) => setGrunnlag({ ...grunnlag, tilstand: 'apen', ordreId, logokjop: null, oppgradert: true })}
        />
      )}

      {grunnlag.oppgradert && (
        <Takk role="status">
          <Icon navn="sjekk" storrelse={18} tykkelse={2.4} />
          <div>
            <strong>Profilen er låst opp</strong>
            <p>Faktura på {formaterKr(OPPGRADERING.pris)} eks. mva kommer på e-post. Profilbok og mockups ligger i den nye pakken.</p>
          </div>
          <Knapp as={Link} to={`/logo?design=${encodeURIComponent(id)}&lastned=1`} $hoved>
            Last ned profilpakken
          </Knapp>
        </Takk>
      )}

      <Lukket $lukket={grunnlag.tilstand !== 'apen'} inert={grunnlag.tilstand !== 'apen'} aria-hidden={grunnlag.tilstand !== 'apen'}>
        {fane === 'signatur' ? (
          <Signatur
            id={id}
            g={{ ...grunnlag, forslag: { ...grunnlag.forslag, ...profilforslag } }}
            epost={bruker.epost}
            visningsnavn={bruker.navn}
            test={test}
          />
        ) : (
          <Some g={grunnlag} />
        )}
      </Lukket>
    </>
  )
}

/**
 * Låst: si hva som mangler og hvordan kunden får det – ikke bare stopp.
 *
 * Et utkast sendes til bestillingen i verktøyet. En logo kjøpt alene kan
 * oppgraderes her og nå: fakturaopplysningene har vi fra logokjøpet, så det
 * eneste kunden gjør, er å godta vilkårene og trykke. `?oppgrader=1` (fra
 * logoverktøyet) åpner oppgraderingen med en gang.
 */
function Last({
  id,
  tilstand,
  logokjop,
  test,
  onOppgradert,
}: {
  id: string
  tilstand: Exclude<Tilstand, 'apen'>
  logokjop: Logobestilling | null
  test: boolean
  onOppgradert: (ordreId: string) => void
}) {
  const profil = PRODUKTER.profil
  const [sok] = useSearchParams()
  const kanOppgradere = tilstand === 'logo' && !!logokjop
  const [apen, setApen] = useState(kanOppgradere && sok.get('oppgrader') === '1')

  return (
    <Laas role="note" id="oppgrader">
      <Icon navn="laas" storrelse={18} tykkelse={2} />
      <div>
        <strong>Inngår i {profil.navn}</strong>
        <p>
          {tilstand === 'utkast'
            ? `Bestill profilen for ${profil.pris} kr, så lager du signaturen og bildene her med logoen din.`
            : `Logoen din er kjøpt alene. Oppgrader til profilen for ${formaterKr(OPPGRADERING.pris)} – mellomlegget, ikke hele prisen.`}
        </p>
      </div>
      {tilstand === 'utkast' ? (
        <Knapp as={Link} to={`/logo?design=${encodeURIComponent(id)}&steg=bestill`} $hoved>
          Bestill profilen
        </Knapp>
      ) : kanOppgradere ? (
        !apen && (
          <Knapp type="button" $hoved onClick={() => setApen(true)}>
            Oppgrader for {formaterKr(OPPGRADERING.pris)}
          </Knapp>
        )
      ) : (
        <Knapp as={Link} to="/kontakt" $hoved>
          Spør om oppgradering
        </Knapp>
      )}
      {apen && logokjop && <Oppgradering id={id} logokjop={logokjop} test={test} onAvbryt={() => setApen(false)} onFerdig={onOppgradert} />}
    </Laas>
  )
}

/** Oppgraderingen: hva kunden får, hvor fakturaen går, vilkårene og én knapp. */
function Oppgradering({
  id,
  logokjop,
  test,
  onAvbryt,
  onFerdig,
}: {
  id: string
  logokjop: Logobestilling
  test: boolean
  onAvbryt: () => void
  onFerdig: (ordreId: string) => void
}) {
  const [godtatt, setGodtatt] = useState(false)
  const [sender, setSender] = useState(false)
  const [feil, setFeil] = useState('')
  const inklMva = Math.round(OPPGRADERING.pris * 1.25)
  // Det profilen har i tillegg til logoen – kortet i verktøyet sier det samme.
  const tillegg = PRODUKTKORT.profil.innhold.filter((l) => !l.startsWith('Alt i'))

  async function bestill() {
    setFeil('')
    if (!godtatt) return setFeil('Kryss av for at du har lest kjøpsvilkårene.')
    setSender(true)
    try {
      // Rekkefølgen er den samme som ved kjøp: ordrelinjen først, så låses
      // profilen opp. Feiler ordren, er ingenting låst opp.
      if (import.meta.env.DEV && test) {
        await new Promise((ok) => setTimeout(ok, 400))
        return onFerdig('test-oppgradering')
      }
      const ordreId = await oppgraderTilProfil(logokjop)
      await merkSomKjopt(id, ordreId, 'profil')
      onFerdig(ordreId)
    } catch (e) {
      console.error(e)
      setFeil('Oppgraderingen gikk ikke gjennom. Prøv igjen, eller ta kontakt med oss.')
    } finally {
      setSender(false)
    }
  }

  return (
    <Oppgraderingsflate>
      <ul>
        {tillegg.map((l) => (
          <li key={l}>
            <Icon navn="sjekk" storrelse={16} tykkelse={2.4} />
            {l}
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Pris</dt>
          <dd>
            <strong>{formaterKr(OPPGRADERING.pris)}</strong> eks. mva ({formaterKr(inklMva)} inkl. mva)
          </dd>
        </div>
        <div>
          <dt>Faktura til</dt>
          <dd>
            {logokjop.bedrift}
            {logokjop.orgnr && ` · org.nr ${logokjop.orgnr}`} · {logokjop.adresse}, {logokjop.postnr} {logokjop.poststed}
          </dd>
        </div>
      </dl>
      <Samtykke>
        <input type="checkbox" checked={godtatt} onChange={(e) => setGodtatt(e.target.checked)} />
        <span>
          {VILKAR}{' '}
          <Link to="/vilkar/logo" target="_blank" rel="noopener">
            Les vilkårene
          </Link>
        </span>
      </Samtykke>
      {feil && <Feilmelding role="alert">{feil}</Feilmelding>}
      <Handlinger>
        <Knapp type="button" $hoved onClick={bestill} disabled={sender}>
          {sender ? 'Bestiller …' : `Bestill oppgradering – ${formaterKr(OPPGRADERING.pris)}`}
        </Knapp>
        <Knapp type="button" onClick={onAvbryt} disabled={sender}>
          Avbryt
        </Knapp>
      </Handlinger>
    </Oppgraderingsflate>
  )
}

/* ------------------------------------------------------------- signatur */

const signaturnokkel = (id: string) => `vimzo-signatur:${id}`

function Signatur({ id, g, epost, visningsnavn, test }: { id: string; g: Grunnlag; epost: string; visningsnavn: string; test: boolean }) {
  const [data, setData] = useState<Signaturdata>(() => {
    try {
      const lagret = localStorage.getItem(signaturnokkel(id))
      if (lagret) return { ...TOM_SIGNATUR, ...JSON.parse(lagret) }
    } catch {
      // Privat modus – start med forslaget.
    }
    return { ...TOM_SIGNATUR, epost, ...g.forslag, navn: g.forslag.navn || visningsnavn }
  })
  const [oppsett, setOppsett] = useState<Oppsett>('klassisk')
  const [bilder, setBilder] = useState<{ logo: Blob; merke: Blob; url: { logo: string; merke: string }; forhold: { logo: number; merke: number } } | null>(null)
  const [status, setStatus] = useState<'' | 'kopierer' | 'kopiert' | 'feil'>('')
  const [klient, setKlient] = useState<Klient>('gmail')

  useEffect(() => {
    try {
      localStorage.setItem(signaturnokkel(id), JSON.stringify(data))
    } catch {
      // Ikke så farlig.
    }
  }, [id, data])

  useEffect(() => {
    let aktiv = true
    const urler: string[] = []
    lagSignaturbilder(g.design, g.innhold).then(async (b) => {
      const forhold = { logo: await bildeforhold(b.logo), merke: await bildeforhold(b.merke) }
      const url = { logo: URL.createObjectURL(b.logo), merke: URL.createObjectURL(b.merke) }
      urler.push(url.logo, url.merke)
      if (aktiv) setBilder({ ...b, url, forhold })
    })
    return () => {
      aktiv = false
      urler.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [g.design, g.innhold])

  const bilde = bildetFor(oppsett)
  const forhandsvisning = useMemo(
    () => (bilder ? signaturHtml(data, oppsett, g.design, g.innhold, { src: bilder.url[bilde], forhold: bilder.forhold[bilde] }) : ''),
    [bilder, data, oppsett, g.design, g.innhold, bilde],
  )

  /** Signaturen med bildet på vimzo.no – den som kopieres. Bildene lastes opp først. */
  async function ferdig(): Promise<string> {
    if (!bilder) throw new Error('Ikke klar')
    // I testmodus lastes ingenting opp; adressen i signaturen peker da ingen steder.
    if (!test) await lagreSignaturbilder(id, bilder)
    return signaturHtml(data, oppsett, g.design, g.innhold, {
      src: signaturbildeUrl(id, bilde, g.versjon),
      forhold: bilder.forhold[bilde],
    })
  }

  async function kopier() {
    setStatus('kopierer')
    try {
      await kopierFormatert(await ferdig(), signaturTekst(data, g.innhold))
      setStatus('kopiert')
    } catch (e) {
      console.error(e)
      setStatus('feil')
    }
  }

  async function lastNedHtml() {
    try {
      const html = signaturDokument(await ferdig(), g.innhold.navn)
      lastNed(new Blob([html], { type: 'text/html' }), 'epostsignatur.html')
    } catch (e) {
      console.error(e)
      setStatus('feil')
    }
  }

  const felt = (navn: keyof Signaturdata, etikett: string, type = 'text', autoComplete?: string) => (
    <Felt>
      {etikett}
      <input
        type={type}
        autoComplete={autoComplete}
        maxLength={MAKS_SIGNATUR}
        value={data[navn]}
        onChange={(e) => {
          setData((d) => ({ ...d, [navn]: e.target.value }))
          setStatus('')
        }}
      />
    </Felt>
  )

  return (
    <Arbeidsflate>
      <Skjema onSubmit={(e) => e.preventDefault()}>
        {felt('navn', 'Navn', 'text', 'name')}
        {felt('tittel', 'Tittel', 'text', 'organization-title')}
        <To>
          {felt('telefon', 'Telefon', 'tel', 'tel')}
          {felt('epost', 'E-post', 'email', 'email')}
        </To>
        {felt('nettside', 'Nettside', 'text', 'url')}
        {felt('adresse', 'Adresse (valgfritt)', 'text', 'street-address')}
      </Skjema>

      <Visning>
        <Valg role="radiogroup" aria-label="Oppsett">
          {OPPSETT.map((o) => (
            <Valgknapp key={o.id} role="radio" aria-checked={oppsett === o.id} $valgt={oppsett === o.id} onClick={() => { setOppsett(o.id); setStatus('') }}>
              {o.navn}
            </Valgknapp>
          ))}
        </Valg>

        <Epost aria-label="Forhåndsvisning av signaturen">
          <Epostlinje aria-hidden="true">
            <span />
            <span />
            <span />
          </Epostlinje>
          <p>Med vennlig hilsen</p>
          {forhandsvisning ? <div dangerouslySetInnerHTML={{ __html: forhandsvisning }} /> : <Skjelett style={{ height: 80 }} />}
        </Epost>

        <Handlinger>
          <Knapp $hoved type="button" onClick={kopier} disabled={!bilder || status === 'kopierer'}>
            <Icon navn={status === 'kopiert' ? 'sjekk' : 'kopier'} storrelse={16} tykkelse={2} />
            {status === 'kopiert' ? 'Kopiert' : status === 'kopierer' ? 'Kopierer …' : 'Kopier signaturen'}
          </Knapp>
          <Knapp type="button" onClick={lastNedHtml} disabled={!bilder}>
            Last ned som HTML
          </Knapp>
        </Handlinger>
        {status === 'feil' && <Feilmelding role="alert">Det gikk ikke. Prøv igjen, eller last ned som HTML.</Feilmelding>}

        <Veiledning aria-live="polite">
          <Valg role="tablist" aria-label="E-postprogram">
            {KLIENTER.map((k) => (
              <Valgknapp key={k.id} role="tab" aria-selected={klient === k.id} $valgt={klient === k.id} $liten onClick={() => setKlient(k.id)}>
                {k.navn}
              </Valgknapp>
            ))}
          </Valg>
          <ol>
            {KLIENTER.find((k) => k.id === klient)!.steg.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Veiledning>
      </Visning>
    </Arbeidsflate>
  )
}

type Klient = 'gmail' | 'outlook' | 'apple'

const KLIENTER: readonly { id: Klient; navn: string; steg: string[] }[] = [
  {
    id: 'gmail',
    navn: 'Gmail',
    steg: [
      'Trykk «Kopier signaturen» over.',
      'I Gmail: tannhjulet → Se alle innstillinger → Generelt → Signatur → Opprett ny.',
      'Lim inn (⌘V / Ctrl+V), og velg signaturen under «Standardinnstillinger for signatur».',
      'Bla ned og trykk «Lagre endringene».',
    ],
  },
  {
    id: 'outlook',
    navn: 'Outlook',
    steg: [
      'Trykk «Kopier signaturen» over.',
      'I Outlook: Innstillinger → Konto → Signaturer → Ny signatur.',
      'Lim inn (⌘V / Ctrl+V), og velg den som standard for nye meldinger og svar.',
      'Trykk «Lagre».',
    ],
  },
  {
    id: 'apple',
    navn: 'Apple Mail',
    steg: [
      'Trykk «Kopier signaturen» over.',
      'I Mail: Innstillinger → Signaturer → + under kontoen din.',
      'Fjern haken ved «Bruk alltid standardskriften min», og lim inn i feltet til høyre.',
      'Lukk innstillingene – signaturen lagres av seg selv.',
    ],
  },
]

/* ------------------------------------------------------- sosiale medier */

/**
 * SVG-en til et bilde, tegnet på nytt når teksten endres – med en liten
 * pause, så det ikke tegnes for hver bokstav.
 */
function useTegning(lag: () => Promise<string>, noekler: unknown[], pause = 220): string {
  const [svg, setSvg] = useState('')
  const lagRef = useRef(lag)
  useEffect(() => {
    lagRef.current = lag
  })
  useEffect(() => {
    let aktiv = true
    const t = setTimeout(() => {
      lagRef.current().then((s) => aktiv && setSvg(s)).catch((e) => console.error(e))
    }, pause)
    return () => {
      aktiv = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, noekler)
  return svg
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

function Some({ g }: { g: Grunnlag }) {
  const [format, setFormat] = useState<Format>(INNLEGGSFORMATER[0])
  const [mal, setMal] = useState<MalId>(FORSLAG[0].mal)
  const [tekst, setTekst] = useState<Innleggstekst>({ overskrift: FORSLAG[0].overskrift, tekst: FORSLAG[0].tekst })
  const [laster, setLaster] = useState<string>('')
  const meta: Metadata = useMemo(
    () => ({ ordreId: g.ordreId, bedrift: g.innhold.navn.trim() || 'Ditt firma', dato: new Date().toISOString() }),
    [g.ordreId, g.innhold.navn],
  )

  const stor = useTegning(() => innlegg(g.design, g.innhold, format, mal, tekst), [g.design, g.innhold, format, mal, tekst])

  async function last(navn: string, jobb: () => Promise<void>) {
    setLaster(navn)
    try {
      await jobb()
    } catch (e) {
      console.error(e)
    } finally {
      setLaster('')
    }
  }

  return (
    <>
      <Arbeidsflate $some>
        <Skjema onSubmit={(e) => e.preventDefault()}>
          <Gruppe>
            <Gruppetittel>Start fra</Gruppetittel>
            <Brikker>
              {FORSLAG.map((f) => (
                <Valgknapp
                  key={f.navn}
                  type="button"
                  $liten
                  $valgt={tekst.overskrift === f.overskrift}
                  onClick={() => {
                    setTekst({ overskrift: f.overskrift, tekst: f.tekst })
                    setMal(f.mal)
                  }}
                >
                  {f.navn}
                </Valgknapp>
              ))}
            </Brikker>
          </Gruppe>
          <Felt>
            {mal === 'sitat' ? 'Sitat' : 'Overskrift'}
            <textarea
              rows={2}
              maxLength={MAKS_TEKST.overskrift}
              value={tekst.overskrift}
              onChange={(e) => setTekst((t) => ({ ...t, overskrift: e.target.value }))}
            />
          </Felt>
          <Felt>
            {mal === 'sitat' ? 'Hvem sa det' : 'Tekst'}
            <textarea
              rows={2}
              maxLength={MAKS_TEKST.tekst}
              value={tekst.tekst}
              onChange={(e) => setTekst((t) => ({ ...t, tekst: e.target.value }))}
            />
          </Felt>
          <Gruppe>
            <Gruppetittel>Mal</Gruppetittel>
            <Maler>
              {MALER.map((m) => (
                <Malvalg key={m.id} g={g} format={format} mal={m.id} tekst={tekst} valgt={mal === m.id} onVelg={() => setMal(m.id)} navn={m.navn} />
              ))}
            </Maler>
          </Gruppe>
        </Skjema>

        <Visning>
          <Valg role="radiogroup" aria-label="Format">
            {INNLEGGSFORMATER.map((f) => (
              <Valgknapp key={f.id} role="radio" aria-checked={format.id === f.id} $valgt={format.id === f.id} onClick={() => setFormat(f)}>
                {f.navn} <small>{f.b}×{f.h}</small>
              </Valgknapp>
            ))}
          </Valg>
          <Bilde $forhold={format.b / format.h} $story={format.id === 'story'}>
            {stor ? <img src={svgUrl(stor)} alt={`${format.navn}: ${tekst.overskrift}`} /> : <Skjelett />}
          </Bilde>
          <Handlinger>
            <Knapp
              $hoved
              type="button"
              disabled={!stor || !!laster}
              onClick={() =>
                last('ett', async () =>
                  lastNed(await somPng(stor, format, meta, format.navn), bildefilnavn(g.innhold, format.id, mal)),
                )
              }
            >
              <Icon navn="pilNed" storrelse={16} tykkelse={2} />
              {laster === 'ett' ? 'Lager bildet …' : 'Last ned bildet'}
            </Knapp>
            <Knapp type="button" disabled={!!laster} onClick={() => last('alt', () => lastNedAlt(g.design, g.innhold, tekst, meta))}>
              {laster === 'alt' ? 'Lager pakken …' : 'Alle maler og formater (ZIP)'}
            </Knapp>
          </Handlinger>
          <Dempet>{format.hvor}. PNG i full oppløsning.</Dempet>
        </Visning>
      </Arbeidsflate>

      <Profilsett aria-labelledby="profilsett">
        <h2 id="profilsett">Profilbilder</h2>
        <p>Sett opp én gang – de samme fargene og den samme logoen overalt.</p>
        <Profilrutenett>
          {PROFILSETT.map((f) => (
            <Profilkort key={f.id} g={g} format={f} meta={meta} />
          ))}
        </Profilrutenett>
      </Profilsett>
    </>
  )
}

function Malvalg({
  g,
  format,
  mal,
  tekst,
  valgt,
  onVelg,
  navn,
}: {
  g: Grunnlag
  format: Format
  mal: MalId
  tekst: Innleggstekst
  valgt: boolean
  onVelg: () => void
  navn: string
}) {
  const svg = useTegning(() => innlegg(g.design, g.innhold, format, mal, tekst), [g.design, g.innhold, format, mal, tekst], 500)
  return (
    <Malknapp type="button" aria-pressed={valgt} $valgt={valgt} onClick={onVelg}>
      <Bilde $forhold={format.b / format.h} $liten>
        {svg ? <img src={svgUrl(svg)} alt="" /> : <Skjelett />}
      </Bilde>
      <span>{navn}</span>
    </Malknapp>
  )
}

function Profilkort({ g, format, meta }: { g: Grunnlag; format: Format; meta: Metadata }) {
  const svg = useTegning(() => profilbilde(g.design, g.innhold, format), [g.design, g.innhold, format], 0)
  const [laster, setLaster] = useState(false)
  return (
    <Kort>
      <Bilde $forhold={format.b / format.h} $rund={format.id === 'profilbilde'}>
        {svg ? <img src={svgUrl(svg)} alt={`${format.navn} for ${format.hvor}`} /> : <Skjelett />}
      </Bilde>
      <Kortfot>
        <div>
          <strong>{format.navn}</strong>
          <small>
            {format.hvor} · {format.b}×{format.h}
          </small>
        </div>
        <Ikonknapp
          type="button"
          aria-label={`Last ned ${format.navn.toLowerCase()}`}
          disabled={!svg || laster}
          onClick={async () => {
            setLaster(true)
            try {
              lastNed(await somPng(svg, format, meta, format.navn), bildefilnavn(g.innhold, format.id))
            } finally {
              setLaster(false)
            }
          }}
        >
          <Icon navn="pilNed" storrelse={18} tykkelse={2} />
        </Ikonknapp>
      </Kortfot>
    </Kort>
  )
}

/* ---------------------------------------------------------------- stil */

const Topp = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0.5rem 0 0.35rem;
    font-size: var(--fs-heading);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  p {
    margin: 0;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Faner = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.neutral[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`

const Fane = styled.button<{ $valgt: boolean }>`
  flex: 1;
  min-height: 40px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: transparent;
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;
  white-space: nowrap;

  ${({ $valgt, theme }) =>
    $valgt &&
    css`
      background: ${theme.colors.surface};
      color: ${theme.colors.ink};
      box-shadow: ${theme.shadows.sm};
    `}
`

const Arbeidsflate = styled.div<{ $some?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    /* På mobil: resultatet først, så feltene. */
    > :last-child {
      order: -1;
    }
  }
`

/* Hvitt kort: feltene er grå, og Min side står på grå bakgrunn. */
const Skjema = styled.form`
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: clamp(1.1rem, 2vw, 1.5rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
`

const To = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

const Visning = styled.div`
  position: sticky;
  top: 1.5rem;
  display: grid;
  gap: 1rem;
  justify-items: start;
  min-width: 0;

  @media (max-width: 900px) {
    position: static;
  }
`

const Valg = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Brikker = styled(Valg)``

const Valgknapp = styled.button<{ $valgt: boolean; $liten?: boolean }>`
  min-height: ${({ $liten }) => ($liten ? '36px' : '40px')};
  padding: 0 ${({ $liten }) => ($liten ? '0.85rem' : '1rem')};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  small {
    margin-left: 0.25rem;
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  ${({ $valgt, theme }) =>
    $valgt &&
    css`
      border-color: ${theme.colors.accentVivid};
      background: ${theme.colors.accentSoft};
      color: ${theme.colors.accentInk};

      &:hover {
        border-color: ${theme.colors.accentVivid};
      }
    `}
`

/** Signaturen vist i en e-post, så kunden ser den der den skal stå. */
const Epost = styled.div`
  width: 100%;
  padding: clamp(1.25rem, 3vw, 2rem);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow-x: auto;

  > p {
    margin: 1.5rem 0 1rem;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    color: #3a3b40;
  }
`

/** Grå streker som antyder e-postteksten over signaturen. */
const Epostlinje = styled.div`
  display: grid;
  gap: 0.6rem;

  span {
    height: 10px;
    border-radius: 5px;
    background: ${({ theme }) => theme.colors.sunken};
  }

  span:nth-child(2) {
    width: 86%;
  }

  span:nth-child(3) {
    width: 58%;
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const Feilmelding = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.error};
`

const Veiledning = styled.div`
  display: grid;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ol {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding-left: 1.25rem;
    font-size: var(--fs-small);
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Gruppe = styled.div`
  display: grid;
  gap: 0.5rem;
`

const Gruppetittel = styled.span`
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Maler = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
`

const Malknapp = styled.button<{ $valgt: boolean }>`
  display: grid;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.inkMuted)};
  cursor: pointer;

  > div {
    outline: 2px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accentVivid : 'transparent')};
    outline-offset: 3px;
    transition: outline-color ${({ theme }) => theme.transitions.default};
  }
`

const Bilde = styled.div<{ $forhold: number; $liten?: boolean; $story?: boolean; $rund?: boolean }>`
  position: relative;
  width: 100%;
  max-width: ${({ $story, $liten }) => ($liten ? 'none' : $story ? '360px' : '520px')};
  aspect-ratio: ${({ $forhold }) => $forhold};
  border-radius: ${({ theme, $liten }) => ($liten ? theme.borderRadius.small : theme.borderRadius.medium)};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.sunken};
  box-shadow: ${({ theme, $liten }) => ($liten ? theme.shadows.sm : theme.shadows.lg)};

  img {
    display: block;
    width: 100%;
    height: 100%;
  }

  ${({ $rund }) =>
    $rund &&
    css`
      max-width: 180px;
      border-radius: 50%;
    `}
`

const Skjelett = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.sunken};
  animation: puls 1.4s ease-in-out infinite;

  @keyframes puls {
    50% {
      opacity: 0.55;
    }
  }
`

const Profilsett = styled.section`
  margin-top: 2.5rem;

  h2 {
    margin: 0 0 0.25rem;
    font-size: var(--fs-body);
    font-weight: 600;
  }

  > p {
    margin: 0 0 1rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
  }
`

const Profilrutenett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr) minmax(0, 1.3fr);
  gap: 1.25rem;
  align-items: end;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Kort = styled.div`
  display: grid;
  gap: 0.85rem;
  justify-items: start;
`

const Kortfot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;

  div {
    display: grid;
  }

  strong {
    font-size: var(--fs-small);
    font-weight: 600;
  }

  small {
    font-size: var(--fs-micro);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Ikonknapp = styled.button`
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.border};
  }

  &:disabled {
    opacity: 0.5;
  }
`

/** Studioet bak låsen: synlig, så kunden ser hva det er, men ikke i bruk. */
const Lukket = styled.div<{ $lukket: boolean }>`
  ${({ $lukket }) =>
    $lukket &&
    css`
      opacity: 0.45;
      filter: blur(1px);
      pointer-events: none;
      user-select: none;
    `}
`

const Testramme = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 2.25rem) clamp(1rem, 3vw, 2rem) 4rem;
`

const Laas = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.25rem;
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  > div {
    flex: 1 1 260px;
  }

  strong {
    font-weight: 600;
  }

  p {
    margin: 0.2rem 0 0;
    font-size: var(--fs-small);
  }
`

const Takk = styled(Laas)`
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
`

const Oppgraderingsflate = styled.div`
  /* && slår Laas sin «> div»-regel, så flaten får en hel rad for seg. */
  && {
    flex: 1 1 100%;
  }
  display: grid;
  gap: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(0, 62, 138, 0.14);
  color: ${({ theme }) => theme.colors.ink};

  ul {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--fs-body);

    svg {
      flex: none;
      color: ${({ theme }) => theme.colors.accentVivid};
    }
  }

  dl {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    font-size: var(--fs-small);
  }

  dl > div {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.75rem;
  }

  dt {
    min-width: 6.5rem;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  dd {
    margin: 0;
  }
`

const Samtykke = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  max-width: 68ch;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  input {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.accentVivid};
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Tom = styled.div`
  display: grid;
  gap: 0.75rem;
  justify-items: start;
  max-width: 420px;
  margin: 4rem auto;

  h1 {
    margin: 0;
    font-size: var(--fs-title);
  }

  p {
    margin: 0 0 0.5rem;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

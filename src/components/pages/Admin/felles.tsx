import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import type { User } from 'firebase/auth'
import { Kontekst, useAdmin } from './kontekst'
import Logo from '../../shared/Logo'
import { useSEO } from '../../../hooks/useSEO'
import { firebaseKlar, hentAuth } from '../../../lib/firebase'
import { status as statusinfo, type Status, type Statusinfo } from '../../../data/saker'

/* ------------------------------------------------------------- innlogging */

/**
 * Rammen rundt admin-sidene.
 *
 * Hvem som har tilgang, står ikke her – det står i firestore.rules. En konto
 * uten tilgang kommer forbi innloggingen, men får «ingen tilgang» i det
 * øyeblikket den prøver å lese en sak. Da står ikke admin-adressen i koden som
 * lastes ned til nettleseren.
 */
export function AdminRamme({ tittel, children }: { tittel: string; children: ReactNode }) {
  return (
    <KontoRamme
      seoTittel={`${tittel} – Vimzo admin`}
      merke="Vimzo admin"
      ingress="Henvendelser, tilbud og kunder. Bare for administrator."
      hjem={{ til: '/admin', tekst: 'Admin' }}
    >
      {children}
    </KontoRamme>
  )
}

/**
 * Innlogging og ramme, felles for /admin og /min-side.
 *
 * Google eller e-post og passord. Med `tillatRegistrering` kan nye brukere
 * lage passordkonto selv – det er det kundene trenger. Admin har det ikke:
 * der opprettes kontoen i Firebase-konsollen.
 *
 * En passordkonto må bekrefte e-posten før noe vises, og reglene krever det
 * samme. Ellers kunne hvem som helst lage en konto med en annens adresse.
 */
export function KontoRamme({
  seoTittel,
  merke,
  ingress,
  hjem,
  lenker = [],
  tillatRegistrering = false,
  children,
}: {
  seoTittel: string
  merke: string
  ingress: string
  hjem: { til: string; tekst: string }
  /** Ekstra lenker i toppstripa, f.eks. «Lag logo» på Min side. */
  lenker?: { til: string; tekst: string }[]
  tillatRegistrering?: boolean
  children: ReactNode
}) {
  const [bruker, setBruker] = useState<User | null | undefined>(firebaseKlar ? undefined : null)
  const [feil, setFeil] = useState('')
  const [melding, setMelding] = useState('')
  const [epostFelt, setEpostFelt] = useState('')
  const [modus, setModus] = useState<'inn' | 'ny'>('inn')

  useSEO({ title: seoTittel, description: 'Innlogging hos Vimzo.', noindex: true })

  useEffect(() => {
    if (!firebaseKlar) return
    let stopp = () => {}
    let aktiv = true
    Promise.all([hentAuth(), import('firebase/auth')]).then(([auth, { onAuthStateChanged }]) => {
      if (aktiv) stopp = onAuthStateChanged(auth, setBruker)
    })
    return () => {
      aktiv = false
      stopp()
    }
  }, [])

  async function loggInn() {
    setFeil('')
    const [auth, { GoogleAuthProvider, signInWithPopup, signInWithRedirect }] = await Promise.all([
      hentAuth(),
      import('firebase/auth'),
    ])
    const leverandor = new GoogleAuthProvider()
    leverandor.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, leverandor)
    } catch (e) {
      const kode = (e as { code?: string }).code
      // Popup blokkert (vanlig på mobil): gå via omdirigering i stedet.
      if (kode === 'auth/popup-blocked' || kode === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, leverandor)
      } else if (kode !== 'auth/popup-closed-by-user' && kode !== 'auth/cancelled-popup-request') {
        setFeil('Innloggingen feilet. Prøv igjen.')
        console.error(e)
      }
    }
  }

  /**
   * Innlogging med e-post og passord – for en egen konto ved siden av Google.
   *
   * Kontoen opprettes i Firebase-konsollen, ikke her: det finnes ingen
   * «registrer deg» på siden, fordi /admin bare er for administrator.
   */
  async function loggInnMedPassord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeil('')
    setMelding('')
    const d = new FormData(e.currentTarget)
    const [auth, { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification }] =
      await Promise.all([hentAuth(), import('firebase/auth')])
    const epost = String(d.get('epost')).trim()
    const passord = String(d.get('passord'))
    try {
      if (modus === 'ny') {
        if (passord.length < 8) {
          setFeil('Passordet må ha minst 8 tegn.')
          return
        }
        const { user } = await createUserWithEmailAndPassword(auth, epost, passord)
        await sendEmailVerification(user)
      } else {
        await signInWithEmailAndPassword(auth, epost, passord)
      }
    } catch (err) {
      const kode = (err as { code?: string }).code ?? ''
      if (kode === 'auth/email-already-in-use') {
        setFeil('Det finnes allerede en konto på denne adressen. Logg inn, eller bruk «Glemt passordet?».')
        setModus('inn')
        return
      }
      if (kode === 'auth/weak-password') {
        setFeil('Passordet er for svakt. Bruk minst 8 tegn.')
        return
      }
      setFeil(
        kode === 'auth/invalid-credential' || kode === 'auth/wrong-password' || kode === 'auth/user-not-found'
          ? 'Feil e-post eller passord.'
          : kode === 'auth/too-many-requests'
            ? 'For mange forsøk. Vent litt, eller tilbakestill passordet.'
            : kode === 'auth/operation-not-allowed'
              ? 'Innlogging med passord er ikke slått på i Firebase ennå.'
              : 'Innloggingen feilet. Prøv igjen.',
      )
    }
  }

  async function glemtPassord(epost: string) {
    setFeil('')
    setMelding('')
    if (!epost.trim()) {
      setFeil('Skriv e-postadressen din først.')
      return
    }
    const [auth, { sendPasswordResetEmail }] = await Promise.all([hentAuth(), import('firebase/auth')])
    try {
      await sendPasswordResetEmail(auth, epost.trim())
    } catch {
      // Sier ikke om adressen finnes – det ville avslørt hvem som har konto.
    }
    setMelding('Hvis adressen har en konto, er det sendt en lenke for å lage nytt passord.')
  }

  async function loggUt() {
    const [auth, { signOut }] = await Promise.all([hentAuth(), import('firebase/auth')])
    await signOut(auth)
  }

  if (!firebaseKlar)
    return (
      <Midtstilt>
        <Boks>
          <h1>Firebase er ikke satt opp</h1>
          <p>
            Legg inn <code>VITE_FIREBASE_*</code>-verdiene i <code>.env</code> og start serveren på nytt.
            Se <code>.env.example</code>.
          </p>
        </Boks>
      </Midtstilt>
    )

  if (bruker === undefined)
    return (
      <Midtstilt>
        <Dempet>Laster …</Dempet>
      </Midtstilt>
    )

  if (bruker === null)
    return (
      <Midtstilt>
        <Boks>
          <Logolenke to="/" aria-label="Vimzo – til forsiden">
            <Logo />
          </Logolenke>
          <Merke>{merke}</Merke>
          <h1>{modus === 'ny' ? 'Lag konto' : 'Logg inn'}</h1>
          <p>{ingress}</p>
          <Knapp onClick={loggInn} style={{ width: '100%' }}>
            <GoogleLogo /> Logg inn med Google
          </Knapp>

          <Eller>eller med e-post</Eller>

          <Passordskjema onSubmit={loggInnMedPassord}>
            <Felt>
              E-post
              <input
                name="epost"
                type="email"
                autoComplete="username"
                required
                value={epostFelt}
                onChange={(e) => setEpostFelt(e.target.value)}
              />
            </Felt>
            <Felt>
              {modus === 'ny' ? 'Velg et passord (minst 8 tegn)' : 'Passord'}
              <input
                name="passord"
                type="password"
                autoComplete={modus === 'ny' ? 'new-password' : 'current-password'}
                minLength={modus === 'ny' ? 8 : undefined}
                required
              />
            </Felt>
            <Knapp type="submit" $hoved style={{ width: '100%' }}>
              {modus === 'ny' ? 'Lag konto' : 'Logg inn'}
            </Knapp>
            {modus === 'inn' && (
              <Lenkeknapp type="button" onClick={() => glemtPassord(epostFelt)}>
                Glemt passordet?
              </Lenkeknapp>
            )}
          </Passordskjema>

          {tillatRegistrering && (
            <Bytt>
              {modus === 'inn' ? 'Første gang her? ' : 'Har du allerede konto? '}
              <Lenkeknapp
                type="button"
                onClick={() => {
                  setModus(modus === 'inn' ? 'ny' : 'inn')
                  setFeil('')
                  setMelding('')
                }}
              >
                {modus === 'inn' ? 'Lag konto med e-post' : 'Logg inn'}
              </Lenkeknapp>
            </Bytt>
          )}

          {feil && <Feil role="alert">{feil}</Feil>}
          {melding && <Info role="status">{melding}</Info>}
        </Boks>
      </Midtstilt>
    )

  // En passordkonto må ha bekreftet e-posten før reglene slipper den inn.
  // Uten det kunne hvem som helst registrert en konto med din adresse.
  const passordkonto = bruker.providerData.some((p) => p.providerId === 'password')
  if (passordkonto && !bruker.emailVerified)
    return <BekreftEpost bruker={bruker} loggUt={loggUt} alleredeSendt={modus === 'ny'} />

  return (
    <Kontekst.Provider value={{ bruker, loggUt }}>
      <Side>
        <Topp>
          <Venstre>
            <Link to="/" aria-label="Vimzo – til forsiden">
              <Logo />
            </Link>
            <Skillelinje aria-hidden="true" />
            <Link to={hjem.til} className="hjem">
              {hjem.tekst}
            </Link>
          </Venstre>
          <Hoyre>
            {lenker.map((l) => (
              <Link key={l.til} to={l.til} className="lenke">
                {l.tekst}
              </Link>
            ))}
            <Konto title={bruker.email ?? ''}>{bruker.email}</Konto>
            <Lenkeknapp onClick={loggUt}>Logg ut</Lenkeknapp>
          </Hoyre>
        </Topp>
        <Innhold>{children}</Innhold>
      </Side>
    </Kontekst.Provider>
  )
}

/**
 * For en passordkonto som ikke har bekreftet e-posten. Sikkerhetsreglene
 * krever bekreftet adresse, så uten dette steget ville admin bare sagt
 * «ingen tilgang» uten å forklare hvorfor.
 */
function BekreftEpost({ bruker, loggUt, alleredeSendt }: { bruker: User; loggUt: () => void; alleredeSendt: boolean }) {
  const [sendt, setSendt] = useState(alleredeSendt)
  const [feil, setFeil] = useState('')

  async function send() {
    setFeil('')
    const { sendEmailVerification } = await import('firebase/auth')
    try {
      await sendEmailVerification(bruker)
      setSendt(true)
    } catch {
      setFeil('Kunne ikke sende lenken. Vent litt og prøv igjen.')
    }
  }

  async function sjekk() {
    await bruker.reload()
    await bruker.getIdToken(true)
    if (bruker.emailVerified) window.location.reload()
    else setFeil('E-posten er ikke bekreftet ennå. Klikk på lenken i e-posten først.')
  }

  return (
    <Midtstilt>
      <Boks>
        <h1>Bekreft e-posten</h1>
        <p>
          Før du slipper inn, må du bekrefte at <strong>{bruker.email}</strong> er din. Det er det
          som hindrer andre i å lage en konto med adressen din.
        </p>
        <Knapp $hoved onClick={send} style={{ width: '100%' }}>
          {sendt ? 'Send lenken på nytt' : 'Send bekreftelseslenke'}
        </Knapp>
        {sendt && (
          <Knapp onClick={sjekk} style={{ width: '100%', marginTop: '0.6rem' }}>
            Jeg har bekreftet – fortsett
          </Knapp>
        )}
        <p style={{ margin: '1rem 0 0' }}>
          <Lenkeknapp onClick={loggUt}>Logg ut</Lenkeknapp>
        </p>
        {sendt && <Info role="status">Lenken er sendt. Sjekk innboksen, og søppelpost.</Info>}
        {feil && <Feil role="alert">{feil}</Feil>}
      </Boks>
    </Midtstilt>
  )
}

/**
 * Vises når Firestore nekter: innlogget, men ikke administrator – eller
 * reglene er ikke lagt inn ennå.
 */
export function IngenTilgang({ feil }: { feil: Error }) {
  const { bruker, loggUt } = useAdmin()
  const nektet = (feil as { code?: string }).code === 'permission-denied'
  return (
    <Boks>
      <h1>{nektet ? 'Ingen tilgang' : 'Noe gikk galt'}</h1>
      <p>
        {nektet
          ? `Kontoen ${bruker.email} har ikke tilgang til sakene. Logg inn med administrator-kontoen – eller sjekk at sikkerhetsreglene er lagt inn i Firebase.`
          : feil.message}
      </p>
      <Knapp onClick={loggUt}>Logg ut</Knapp>
    </Boks>
  )
}

/* ------------------------------------------------------------------ deler */

const TONER = {
  ny: css`background: #e8eefc; color: #1e3a8a;`,
  aktiv: css`background: ${({ theme }) => theme.colors.sunken}; color: ${({ theme }) => theme.colors.ink};`,
  venter: css`background: ${({ theme }) => theme.colors.warningSoft}; color: ${({ theme }) => theme.colors.warning};`,
  bra: css`background: ${({ theme }) => theme.colors.successSoft}; color: ${({ theme }) => theme.colors.success};`,
  stopp: css`background: ${({ theme }) => theme.colors.errorSoft}; color: ${({ theme }) => theme.colors.error};`,
  nøytral: css`background: ${({ theme }) => theme.colors.sunken}; color: ${({ theme }) => theme.colors.inkSubtle};`,
}

export function StatusMerke({ status }: { status: Status }) {
  const s = statusinfo(status)
  return <Pille $tone={s.tone}>{s.navn}</Pille>
}

const Pille = styled.span<{ $tone: Statusinfo['tone'] }>`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: var(--fs-micro);
  font-weight: 600;
  white-space: nowrap;
  ${({ $tone }) => TONER[$tone]}
`

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

/* -------------------------------------------------------------------- stil */

const Side = styled.div`
  min-height: 100vh;
  margin-top: calc(-1 * var(--nav-hoyde));
  background: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.ink};
`

const Topp = styled.header`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 64px;
  padding: 0 clamp(1rem, 3vw, 2rem);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255, 255, 255, 0.86);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);

  a {
    color: inherit;
    text-decoration: none;
  }
`

const Venstre = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;

  .hjem {
    font-size: var(--fs-body);
    font-weight: 500;
    white-space: nowrap;
  }
`

const Skillelinje = styled.span`
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.colors.border};
`

const Hoyre = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: var(--fs-small);

  .lenke {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};

    &:hover {
      color: ${({ theme }) => theme.colors.ink};
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    gap: 0.9rem;

    .lenke {
      display: none;
    }
  }
`

/** E-postadressen – kuttes heller enn å skyve «Logg ut» ut av skjermen. */
const Konto = styled.span`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkSubtle};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const Logolenke = styled(Link)`
  display: inline-flex;
  margin-bottom: 1.75rem;
  text-decoration: none;
`

export const Innhold = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 2.25rem) clamp(1rem, 3vw, 2rem) 4rem;
`

const Midtstilt = styled.div`
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin-top: calc(-1 * var(--nav-hoyde));
  padding: 1rem;
  background: ${({ theme }) => theme.colors.paper};
`

export const Boks = styled.div`
  width: min(420px, 100%);
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  h1 {
    margin: 0 0 0.5rem;
    font-size: var(--fs-title);
  }

  p {
    margin: 0 0 1.5rem;
    font-size: var(--fs-body);
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Merke = styled.p`
  margin: 0 0 0.5rem !important;
  font-size: var(--fs-micro) !important;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle} !important;
`

export const Dempet = styled.span`
  color: ${({ theme }) => theme.colors.inkSubtle};
`

export const Feil = styled.p`
  margin: 1rem 0 0 !important;
  padding: 0.7rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error} !important;
  font-size: var(--fs-small);
`

export const Knapp = styled.button<{ $hoved?: boolean; $fare?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.25rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.border};
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  ${({ $hoved, theme }) =>
    $hoved &&
    css`
      background: ${theme.colors.accentVivid};
      color: ${theme.colors.accentOn};

      &:hover:not(:disabled) {
        background: ${theme.colors.accentVividHover};
      }
    `}

  ${({ $fare, theme }) =>
    $fare &&
    css`
      background: ${theme.colors.errorSoft};
      color: ${theme.colors.error};

      &:hover:not(:disabled) {
        background: ${theme.colors.errorSoft};
        box-shadow: inset 0 0 0 1px ${theme.colors.error};
      }
    `}
`

export const Lenkeknapp = styled.button`
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
`

export const Panel = styled.section`
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};

  > h2 {
    margin: 0 0 1rem;
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

export const Felt = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};

  /* Samme felt som kalkulatoren på forsiden: fylt grått, kant først når
     det har fokus. */
  input,
  select,
  textarea {
    width: 100%;
    min-height: 48px;
    padding: 0.65rem 0.9rem;
    border: 1.5px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.sunken};
    font-family: inherit;
    font-size: var(--fs-body);
    font-weight: 400;
    color: ${({ theme }) => theme.colors.ink};
    transition: all ${({ theme }) => theme.transitions.default};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      background: ${({ theme }) => theme.colors.surface};
      box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
    }
  }

  textarea {
    resize: vertical;
    line-height: 1.5;
  }
`

const Eller = styled.p`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 !important;
  font-size: var(--fs-small) !important;
  color: ${({ theme }) => theme.colors.inkSubtle} !important;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const Bytt = styled.p`
  margin: 1.25rem 0 0 !important;
  font-size: var(--fs-small) !important;
`

const Passordskjema = styled.form`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;

  > button:last-child {
    align-self: flex-start;
    font-size: var(--fs-small);
  }
`

export const Info = styled.p`
  margin: 1rem 0 0 !important;
  padding: 0.7rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success} !important;
  font-size: var(--fs-small);
`

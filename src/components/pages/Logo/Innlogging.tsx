import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import styled, { css } from 'styled-components'
import { loggInnGoogle, loggInnPassord, loggUt, sendBekreftelseIgjen, sjekkBekreftet } from './kjop'

/**
 * Innloggingen foran verktøyet. Samme kontoer som /min-side: Google, eller
 * e-post og passord.
 *
 * Den er bygget her og ikke lånt fra /min-side sin ramme, fordi den rammen er
 * en egen side med `noindex` – lagt rundt /logo ville den gjort verktøyet
 * usynlig for søkemotorene. Selve innloggingen er den samme Firebase-kontoen.
 */
export function Innlogging() {
  const [modus, setModus] = useState<'inn' | 'ny'>('inn')
  const [feil, setFeil] = useState('')
  const [venter, setVenter] = useState(false)

  async function medPassord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeil('')
    const d = new FormData(e.currentTarget)
    const passord = String(d.get('passord'))
    if (modus === 'ny' && passord.length < 8) return setFeil('Passordet må ha minst 8 tegn.')
    setVenter(true)
    try {
      await loggInnPassord(String(d.get('epost')).trim(), passord, modus === 'ny')
    } catch (err) {
      const kode = (err as { code?: string }).code ?? ''
      setFeil(
        kode === 'auth/email-already-in-use'
          ? 'Det finnes allerede en konto på denne adressen. Logg inn i stedet.'
          : kode.includes('invalid') || kode.includes('wrong') || kode.includes('not-found')
            ? 'Feil e-post eller passord.'
            : 'Innloggingen feilet. Prøv igjen.',
      )
    } finally {
      setVenter(false)
    }
  }

  return (
    <Skjema onSubmit={medPassord} aria-label="Logg inn for å lage logo">
      <Google type="button" onClick={() => loggInnGoogle().catch(() => setFeil('Innloggingen feilet. Prøv igjen.'))}>
        <GoogleG aria-hidden="true" />
        Fortsett med Google
      </Google>
      <Skille>eller med e-post</Skille>
      <Felt>
        <label htmlFor="logo-epost">E-post</label>
        <input id="logo-epost" name="epost" type="email" autoComplete="email" required />
      </Felt>
      <Felt>
        <label htmlFor="logo-passord">Passord</label>
        <input
          id="logo-passord"
          name="passord"
          type="password"
          autoComplete={modus === 'ny' ? 'new-password' : 'current-password'}
          required
        />
      </Felt>
      <Hoved type="submit" disabled={venter}>
        {modus === 'ny' ? 'Lag konto og start' : 'Logg inn og start'}
      </Hoved>
      <Bytt type="button" onClick={() => setModus((m) => (m === 'inn' ? 'ny' : 'inn'))}>
        {modus === 'inn' ? 'Ny her? Lag en konto' : 'Har du konto? Logg inn'}
      </Bytt>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Skjema>
  )
}

/**
 * En passordkonto som ikke har bekreftet e-posten. Bestillingen krever det,
 * så vi sier fra med en gang i stedet for når kunden prøver å betale.
 */
export function Bekreft({ bruker, onBekreftet }: { bruker: User; onBekreftet: () => void }) {
  const [melding, setMelding] = useState('')
  return (
    <Skjema as="div">
      <Tekst>
        Vi har sendt en lenke til <strong>{bruker.email}</strong>. Klikk på den, og kom tilbake hit.
      </Tekst>
      <Hoved
        type="button"
        onClick={async () =>
          (await sjekkBekreftet(bruker)) ? onBekreftet() : setMelding('Ikke bekreftet ennå. Sjekk søppelpost også.')
        }
      >
        Jeg har bekreftet
      </Hoved>
      <Bytt
        type="button"
        onClick={() =>
          sendBekreftelseIgjen(bruker)
            .then(() => setMelding('Ny lenke er sendt.'))
            .catch(() => setMelding('Vent litt før du ber om en ny lenke.'))
        }
      >
        Send lenken på nytt
      </Bytt>
      <Bytt type="button" onClick={() => loggUt()}>
        Logg ut
      </Bytt>
      {melding && <Tekst role="status">{melding}</Tekst>}
    </Skjema>
  )
}

/* ------------------------------------------------------------------- stiler */

const Skjema = styled.form`
  display: grid;
  gap: 0.75rem;
  width: 100%;
`

const knapp = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0 1.4rem;
  border-radius: 999px;
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
`

const Hoved = styled.button`
  ${knapp}
  border: 0;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: #fff;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:disabled {
    opacity: 0.6;
  }
`

const Google = styled.button`
  ${knapp}
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  color: ${({ theme }) => theme.colors.ink};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

/** Googles «G», tegnet i deres fire farger – det er det folk ser etter. */
function GoogleG(props: { 'aria-hidden': 'true' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

const Skille = styled.p`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.25rem 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkSubtle};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const Felt = styled.div`
  display: grid;
  gap: 0.35rem;

  label {
    font-size: var(--fs-small);
    font-weight: 500;
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

const Bytt = styled.button`
  justify-self: center;
  min-height: 40px;
  padding: 0 0.5rem;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
`

const Feil = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.error};
`

const Tekst = styled.p`
  margin: 0;
  font-size: var(--fs-body);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};

  strong {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.ink};
  }
`

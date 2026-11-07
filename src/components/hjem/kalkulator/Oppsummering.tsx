import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { epost } from '../../../data/firma'
import { formaterRamme } from '../../../data/pakker'
import { emailjsKlar, sendHenvendelse } from '../../../lib/emailjs'
import type { Estimat, Svar } from '../../../data/kalkulator'

type Status = 'klar' | 'sender' | 'sendt' | 'feil'

/**
 * Oppsummeringen som åpner seg når kunden er ferdig i kalkulatoren.
 *
 * Før sendte knappen kunden videre til kontaktskjemaet, og der måtte han
 * skrive bedriftsnavnet en gang til. Nå ser han svarene sine samlet, legger
 * til hvor vi skal svare, og bestemmer selv om det skal sendes. Ingenting går
 * noe sted før han trykker send – det er løftet i helten, og det holder vi.
 *
 * Native `<dialog>`: den gir fokusfelle, Esc og bakgrunn gratis, og den er
 * tilgjengelig uten at vi må gjenoppfinne noe.
 */
export default function Oppsummering({
  apen,
  onLukk,
  svar,
  estimat,
  brief,
}: {
  apen: boolean
  onLukk: () => void
  svar: Svar
  estimat: Estimat
  brief: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState<Status>('klar')
  const tittelId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (apen && !dialog.open) dialog.showModal()
    if (!apen && dialog.open) dialog.close()
  }, [apen])

  /** Etter en sending starter neste åpning på nytt, ikke på kvitteringen. */
  function lukk() {
    if (status === 'sendt' || status === 'feil') setStatus('klar')
    onLukk()
  }

  async function send(hendelse: FormEvent<HTMLFormElement>) {
    hendelse.preventDefault()
    const data = Object.fromEntries(new FormData(hendelse.currentTarget)) as Record<string, string>

    // Honningkrukke: skjult for mennesker, men roboter fyller den ut.
    if (data.nettsted) return

    const bedrift = svar.navn.trim()
    const henvendelse = {
      emne: `Anslag fra kalkulatoren: ${bedrift || data.navn || 'nettsiden'} (${formaterRamme(estimat.ramme)} kr)`,
      navn: data.navn || '',
      bedrift,
      epost: data.epost || '',
      telefon: data.telefon || '',
      melding: data.melding || '',
      brief,
    }

    if (!emailjsKlar) {
      const linjer = [
        `Navn: ${henvendelse.navn || '–'}`,
        `E-post: ${henvendelse.epost || '–'}`,
        `Telefon: ${henvendelse.telefon || '–'}`,
        '',
        henvendelse.melding,
        '',
        '— Fra kalkulatoren —',
        brief,
      ].join('\n')
      window.location.href = `mailto:${epost()}?subject=${encodeURIComponent(henvendelse.emne)}&body=${encodeURIComponent(linjer)}`
      return
    }

    setStatus('sender')
    try {
      await sendHenvendelse(henvendelse)
      setStatus('sendt')
    } catch (feil) {
      console.error(feil)
      setStatus('feil')
    }
  }

  return (
    <Dialog ref={ref} onClose={lukk} aria-labelledby={tittelId}>
      <Lukk type="button" onClick={lukk} aria-label="Lukk">
        <Icon navn="lukk" storrelse={18} tykkelse={2} />
      </Lukk>

      {status === 'sendt' ? (
        <Kvittering role="status">
          <Icon navn="sjekk" storrelse={26} tykkelse={2.4} />
          <h2 id={tittelId}>Takk – det er sendt</h2>
          <p>
            Du hører fra oss innen to virkedager, så finner vi en halvtime til å snakke sammen.
          </p>
          <Hovedknapp type="button" onClick={lukk}>
            Lukk
          </Hovedknapp>
        </Kvittering>
      ) : (
        <>
          <Stikkord>Ditt anslag</Stikkord>
          <h2 id={tittelId}>{svar.navn.trim() ? `Slik blir det for ${svar.navn.trim()}` : 'Slik blir det'}</h2>

          <Prislinje>
            <Merke>Ligner på {estimat.pakke.navn}</Merke>
            <strong>{formaterRamme(estimat.ramme)} kr</strong>
            <span>anslag · drift {estimat.drift.pris} kr/mnd</span>
          </Prislinje>

          <Brief>{brief}</Brief>

          <form onSubmit={send}>
            <Tekst>
              Dette er utgangspunktet for en prat, ikke en bestilling. Si hvor vi kan nå deg, så tar vi
              kontakt og avtaler en halvtime. Den endelige prisen får du skriftlig etterpå.
            </Tekst>
            <Rad>
              <Felt>
                <label htmlFor={`${tittelId}-navn`}>Ditt navn</label>
                <input id={`${tittelId}-navn`} name="navn" autoComplete="name" required />
              </Felt>
              <Felt>
                <label htmlFor={`${tittelId}-epost`}>E-post</label>
                <input id={`${tittelId}-epost`} name="epost" type="email" autoComplete="email" required />
              </Felt>
            </Rad>
            <Felt>
              <label htmlFor={`${tittelId}-telefon`}>
                Telefon <small>valgfritt</small>
              </label>
              <input id={`${tittelId}-telefon`} name="telefon" type="tel" autoComplete="tel" />
            </Felt>
            <Felt>
              <label htmlFor={`${tittelId}-melding`}>
                Noe vi bør vite? <small>valgfritt</small>
              </label>
              <textarea
                id={`${tittelId}-melding`}
                name="melding"
                rows={3}
                placeholder="Har du en nettside fra før, legg gjerne ved adressen."
              />
            </Felt>

            <Honningkrukke aria-hidden="true">
              <label htmlFor={`${tittelId}-nettsted`}>Ikke fyll ut dette feltet</label>
              <input id={`${tittelId}-nettsted`} name="nettsted" tabIndex={-1} autoComplete="off" />
            </Honningkrukke>

            {status === 'feil' && (
              <Feilmelding role="alert">
                Noe gikk galt da det skulle sendes. Prøv igjen om litt – svarene dine er tatt vare på.
              </Feilmelding>
            )}

            <Bunn>
              <Tilbake type="button" onClick={lukk}>
                Endre svarene
              </Tilbake>
              <Hovedknapp type="submit" disabled={status === 'sender'}>
                {status === 'sender' ? 'Sender …' : emailjsKlar ? 'Send til Vimzo' : 'Åpne som e-post'}
                {status !== 'sender' && <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />}
              </Hovedknapp>
            </Bunn>
            <Notat>Vi bruker opplysningene kun til å svare deg. Ingen nyhetsbrev, ingen videresalg.</Notat>
          </form>
        </>
      )}
    </Dialog>
  )
}

const Dialog = styled.dialog`
  /* Den globale resetten nuller margin, og da mister <dialog> sentreringen. */
  margin: auto;
  width: min(640px, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: clamp(1.4rem, 3vw, 2.2rem);
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  box-shadow: ${({ theme }) => theme.shadows.svev};
  overflow-y: auto;

  &::backdrop {
    background: rgba(19, 17, 31, 0.55);
    backdrop-filter: blur(3px);
  }

  h2 {
    margin: 0 2.5rem 1rem 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: -0.03em;
    line-height: 1.15;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.4rem;
    padding-top: 1.4rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    width: calc(100vw - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: ${({ theme }) => theme.borderRadius.large};
  }
`

const Lukk = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Stikkord = styled.p`
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
`

const Prislinje = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 0.75rem;
  margin-bottom: 1rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.04em;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  span {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Merke = styled.em`
  align-self: center;
  padding: 0.25rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 650;
`

const Brief = styled.pre`
  margin: 0;
  padding: 1rem 1.15rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Tekst = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Felt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.875rem;
    font-weight: 550;
    color: ${({ theme }) => theme.colors.ink};
  }

  label small {
    font-size: 0.75rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  input,
  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.surface};
    font-family: inherit;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.ink};

    &::placeholder {
      color: ${({ theme }) => theme.colors.inkSubtle};
    }

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
    }
  }

  textarea {
    resize: vertical;
    line-height: 1.5;
  }
`

const Honningkrukke = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const Feilmelding = styled.p`
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.9375rem;

  a {
    color: inherit;
  }
`

const Bunn = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
`

const Tilbake = styled.button`
  padding: 0.5rem 0.25rem;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 550;
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Hovedknapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0 1.5rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
`

const Notat = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Kvittering = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;

  > svg {
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.accent};
  }

  p {
    margin: 0 0 1.25rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, organisasjon } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import { firma, epost } from '../../../data/firma'
import { pakker, formaterRamme } from '../../../data/pakker'
import { BRIEF_NOKKEL } from '../../../data/kalkulator'
import { emailjsKlar, sendHenvendelse } from '../../../lib/emailjs'

/*
 * Skjemaet sendes via EmailJS (se `src/lib/emailjs.ts`), samme vei som
 * oppsummeringen fra kalkulatoren. Er EmailJS ikke satt opp, faller det
 * tilbake til en ferdig utfylt e-post – en knapp som later som den sender noe
 * ingen leser, er verre enn en som åpner e-postklienten.
 */

type Status = 'klar' | 'sender' | 'sendt' | 'feil'

export default function KontaktSide() {
  const [status, setStatus] = useState<Status>('klar')
  /**
   * Briefet fra veiviseren på forsiden. Det ligger i sessionStorage fordi det
   * er for langt for en adresselinje – og fordi en kundes valg ikke har noe i
   * nettleserhistorikken å gjøre. Finnes det ikke noe brief, oppfører skjemaet
   * seg nøyaktig som før.
   */
  const [brief, setBrief] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      return sessionStorage.getItem(BRIEF_NOKKEL) || ''
    } catch {
      // Privat modus – da er det bare å fylle ut skjemaet manuelt.
      return ''
    }
  })

  useSEO({
    title: 'Kontakt – få tilbud på nettside | Vimzo',
    description:
      'Fortell kort hva bedriften gjør, så får du et skriftlig tilbud med fast pris – vanligvis ' +
      'innen to virkedager. Ingen forpliktelser.',
    jsonLd: [
      brodsmuler([{ navn: 'Kontakt', sti: '/kontakt' }]),
      organisasjon(),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Kontakt Vimzo',
        description: 'Be om tilbud på nettside, eller still et spørsmål.',
      },
    ],
  })

  async function send(hendelse: FormEvent<HTMLFormElement>) {
    hendelse.preventDefault()
    const skjema = hendelse.currentTarget
    const data = Object.fromEntries(new FormData(skjema)) as Record<string, string>

    // Honningkrukke: felt som er skjult for mennesker, men som roboter fyller ut.
    if (data.nettsted) return

    if (!emailjsKlar) {
      const linjer = [
        `Bedrift: ${data.bedrift || '–'}`,
        `Navn: ${data.navn || '–'}`,
        `Telefon: ${data.telefon || '–'}`,
        `Pakke: ${data.pakke || 'Ikke bestemt'}`,
        '',
        data.melding || '',
        ...(brief ? ['', '— Fra veiviseren —', brief] : []),
      ].join('\n')
      window.location.href = `mailto:${epost()}?subject=${encodeURIComponent(
        `Forespørsel fra ${data.bedrift || data.navn || 'nettsiden'}`,
      )}&body=${encodeURIComponent(linjer)}`
      return
    }

    setStatus('sender')
    try {
      await sendHenvendelse({
        emne: `Forespørsel fra ${data.bedrift || data.navn || 'nettsiden'}`,
        navn: data.navn || '',
        bedrift: data.bedrift || '',
        epost: data.epost || '',
        telefon: data.telefon || '',
        melding: `Pakke: ${data.pakke || 'Ikke bestemt'}\n\n${data.melding || ''}`,
        brief,
      })
      setStatus('sendt')
      skjema.reset()
      try {
        sessionStorage.removeItem(BRIEF_NOKKEL)
      } catch {
        // Ikke kritisk – briefet forsvinner uansett når fanen lukkes.
      }
    } catch (feil) {
      console.error(feil)
      setStatus('feil')
    }
  }

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Kontakt' }]}
        stikkord="Kontakt"
        tittel="Fortell kort hva bedriften gjør"
        ingress="Du får et skriftlig tilbud med fast pris, vanligvis innen to virkedager. Ingen forpliktelser, og ingen som ringer deg opp igjen i et halvt år."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Oppsett>
            <Skjemaside>
              {status === 'sendt' ? (
                <Kvittering role="status">
                  <Icon navn="sjekk" storrelse={26} tykkelse={2.2} />
                  <h2>Takk — meldingen er sendt</h2>
                  <p>
                    Du hører fra oss innen to virkedager.
                  </p>
                </Kvittering>
              ) : (
                <form onSubmit={send} noValidate={false}>
                  {brief && (
                    <Briefkort>
                      <Brieftopp>
                        <Icon navn="sjekk" storrelse={15} tykkelse={2.6} />
                        <strong>Dette følger med fra veiviseren</strong>
                        <button type="button" onClick={() => setBrief('')}>
                          Fjern
                        </button>
                      </Brieftopp>
                      <pre>{brief}</pre>
                      <input type="hidden" name="brief" value={brief} />
                    </Briefkort>
                  )}

                  <Rad>
                    <Felt>
                      <label htmlFor="bedrift">Bedrift</label>
                      <input id="bedrift" name="bedrift" type="text" autoComplete="organization" required />
                    </Felt>
                    <Felt>
                      <label htmlFor="navn">Ditt navn</label>
                      <input id="navn" name="navn" type="text" autoComplete="name" required />
                    </Felt>
                  </Rad>

                  <Rad>
                    <Felt>
                      <label htmlFor="epost">E-post</label>
                      <input id="epost" name="epost" type="email" autoComplete="email" required />
                    </Felt>
                    <Felt>
                      <label htmlFor="telefon">
                        Telefon <small>valgfritt</small>
                      </label>
                      <input id="telefon" name="telefon" type="tel" autoComplete="tel" />
                    </Felt>
                  </Rad>

                  <Felt>
                    <label htmlFor="pakke">
                      Hva tenker du på? <small>valgfritt</small>
                    </label>
                    <select id="pakke" name="pakke" defaultValue="">
                      <option value="">Ikke bestemt ennå</option>
                      {pakker.map((p) => (
                        <option key={p.id} value={p.navn}>
                          {p.navn}
                          {` – typisk ${formaterRamme(p.pris)} kr`}
                        </option>
                      ))}
                      <option value="Foto og dronevideo">Foto og dronevideo</option>
                      <option value="Noe annet">Noe annet</option>
                    </select>
                  </Felt>

                  <Felt>
                    <label htmlFor="melding">Hva driver bedriften med?</label>
                    <textarea
                      id="melding"
                      name="melding"
                      rows={6}
                      required
                      placeholder="Noen setninger holder. Har du en nettside fra før, legg gjerne ved adressen."
                    />
                  </Felt>

                  {/* Skjult for mennesker, synlig for roboter. */}
                  <Honningkrukke aria-hidden="true">
                    <label htmlFor="nettsted">Ikke fyll ut dette feltet</label>
                    <input id="nettsted" name="nettsted" type="text" tabIndex={-1} autoComplete="off" />
                  </Honningkrukke>

                  {status === 'feil' && (
                    <Feilmelding role="alert">
                      Noe gikk galt da meldingen skulle sendes. Prøv igjen om litt – det du har
                      skrevet, står der fortsatt.
                    </Feilmelding>
                  )}

                  <Bunnrad>
                    <Knapp type="submit" variant="aksent" stor disabled={status === 'sender'}>
                      {status === 'sender' ? 'Sender …' : 'Send forespørsel'}
                    </Knapp>
                    <Personvernnotat>
                      Vi bruker opplysningene kun til å svare deg. Ingen nyhetsbrev, ingen
                      videresalg.
                    </Personvernnotat>
                  </Bunnrad>
                </form>
              )}
            </Skjemaside>

            <Sidespalte>
              <Forventning>
                <h2>Hva skjer videre</h2>
                <ol>
                  <li>Vi leser forespørselen og svarer innen to virkedager.</li>
                  <li>Vi tar en prat på 30 minutter – telefon eller video.</li>
                  <li>Du får et skriftlig tilbud med fast pris og leveringsdato.</li>
                  <li>Du bestemmer deg i fred. Vi maser ikke.</li>
                </ol>
              </Forventning>

              <Dekning>
                <h2>Vi leverer til</h2>
                <p>{firma.dekningsomrade.join(' · ')}</p>
              </Dekning>
            </Sidespalte>
          </Oppsett>
        </Wrap>
      </Seksjon>
    </>
  )
}

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.75fr);
  gap: 3.5rem;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
`

const Skjemaside = styled.div`
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Felt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    font-size: 0.875rem;
    font-weight: 550;
    letter-spacing: -0.005em;
    color: ${({ theme }) => theme.colors.ink};
  }

  label small {
    /* Uten en egen grad arver <small> nettleserens «smaller», som er
       0.83 av etiketten – det ga 11.7px og brøt gulvet på 12. */
    font-size: 0.75rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.8rem 0.95rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.sunken};
    font-family: inherit;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.ink};
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      background-color ${({ theme }) => theme.transitions.default};

    &::placeholder {
      color: ${({ theme }) => theme.colors.inkSubtle};
    }

    &:focus {
      background: ${({ theme }) => theme.colors.surface};
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  textarea {
    resize: vertical;
    line-height: 1.6;
  }
`

const Honningkrukke = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const Bunnrad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
`

const Personvernnotat = styled.p`
  flex: 1;
  min-width: 18rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Feilmelding = styled.p`
  padding: 0.85rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.9375rem;

  a {
    color: inherit;
  }
`

const Kvittering = styled.div`
  padding: 2.5rem 2rem;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  svg {
    margin-bottom: 1rem;
  }

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 0.6rem;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.65;
  }

  a {
    color: inherit;
  }
`

const Sidespalte = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  h2 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin-bottom: 1rem;
  }
`

const Forventning = styled.div`
  padding: 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  ol {
    counter-reset: steg;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  li {
    counter-increment: steg;
    display: flex;
    gap: 0.7rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  li::before {
    content: counter(steg, decimal-leading-zero);
    flex-shrink: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    padding-top: 0.2em;
  }
`

const Dekning = styled.div`
  padding: 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};

  p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Briefkort = styled.div`
  padding: 1rem 1.15rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};

  pre {
    margin-top: 0.6rem;
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Brieftopp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }

  strong {
    font-size: 0.9rem;
    font-weight: 650;
  }

  button {
    margin-left: auto;
    border: 0;
    background: none;
    font-family: inherit;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    cursor: pointer;

    &:hover {
      color: ${({ theme }) => theme.colors.ink};
    }
  }
`

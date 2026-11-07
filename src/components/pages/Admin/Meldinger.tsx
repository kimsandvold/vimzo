import { useEffect, useRef, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Feil, Felt, Knapp } from './felles'
import { dato } from './format'
import { lyttMeldinger, sendMelding } from '../../../lib/prosjekter'
import type { Melding } from '../../../data/prosjekt'

/**
 * Meldingstråden for ett prosjekt – den samme for kunden og for deg.
 *
 * `meg` avgjør hvilken side som er «din»: dine meldinger står til høyre, den
 * andres til venstre, som i enhver meldingsapp.
 */
export default function Meldinger({
  prosjektId,
  meg,
  navn,
  vedSendt,
}: {
  prosjektId: string
  meg: 'kunde' | 'vimzo'
  navn: string
  /** Kalles etter at en melding er lagret – for e-postvarsel. */
  vedSendt?: (tekst: string) => void
}) {
  const [meldinger, setMeldinger] = useState<Melding[] | null>(null)
  const [tekst, setTekst] = useState('')
  const [sender, setSender] = useState(false)
  const [feil, setFeil] = useState('')
  const bunn = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttMeldinger(prosjektId, setMeldinger, () => setFeil('Kunne ikke hente meldingene.')).then((s) =>
      aktiv ? (stopp = s) : s(),
    )
    return () => {
      aktiv = false
      stopp()
    }
  }, [prosjektId])

  useEffect(() => {
    bunn.current?.scrollIntoView({ block: 'nearest' })
  }, [meldinger?.length])

  async function send(e: FormEvent) {
    e.preventDefault()
    const t = tekst.trim()
    if (!t || sender) return
    setSender(true)
    setFeil('')
    try {
      await sendMelding(prosjektId, meg, navn, t)
      setTekst('')
      vedSendt?.(t)
    } catch (err) {
      console.error(err)
      setFeil('Meldingen ble ikke sendt. Prøv igjen.')
    } finally {
      setSender(false)
    }
  }

  return (
    <div>
      <Trad>
        {meldinger === null ? (
          <Tom>Henter meldinger …</Tom>
        ) : meldinger.length === 0 ? (
          <Tom>{meg === 'kunde' ? 'Ingen meldinger ennå. Lurer du på noe, skriv her.' : 'Ingen meldinger ennå.'}</Tom>
        ) : (
          meldinger.map((m) => (
            <Boble key={m.id} $min={m.fra === meg}>
              <p>{m.tekst}</p>
              <span>
                {m.fra === 'vimzo' ? 'Vimzo' : m.navn || 'Kunden'} · {dato(m.tid, true)}
              </span>
            </Boble>
          ))
        )}
        <div ref={bunn} />
      </Trad>
      <Skjema onSubmit={send}>
        <Felt>
          <span className="skjult">Ny melding</span>
          <textarea
            rows={3}
            value={tekst}
            maxLength={5000}
            onChange={(e) => setTekst(e.target.value)}
            placeholder={meg === 'kunde' ? 'Skriv til Vimzo …' : 'Skriv til kunden …'}
            onKeyDown={(e) => {
              // Cmd/Ctrl + Enter sender – vanlig Enter gir ny linje.
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e)
            }}
          />
        </Felt>
        <Knapp $hoved type="submit" disabled={sender || !tekst.trim()}>
          {sender ? 'Sender …' : 'Send'}
        </Knapp>
      </Skjema>
      {feil && <Feil role="alert">{feil}</Feil>}
    </div>
  )
}

const Trad = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 420px;
  overflow-y: auto;
  padding: 0.25rem 0.1rem 0.75rem;
`

const Tom = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Boble = styled.div<{ $min: boolean }>`
  align-self: ${({ $min }) => ($min ? 'flex-end' : 'flex-start')};
  max-width: 85%;
  padding: 0.65rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border-bottom-${({ $min }) => ($min ? 'right' : 'left')}-radius: 4px;
  background: ${({ theme, $min }) => ($min ? theme.colors.ink : theme.colors.sunken)};
  color: ${({ theme, $min }) => ($min ? theme.colors.inkInverted : theme.colors.ink)};

  p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  span {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  > label {
    width: 100%;
  }

  .skjult {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`

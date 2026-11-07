import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { AdminRamme, Feil, Felt, Knapp, Panel } from './felles'
import { opprettManuell } from '../../../lib/henvendelser'

/**
 * Legg inn en sak selv.
 *
 * De første kundene kommer nesten alltid fra nettverket – en telefon, en
 * prat på butikken – og de skal inn i samme oversikt som dem fra skjemaene.
 */
export default function NySak() {
  return (
    <AdminRamme tittel="Ny sak">
      <Skjema />
    </AdminRamme>
  )
}

function Skjema() {
  const naviger = useNavigate()
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    const verdi = (k: string) => (d[k] ?? '').trim()
    if (!verdi('navn') && !verdi('bedrift')) {
      setFeil('Fyll inn navn eller bedrift.')
      return
    }
    setLagrer(true)
    setFeil('')
    try {
      const id = await opprettManuell({
        navn: verdi('navn'),
        bedrift: verdi('bedrift'),
        epost: verdi('epost'),
        telefon: verdi('telefon'),
        melding: verdi('melding'),
      })
      naviger(`/admin/sak/${id}`)
    } catch (err) {
      console.error(err)
      setFeil('Kunne ikke lagre. Prøv igjen.')
      setLagrer(false)
    }
  }

  return (
    <Smal>
      <Tilbake to="/admin">← Alle saker</Tilbake>
      <h1>Ny sak</h1>
      <Panel>
        <form onSubmit={send}>
          <To>
            <Felt>
              Navn
              <input name="navn" autoFocus />
            </Felt>
            <Felt>
              Bedrift
              <input name="bedrift" />
            </Felt>
            <Felt>
              E-post
              <input name="epost" type="email" />
            </Felt>
            <Felt>
              Telefon
              <input name="telefon" type="tel" />
            </Felt>
          </To>
          <Felt style={{ marginTop: '0.75rem' }}>
            Hva gjelder det?
            <textarea name="melding" rows={4} placeholder="Ringte etter anbefaling fra … Vil ha ny side med booking." />
          </Felt>
          <Knapp $hoved type="submit" disabled={lagrer} style={{ marginTop: '1rem' }}>
            {lagrer ? 'Lagrer …' : 'Opprett sak'}
          </Knapp>
          {feil && <Feil role="alert">{feil}</Feil>}
        </form>
      </Panel>
    </Smal>
  )
}

const Smal = styled.div`
  max-width: 640px;

  h1 {
    margin: 0 0 1rem;
    font-size: 1.75rem;
  }
`

const Tilbake = styled(Link)`
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`

const To = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

import { useState } from 'react'
import styled from 'styled-components'
import { Dempet, Feil, Felt, Knapp, Lenkeknapp, Panel } from './felles'
import { dato } from './format'
import Meldinger from './Meldinger'
import { fjernKundetilgang, giKundetilgang, oppdaterProsjekt } from '../../../lib/prosjekter'
import { settStatus } from '../../../lib/henvendelser'
import type { Prosjekt } from '../../../data/prosjekt'
import type { Sak } from '../../../data/saker'

/** Banner øverst når kunden har godtatt tilbudet, men saken ikke er flyttet ennå. */
export function GodtattBanner({ sak, prosjekt }: { sak: Sak; prosjekt: Prosjekt | null | undefined }) {
  const [lagrer, setLagrer] = useState(false)
  if (!prosjekt?.tilbudGodtatt || sak.status !== 'tilbud') return null
  return (
    <Banner role="status">
      <span>
        <strong>Kunden godtok tilbudet</strong> på Min side {dato(prosjekt.tilbudGodtatt, true)}.
      </span>
      <Knapp
        $hoved
        disabled={lagrer}
        onClick={async () => {
          setLagrer(true)
          await settStatus(sak, 'godtatt', prosjekt.tilbudGodtatt!).finally(() => setLagrer(false))
        }}
      >
        Sett status til «Godtatt»
      </Knapp>
    </Banner>
  )
}

/**
 * Panelet der du gir kunden tilgang til Min side, og bestemmer det kunden
 * ser utover status og beløp: forventet levering og hva tilbudet dekker.
 */
export function KundetilgangPanel({ sak, prosjekt }: { sak: Sak; prosjekt: Prosjekt | null | undefined }) {
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')

  async function kjor(fn: () => Promise<unknown>) {
    setLagrer(true)
    setFeil('')
    try {
      await fn()
    } catch (e) {
      console.error(e)
      setFeil('Kunne ikke lagre. Prøv igjen.')
    } finally {
      setLagrer(false)
    }
  }

  if (prosjekt === undefined)
    return (
      <Panel>
        <h2>Min side</h2>
        <Dempet>Henter …</Dempet>
      </Panel>
    )

  if (prosjekt === null)
    return (
      <Panel>
        <h2>Min side</h2>
        <Dempet as="p" style={{ margin: '0 0 0.9rem', fontSize: '0.875rem' }}>
          {sak.epost
            ? `Gi kunden tilgang til å følge saken på vimzo.no/min-side – status, tilbud, faktura og meldinger. Kunden logger inn med ${sak.epost}.`
            : 'Saken har ingen e-postadresse. Legg den inn under Kontakt før du gir tilgang.'}
        </Dempet>
        <Knapp $hoved disabled={lagrer || !sak.epost} onClick={() => kjor(() => giKundetilgang(sak))}>
          Gi kundetilgang
        </Knapp>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Panel>
    )

  const invitasjon =
    `mailto:${sak.epost}?subject=${encodeURIComponent('Følg prosjektet ditt hos Vimzo')}` +
    `&body=${encodeURIComponent(
      `Hei ${sak.navn || ''}\n\nDu kan nå følge prosjektet ditt på https://vimzo.no/min-side – status, tilbud og meldinger samlet ett sted.\n\nLogg inn med Google, eller lag et passord, på ${sak.epost}.\n\nVennlig hilsen\nKim Sandvold\nVimzo`,
    )}`

  return (
    <Panel>
      <h2>Min side</h2>
      <Dempet as="p" style={{ margin: '0 0 0.9rem', fontSize: '0.875rem' }}>
        Kunden har tilgang med <strong>{prosjekt.kundeEpost}</strong>. Status, tidslinje, beløp og drift
        oppdateres automatisk fra saken.
      </Dempet>
      <Felt>
        Forventet levering
        <input
          type="date"
          defaultValue={prosjekt.forventetLevering ?? ''}
          key={`lev-${prosjekt.forventetLevering}`}
          disabled={lagrer}
          onChange={(e) => kjor(() => oppdaterProsjekt(prosjekt.id, { forventetLevering: e.target.value || null }))}
        />
      </Felt>
      <Felt style={{ marginTop: '0.75rem' }}>
        Hva tilbudet dekker (vises for kunden)
        <textarea
          rows={4}
          defaultValue={prosjekt.tilbudsbeskrivelse}
          key={`besk-${prosjekt.tilbudsbeskrivelse}`}
          placeholder="Bedriftsside med 6 sider, tekster, halv dag foto, Google-oppsett …"
          disabled={lagrer}
          onBlur={(e) =>
            e.target.value !== prosjekt.tilbudsbeskrivelse &&
            kjor(() => oppdaterProsjekt(prosjekt.id, { tilbudsbeskrivelse: e.target.value.trim() }))
          }
        />
      </Felt>
      <Rad>
        <Knapp as="a" href={invitasjon}>
          Send invitasjon på e-post
        </Knapp>
        <Knapp as="a" href="/min-side" target="_blank" rel="noopener">
          Se Min side
        </Knapp>
        <Lenkeknapp
          type="button"
          onClick={() =>
            confirm('Fjerne kundens tilgang til Min side? Meldingene blir liggende, men kunden ser dem ikke.') &&
            kjor(() => fjernKundetilgang(prosjekt.id))
          }
        >
          Fjern tilgang
        </Lenkeknapp>
      </Rad>
      {feil && <Feil role="alert">{feil}</Feil>}
    </Panel>
  )
}

/** Meldingstråden, sett fra din side. */
export function MeldingerPanel({ sak, prosjekt }: { sak: Sak; prosjekt: Prosjekt | null | undefined }) {
  if (!prosjekt) return null
  const varsel =
    `mailto:${sak.epost}?subject=${encodeURIComponent('Ny melding fra Vimzo')}` +
    `&body=${encodeURIComponent(`Hei ${sak.navn || ''}\n\nDu har fått en ny melding på https://vimzo.no/min-side.\n\nVennlig hilsen\nKim Sandvold\nVimzo`)}`
  return (
    <Panel>
      <h2>Meldinger med kunden</h2>
      <Meldinger prosjektId={prosjekt.id} meg="vimzo" navn="Vimzo" />
      <Dempet as="p" style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem' }}>
        Kunden får ikke varsel automatisk. <a href={varsel}>Send et kort e-postvarsel</a> når det trengs.
      </Dempet>
    </Panel>
  )
}

const Banner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-size: var(--fs-body);
`

const Rad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-top: 1rem;
`

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Dempet, Feil, Knapp, Panel } from './felles'
import { dato } from './format'
import { frigiDesign, hentDesign, type LagretDesign } from '../../../lib/logodesign'
import { PRODUKTER } from '../../../data/logoprodukter'
import { bekreftTilKunde } from '../../../lib/emailjs'
import type { Sak } from '../../../data/saker'

/**
 * Logoen kunden laget i logoverktøyet og valgte i kalkulatoren.
 *
 * Den er ikke betalt, og skal ikke faktureres for seg – den inngår i
 * nettsideprosjektet. Her ser du den, kan åpne den, og frigir den når
 * nettsiden er ferdig. Da forsvinner vannmerket, og kunden kan laste ned hele
 * pakken fra Min side. Husk å ta den med på fakturaen for nettsiden.
 */
export default function LogoISak({ sak }: { sak: Sak }) {
  const id = sak.logodesign
  const [design, setDesign] = useState<LagretDesign | null | undefined>(undefined)
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState('')

  useEffect(() => {
    if (!id) return
    let aktiv = true
    hentDesign(id)
      .then((d) => aktiv && setDesign(d))
      .catch(() => aktiv && setDesign(null))
    return () => {
      aktiv = false
    }
  }, [id])

  if (!id) return null

  async function frigi(verdi: boolean) {
    if (!design) return
    if (verdi && !window.confirm('Frigi logoen? Kunden får en e-post og kan laste ned alle filene uten vannmerke fra Min side.')) return
    setLagrer(true)
    setFeil('')
    try {
      await frigiDesign(design.id, verdi)
      setDesign({ ...design, frigitt: verdi })
      // Si fra til kunden – ellers ligger filene klare uten at noen vet det.
      if (verdi && sak.epost)
        await bekreftTilKunde({
          emne: 'Logoen din er klar til nedlasting',
          navn: sak.navn,
          bedrift: sak.bedrift,
          epost: sak.epost,
          telefon: '',
          melding: [
            `Logoen «${design.navn || sak.bedrift}» er klar. Du finner alle filene – logo, farger, skrift og den visuelle profilen – på Min side:`,
            'https://vimzo.no/min-side',
            '',
            'Logoen er en del av nettsideprosjektet og står på samme faktura som nettsiden.',
          ].join('\n'),
          brief: '',
        })
    } catch (e) {
      console.error(e)
      setFeil('Kunne ikke lagre. Er de nye sikkerhetsreglene deployet?')
    } finally {
      setLagrer(false)
    }
  }

  return (
    <Panel>
      <h2>Logo fra logoverktøyet</h2>
      {design === undefined && <Dempet>Henter logoen …</Dempet>}
      {design === null && (
        <Dempet>Fant ikke logoen (design {id}). Kunden kan ha slettet utkastet.</Dempet>
      )}
      {design && (
        <>
          <Visning>
            {design.forhandsvisning ? (
              <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(design.forhandsvisning)}`} alt={`Logoen til ${design.navn}`} />
            ) : (
              <Dempet>Ingen forhåndsvisning</Dempet>
            )}
          </Visning>
          <Linjer>
            <li>
              <span>Navn</span>
              <strong>{design.navn || 'Uten navn'}</strong>
            </li>
            <li>
              <span>Status</span>
              <strong>
                {design.bestillingId
                  ? 'Kjøpt i verktøyet'
                  : design.frigitt
                    ? 'Frigitt til kunden'
                    : 'Ikke frigitt – faktureres med nettsiden'}
              </strong>
            </li>
            <li>
              <span>På fakturaen</span>
              <strong>
                {design.bestillingId ? 'Allerede fakturert som eget kjøp' : `${PRODUKTER.logo.navn} fra logoverktøyet, ${PRODUKTER.logo.pris} kr`}
              </strong>
            </li>
            <li>
              <span>Sist endret</span>
              <strong>{dato(design.oppdatert, true)}</strong>
            </li>
          </Linjer>
          <Handlinger>
            {!design.bestillingId &&
              (design.frigitt ? (
                <Knapp type="button" onClick={() => frigi(false)} disabled={lagrer}>
                  Trekk tilbake frigivelsen
                </Knapp>
              ) : (
                <Knapp type="button" $hoved onClick={() => frigi(true)} disabled={lagrer}>
                  Frigi logoen til kunden
                </Knapp>
              ))}
            <Knapp as="a" href={`/logo?design=${design.id}`} target="_blank" rel="noopener">
              Åpne i logoverktøyet ↗
            </Knapp>
          </Handlinger>
          {feil && <Feil role="alert">{feil}</Feil>}
        </>
      )}
    </Panel>
  )
}

const Visning = styled.div`
  display: grid;
  place-items: center;
  min-height: 140px;
  margin-bottom: 1rem;
  padding: 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};

  img {
    max-width: 80%;
    max-height: 110px;
    object-fit: contain;
  }
`

const Linjer = styled.ul`
  display: grid;
  gap: 0.5rem;
  margin: 0 0 1rem;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: var(--fs-small);
  }

  span {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  strong {
    font-weight: 500;
    text-align: right;
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

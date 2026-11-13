import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'

/**
 * Del kalkylen din.
 *
 * Hele tilstanden ligger i adressefeltet, så lenken er resultatet. Det er
 * dette som gjør verktøyet til noe folk sender videre – «se her, jeg tar 150
 * kroner for lite i timen» med en lenke som viser nøyaktig det.
 *
 * På telefon åpner vi systemets egen delingsmeny. På maskin kopierer vi
 * lenken. Finnes ingen av delene – eldre nettleser, eller en side servert
 * uten HTTPS – markerer vi teksten i stedet, så brukeren kan kopiere selv.
 * Knappen skal aldri være en knapp som ikke gjør noe.
 */

const Knappen = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.6rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderInverted};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.inkInverted};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentLight};
    color: ${({ theme }) => theme.colors.accentLight};
  }

  svg {
    width: 17px;
    height: 17px;
  }
`

const Hjelpetekst = styled.p`
  margin: 0.7rem 0 0;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  line-height: 1.5;
  word-break: break-all;
`

type Tilstand = 'klar' | 'kopiert' | 'manuell'

export default function Del({ tittel }: { tittel: string }) {
  const [tilstand, settTilstand] = useState<Tilstand>('klar')
  const [lenke, settLenke] = useState('')

  // «Kopiert» skal ikke bli stående for alltid.
  useEffect(() => {
    if (tilstand !== 'kopiert') return
    const id = window.setTimeout(() => settTilstand('klar'), 2500)
    return () => window.clearTimeout(id)
  }, [tilstand])

  const del = useCallback(async () => {
    const url = window.location.href
    settLenke(url)

    if (navigator.share) {
      try {
        await navigator.share({ title: tittel, url })
        return
      } catch {
        // Brukeren avbrøt, eller nettleseren nektet. Fall ned til kopiering.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      settTilstand('kopiert')
    } catch {
      // Ingen utklippstavle – vis lenken, så kan den merkes for hånd.
      settTilstand('manuell')
    }
  }, [tittel])

  return (
    <>
      <Knappen type="button" onClick={del}>
        <Icon navn={tilstand === 'kopiert' ? 'sjekk' : 'kopier'} />
        {tilstand === 'kopiert' ? 'Lenken er kopiert' : 'Del kalkylen din'}
      </Knappen>
      {tilstand === 'manuell' ? (
        <Hjelpetekst>
          Kopier lenken herfra: <span>{lenke}</span>
        </Hjelpetekst>
      ) : (
        <Hjelpetekst>Lenken inneholder tallene dine, så den viser akkurat denne kalkylen.</Hjelpetekst>
      )}
    </>
  )
}

import { Link, Navigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import MinSideRamme from './Ramme'
import Fristkalender from '../Frister/Fristkalender'
import Kalkulator from '../Timepris/Kalkulator'
import { Faktureringskalkulator } from '../Fakturere/FaktureringSide'
import { Ansattkalkulator } from '../Ansatt/AnsattSide'
import { STANDARD } from '../../../data/timepris'
import type { ReactNode } from 'react'

/**
 * Verktøyene, åpnet fra Min side: /min-side/verktoy/:slug.
 *
 * Samme kalkulatorer som på de offentlige sidene, men uten forklaringene,
 * spørsmålene og salgsteksten rundt – den innloggede har alt bestemt seg.
 * Man blir på Min side, med én vei tilbake, og lenkene fra Min side har
 * profilens svar ferdig utfylt i adressefeltet.
 */

interface Oppsett {
  tittel: string
  ingress: string
  /** Den offentlige siden, for den som vil lese mer. */
  offentlig: string
  innhold: ReactNode
}

const VERKTOY: Record<string, Oppsett> = {
  frister: {
    tittel: 'Fristkalender',
    ingress: 'Hver frist som gjelder bedriften din det neste året – og ett trykk for å få dem i kalenderen.',
    offentlig: '/frister',
    innhold: <Fristkalender />,
  },
  timepris: {
    tittel: 'Timepris',
    ingress: 'Hva du må ta i timen for at lønn, kostnader og ubetalt tid går opp.',
    offentlig: '/timepris',
    innhold: <Kalkulator standard={STANDARD} />,
  },
  fakturere: {
    tittel: 'Hva må du fakturere?',
    ingress: 'Omsetningen som dekker lønn og faste kostnader – og timene det betyr.',
    offentlig: '/hva-ma-du-fakturere',
    innhold: <Faktureringskalkulator />,
  },
  ansatt: {
    tittel: 'Hva koster en ansatt?',
    ingress: 'Full årskostnad med feriepenger, pensjon og arbeidsgiveravgift.',
    offentlig: '/hva-koster-en-ansatt',
    innhold: <Ansattkalkulator />,
  },
}

export default function VerktoySide() {
  const { slug = '' } = useParams()
  const v = VERKTOY[slug]
  if (!v) return <Navigate to="/min-side" replace />

  return (
    <MinSideRamme
      seoTittel={`${v.tittel} – Min side – Vimzo`}
      tittel={v.tittel}
      undertittel={
        <>
          {v.ingress} <Mer to={v.offentlig}>Slik regner vi</Mer>
        </>
      }
    >
      {v.innhold}
    </MinSideRamme>
  )
}

const Mer = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`

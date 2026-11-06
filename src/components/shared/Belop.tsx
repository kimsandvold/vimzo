import { Fragment } from 'react'
import styled from 'styled-components'
import { useTellendeTall } from '../../hooks/useTellendeTall'

/**
 * Et pengebeløp satt i mono.
 *
 * Mono-fonten gir hvert tegn samme bredde, også mellomrommet – så «14 900»
 * får et gap på full tegnbredde og leser som to tall. Her settes tusenskillet
 * som et smalt, tomt felt i stedet, slik at beløpet henger sammen visuelt.
 *
 * Tallet legges som `aria-label` på omslaget, så skjermlesere får det som ett
 * tall og ikke som to.
 *
 * Med `animert` teller beløpet seg fram når det endrer seg. Det brukes bare på
 * de store tallene i estimatet – et prisoverslag som regner seg fram leser som
 * levende, mens en hel side av tellende tall bare blir uro. `aria-label` følger
 * måltallet og ikke mellomstegene, så skjermlesere hører den endelige summen
 * én gang i stedet for femti ganger underveis.
 */
export default function Belop({ verdi, animert }: { verdi: number; animert?: boolean }) {
  const tellende = useTellendeTall(verdi, animert ? 420 : 0)
  const vist = animert ? tellende : verdi
  const grupper = String(Math.round(vist)).match(/\d{1,3}(?=(?:\d{3})*$)/g) ?? [String(vist)]

  return (
    <Tall aria-label={verdi.toLocaleString('nb-NO')}>
      {grupper.map((g, i) => (
        <Fragment key={i}>
          {i > 0 && <Skille aria-hidden="true" />}
          <span aria-hidden="true">{g}</span>
        </Fragment>
      ))}
    </Tall>
  )
}

const Tall = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const Skille = styled.span`
  display: inline-block;
  width: 0.26em;
`

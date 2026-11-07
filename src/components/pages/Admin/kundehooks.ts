import { useEffect, useRef, useState } from 'react'
import { lyttProsjekt, synkProsjekt } from '../../../lib/prosjekter'
import { markerLest } from '../../../lib/henvendelser'
import { prosjektFra, type Prosjekt } from '../../../data/prosjekt'
import type { Sak } from '../../../data/saker'

/** Prosjektet til en sak, levende. `undefined` mens det hentes, `null` når kunden ikke har tilgang. */
export function useProsjekt(id: string) {
  const [prosjekt, setProsjekt] = useState<Prosjekt | null | undefined>(undefined)
  useEffect(() => {
    let stopp = () => {}
    let aktiv = true
    lyttProsjekt(id, setProsjekt, () => setProsjekt(null)).then((s) => (aktiv ? (stopp = s) : s()))
    return () => {
      aktiv = false
      stopp()
    }
  }, [id])
  return prosjekt
}

/**
 * Hold kundens visning i takt med saken.
 *
 * Hver gang saken endres – status, beløp, drift – skrives de synlige feltene
 * til prosjektet. Bare når noe faktisk er forskjellig, så det ikke blir en
 * evig runddans av skrivinger.
 */
export function useSynk(sak: Sak, prosjekt: Prosjekt | null | undefined) {
  const sist = useRef('')
  useEffect(() => {
    if (!prosjekt) return
    const onsket = JSON.stringify(prosjektFra(sak))
    const naa = JSON.stringify({
      kundeEpost: prosjekt.kundeEpost,
      tittel: prosjekt.tittel,
      status: prosjekt.status,
      tidslinje: prosjekt.tidslinje,
      tilbud: prosjekt.tilbud,
      faktura: prosjekt.faktura,
      drift: prosjekt.drift,
    })
    if (onsket === naa || onsket === sist.current) return
    sist.current = onsket
    synkProsjekt(sak).catch((e) => console.error('Synk av kundevisningen feilet:', e))
  }, [sak, prosjekt])
}

/** Når du åpner en sak, regnes kundens meldinger som lest. */
export function useMarkerLest(sak: Sak, prosjekt: Prosjekt | null | undefined) {
  const ny = !!prosjekt?.sistKundemelding && (!sak.sistLest || prosjekt.sistKundemelding > sak.sistLest)
  useEffect(() => {
    if (ny) markerLest(sak.id).catch(() => {})
  }, [ny, sak.id])
}


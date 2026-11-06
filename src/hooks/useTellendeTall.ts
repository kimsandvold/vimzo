import { useEffect, useRef, useState } from 'react'

/**
 * Teller et tall fra der det sto til der det skal.
 *
 * Prisen er det eneste forsiden handler om, og før dette byttet den bare verdi
 * i stillhet når man klikket. Et tall som teller seg fram leser som at noe
 * regnes ut – og det er jo nettopp det som skjer.
 *
 * To detaljer gjør forskjellen. Animasjonen starter fra det som faktisk står
 * på skjermen, ikke fra forrige måltall, så den hopper ikke hvis man klikker
 * fort flere ganger. Og `prefers-reduced-motion` hopper rett til målet – et
 * tall som flimrer er et tilgjengelighetsproblem, ikke en effekt.
 *
 * Selve visningen må settes i tabulærsifre (det gjør `<Belop>`), ellers
 * endrer bredden seg for hver ramme og hele kortet rister.
 */
export function useTellendeTall(mal: number, varighet = 420): number {
  const [verdi, setVerdi] = useState(mal)
  /** Det som faktisk står på skjermen akkurat nå. */
  const vist = useRef(mal)
  const rammeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const fra = vist.current
    if (fra === mal) return

    const hopp = () => {
      vist.current = mal
      setVerdi(mal)
    }

    if (varighet <= 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      hopp()
      return
    }

    const start = performance.now()
    const tikk = (na: number) => {
      const t = Math.min(1, (na - start) / varighet)
      // easeOutCubic: raskt i gang, mykt i mål. Et lineært tall ser mekanisk ut.
      const ny = Math.round(fra + (mal - fra) * (1 - Math.pow(1 - t, 3)))
      vist.current = ny
      setVerdi(ny)
      if (t < 1) rammeRef.current = requestAnimationFrame(tikk)
    }

    rammeRef.current = requestAnimationFrame(tikk)
    return () => {
      if (rammeRef.current !== undefined) cancelAnimationFrame(rammeRef.current)
    }
  }, [mal, varighet])

  return verdi
}

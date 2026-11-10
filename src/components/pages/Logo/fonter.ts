import { useEffect, useState } from 'react'
import { createGlobalStyle } from 'styled-components'
import { FONTER, type FontId } from './merker'

/**
 * Logoskriftene, bare for logosidene.
 *
 * `@font-face` laster ingenting før en skrift faktisk brukes, så å legge alle
 * tolv inn her koster ingenting på forhånd. Resten av nettstedet får dem
 * aldri – denne stilen settes bare inn når en logoside vises.
 */
const regler = (Object.keys(FONTER) as FontId[])
  .flatMap((id) =>
    Object.entries(FONTER[id].filer).map(
      ([vekt, fil]) =>
        `@font-face { font-family: '${FONTER[id].familie}'; font-style: normal; font-weight: ${vekt}; font-display: swap; src: url(/fonts/logo/${fil}.woff2) format('woff2'); }`,
    ),
  )
  .join('\n')

export const LogoFonter = createGlobalStyle`${regler}`

/**
 * Logoene måles med canvas, og canvas måler med reserveskriften til den
 * ekte er lastet. Derfor ventes det på skriftene, og alt tegnes på nytt når
 * de er klare – ellers står navnet skjevt de første sekundene.
 */
export function useFonter() {
  const [klare, setKlare] = useState<boolean>(() => typeof document !== 'undefined' && !document.fonts)
  useEffect(() => {
    if (!document.fonts) return
    const lastinger = (Object.keys(FONTER) as FontId[]).flatMap((id) =>
      Object.keys(FONTER[id].filer).map((v) => document.fonts.load(`${v} 40px '${FONTER[id].familie}'`, 'ÆØÅ Aa')),
    )
    Promise.allSettled(lastinger).then(() => setKlare(true))
  }, [])
  return klare
}

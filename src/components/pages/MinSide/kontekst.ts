import { createContext, useContext } from 'react'
import type { Profil } from '../../../lib/profil'
import type { LagretDesign } from '../../../lib/logodesign'

/**
 * Det alle sidene på Min side deler: profilen og logoene.
 *
 * Rammen (Ramme.tsx) lytter én gang og gir det videre, så sidemenyen,
 * oversikten og undersidene viser det samme – og bytte av side ikke henter
 * alt på nytt.
 */
export interface MinSideData {
  /** `undefined` mens den hentes, `null` når den ikke er laget ennå. */
  profil: Profil | null | undefined
  logoer: LagretDesign[] | null
  logofeil: boolean
  lagre: (inn: Pick<Profil, 'person' | 'bedrift' | 'frister'>) => Promise<void>
}

export const MinSideKontekst = createContext<MinSideData | null>(null)

export function useMinSide(): MinSideData {
  const k = useContext(MinSideKontekst)
  if (!k) throw new Error('useMinSide brukes utenfor <MinSideRamme>')
  return k
}

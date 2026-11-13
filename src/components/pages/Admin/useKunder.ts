import { useEffect, useMemo, useState } from 'react'
import { lyttLogobestillinger, type Logobestilling } from '../../../lib/logobestillinger'
import { lyttAlleProfiler } from '../../../lib/profil'
import { slaSammen, type Kunde, type ProfilMedId } from '../../../lib/kunder'

/**
 * Alle kunder, levende: profilene og logobestillingene slått sammen.
 * `null` mens det hentes. Reglene slipper bare admin til begge samlingene.
 */
export function useKunder(): { kunder: Kunde[] | null; feil: Error | null } {
  const [profiler, setProfiler] = useState<ProfilMedId[] | null>(null)
  const [bestillinger, setBestillinger] = useState<Logobestilling[] | null>(null)
  const [feil, setFeil] = useState<Error | null>(null)

  useEffect(() => {
    let stopp: Array<() => void> = []
    let aktiv = true
    Promise.all([lyttAlleProfiler(setProfiler, setFeil), lyttLogobestillinger(setBestillinger, setFeil)]).then((s) =>
      aktiv ? (stopp = s) : s.forEach((f) => f()),
    )
    return () => {
      aktiv = false
      stopp.forEach((f) => f())
    }
  }, [])

  const kunder = useMemo(
    () => (profiler && bestillinger ? slaSammen(profiler, bestillinger) : null),
    [profiler, bestillinger],
  )
  return { kunder, feil }
}

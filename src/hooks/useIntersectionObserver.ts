import { useEffect, useRef, useState } from 'react'

/**
 * Enkel «kom til syne»-observatør. Brukes til at seksjoner siger inn når de
 * rulles fram. Observatøren kobles fra så snart elementet har vært synlig én
 * gang – en seksjon skal ikke animere på nytt hver gang man ruller forbi.
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [synlig, setSynlig] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSynlig(true)
        observer.unobserve(element)
      }
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.threshold, options.rootMargin])

  return [ref, synlig]
}

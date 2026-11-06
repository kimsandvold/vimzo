import { useEffect, useState } from 'react'

/**
 * Norids RDAP-tjeneste.
 *
 * Dette er registerets eget oppslag, og det er laget for maskiner: et REST-API
 * som svarer 404 når domenet er ledig og 200 når det er tatt. Det krever ingen
 * nøkkel, og – avgjørende her – det sender `Access-Control-Allow-Origin: *`.
 * Altså kan nettleseren spørre direkte, uten noe bak siden i det hele tatt.
 *
 * Vi bruker HEAD og ikke GET. Vi trenger bare statuskoden, HEAD har en mye
 * romsligere kvote (3000 mot 300 i døgnet), og vi slipper å laste ned
 * registreringsdata vi hverken viser eller har bruk for.
 *
 * Kvoten gjelder per IP, og kallet går fra den besøkendes nettleser – ikke fra
 * oss. Grensen er derfor per besøkende og i praksis ikke noe vi kan sprenge.
 *
 * Gjelder bare .no. Det er hele markedet vårt, og regexen under slipper
 * uansett ingenting annet gjennom.
 */
const RDAP = 'https://rdap.norid.no/domain/'

/**
 * Valgfri overstyring med `VITE_DOMENE_ENDPOINT`.
 *
 * Settes den, brukes den i stedet for Norid – f.eks. en registrars API hvis
 * vi en dag vil vise pris eller kunne bestille i samme slengen. Da forventes
 * svaret `{ "ledig": true }`.
 */
const EGET_ENDEPUNKT = import.meta.env.VITE_DOMENE_ENDPOINT as string | undefined

export type Domenestatus = 'tom' | 'ugyldig' | 'sjekker' | 'ledig' | 'opptatt' | 'feil'

const GYLDIG = /^[a-z0-9æøå](?:[a-z0-9æøå-]{0,61}[a-z0-9æøå])?\.no$/

/**
 * Sjekker om et .no-domene er ledig, med en liten forsinkelse så vi ikke
 * spør for hvert tastetrykk.
 *
 * Svaret er alltid «ledig akkurat nå» og aldri «reservert». Noen kan rekke å
 * registrere domenet mellom oppslaget og bestillingen, og et løfte vi ikke
 * kontrollerer er nøyaktig den typen løfte resten av denne siden unngår.
 */
export function useDomenesjekk(domene: string): Domenestatus {
  const reint = domene.trim().toLowerCase()

  /**
   * Alt som kan avgjøres uten nettverk, avgjøres under render – ikke i en
   * effekt. En effekt som setter state synkront tvinger fram en ekstra
   * render-runde for noe vi allerede vet svaret på.
   */
  const lokal: Domenestatus | null = !reint ? 'tom' : !GYLDIG.test(reint) ? 'ugyldig' : null

  /** Bare nettverkssvaret ligger i state, og det huskes sammen med domenet det gjaldt. */
  const [svar, setSvar] = useState<{ domene: string; status: Domenestatus } | null>(null)

  useEffect(() => {
    if (lokal !== null) return

    const avbryt = new AbortController()
    const timer = setTimeout(() => {
      const kall = EGET_ENDEPUNKT
        ? fetch(`${EGET_ENDEPUNKT}?domene=${encodeURIComponent(reint)}`, { signal: avbryt.signal })
            .then((r) => {
              if (!r.ok) throw new Error(String(r.status))
              return r.json() as Promise<{ ledig?: boolean }>
            })
            .then((d) => Boolean(d.ledig))
        : fetch(`${RDAP}${encodeURIComponent(reint)}`, {
            method: 'HEAD',
            signal: avbryt.signal,
          }).then((r) => {
            // 404 = ingen registrering funnet = ledig. 200 = tatt.
            if (r.status === 404) return true
            if (r.status === 200) return false
            // 429 og alt annet er «vi vet ikke», ikke «ledig».
            throw new Error(String(r.status))
          })

      kall
        .then((ledig) => setSvar({ domene: reint, status: ledig ? 'ledig' : 'opptatt' }))
        .catch(() => {
          // Avbrutt av neste tastetrykk er ikke en feil – da er et nytt kall alt i gang.
          if (!avbryt.signal.aborted) setSvar({ domene: reint, status: 'feil' })
        })
    }, 600)

    return () => {
      clearTimeout(timer)
      avbryt.abort()
    }
  }, [reint, lokal])

  if (lokal !== null) return lokal
  // Har vi ikke et svar for akkurat dette domenet ennå, er vi fortsatt i gang.
  return svar?.domene === reint ? svar.status : 'sjekker'
}

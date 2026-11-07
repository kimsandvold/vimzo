/**
 * Utsending av e-post gjennom EmailJS.
 *
 * Vi bruker REST-API-et deres med en vanlig `fetch`, ikke SDK-et. Det er med
 * vilje: SDK-et er et tredjeparts-script, og bunnteksten lover at siden ikke
 * har et eneste et. Et POST-kall laster ingen kode – det sender bare det
 * kunden selv har skrevet, i det øyeblikket hun trykker send.
 *
 * Er de tre variablene ikke satt, er `emailjsKlar` usann, og skjemaene faller
 * tilbake til å åpne en ferdig utfylt e-post. Ingenting later som det sender.
 *
 * Malen i EmailJS må bruke disse feltene (se `.env.example`):
 *   {{emne}} {{navn}} {{bedrift}} {{epost}} {{telefon}} {{melding}} {{brief}}
 * og sette «Reply To» til {{epost}}, så svaret går rett til kunden.
 */

const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined
const MAL = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined
const NOKKEL = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined

export const emailjsKlar = Boolean(SERVICE && MAL && NOKKEL)

export interface Henvendelse {
  emne: string
  navn: string
  bedrift: string
  epost: string
  telefon: string
  melding: string
  brief: string
}

export async function sendHenvendelse(henvendelse: Henvendelse): Promise<void> {
  if (!emailjsKlar) throw new Error('EmailJS er ikke satt opp')

  const svar = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE,
      template_id: MAL,
      user_id: NOKKEL,
      template_params: henvendelse,
    }),
  })
  if (!svar.ok) throw new Error(`EmailJS svarte ${svar.status}: ${await svar.text()}`)
}

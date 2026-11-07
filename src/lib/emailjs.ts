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
/**
 * Valgfri: malen for bekreftelsen til kunden. Er den satt, sendes den rett
 * etter at henvendelsen har gått gjennom. Bruker du i stedet «Auto-Reply» på
 * hovedmalen i EmailJS, skal denne stå tom – ellers får kunden to.
 */
const BEKREFTELSE = import.meta.env.VITE_EMAILJS_BEKREFTELSE_ID as string | undefined

export const emailjsKlar = Boolean(SERVICE && MAL && NOKKEL)

/** Sant når kunden får en bekreftelse på e-post – så kvitteringen kan si det. */
export const bekreftelseKlar = emailjsKlar && Boolean(import.meta.env.VITE_EMAILJS_BEKREFTELSE_ID)

export interface Henvendelse {
  emne: string
  navn: string
  bedrift: string
  epost: string
  telefon: string
  melding: string
  brief: string
}

/** Svarer ikke EmailJS innen dette, gir vi opp og viser feilmeldingen. */
const TIDSGRENSE_MS = 15_000

async function send(mal: string, henvendelse: Henvendelse): Promise<void> {
  const svar = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    signal: AbortSignal.timeout(TIDSGRENSE_MS),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE,
      template_id: mal,
      user_id: NOKKEL,
      template_params: henvendelse,
    }),
  })
  if (!svar.ok) throw new Error(`EmailJS svarte ${svar.status}: ${await svar.text()}`)
}

/**
 * Send henvendelsen til oss, og deretter en bekreftelse til kunden.
 *
 * Bare den første avgjør om skjemaet viser «sendt» eller «feil». Feiler
 * bekreftelsen, har vi likevel fått henvendelsen – da skal ikke kunden bli
 * bedt om å sende på nytt og gi oss den to ganger.
 */
export async function sendHenvendelse(henvendelse: Henvendelse): Promise<void> {
  if (!emailjsKlar) throw new Error('EmailJS er ikke satt opp')

  await send(MAL as string, henvendelse)

  if (BEKREFTELSE) {
    try {
      await send(BEKREFTELSE, henvendelse)
    } catch (feil) {
      console.error('Bekreftelsen til kunden ble ikke sendt:', feil)
    }
  }
}

/**
 * Leser et skjema til rene strenger: trimmet, og tomme felt som ''. Et navn
 * som bare består av mellomrom regnes som tomt – `required` alene slipper det
 * gjennom.
 */
export function lesSkjema(skjema: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = {}
  for (const [navn, verdi] of new FormData(skjema)) data[navn] = String(verdi).trim()
  return data
}

/**
 * Sant når robotfellen er fylt ut. Da later skjemaet som det sender – roboten
 * skal ikke merke noe, og et menneske hvis nettleser har autoutfylt feltet
 * ved en feil, skal ikke bli stående foran en knapp som ikke gjør noe.
 */
export const erRobot = (data: Record<string, string>) => Boolean(data.nettsted)

/**
 * Varsle Vimzo om noe som skjer på Min side – en ny melding, et godtatt
 * tilbud. Bruker hovedmalen, ikke bekreftelsen: dette skal til deg, ikke til
 * kunden. Feiler det, er det ingen skade skjedd – det står uansett i /admin.
 */
export async function varsleVimzo(varsel: Henvendelse): Promise<void> {
  if (!emailjsKlar) return
  try {
    await send(MAL as string, varsel)
  } catch (feil) {
    console.error('Varselet til Vimzo ble ikke sendt:', feil)
  }
}

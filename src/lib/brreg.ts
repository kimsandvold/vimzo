import type { Mvatermin, Selskapsform } from './frister'

/**
 * Oppslag i Enhetsregisteret (data.brreg.no).
 *
 * Åpent API uten nøkkel, og det svarer med `access-control-allow-origin: *`,
 * så nettleseren spør direkte. Ingenting går via oss, og ingenting lagres.
 *
 * Registeret vet ikke alt: det sier om bedriften er mva-registrert, men ikke
 * hvor ofte den leverer. Det vet heller ikke om eieren i et AS tar lønn.
 * Det vi henter, er et forslag brukeren kan overstyre.
 */

export interface Enhet {
  readonly orgnr: string
  readonly navn: string
  /** Kode fra registeret: ENK, AS, ASA, ANS, DA, NUF … */
  readonly formkode: string
  readonly formnavn: string
  /** `null` når formen ikke er en vi har regler for ennå. */
  readonly form: Selskapsform | null
  readonly mvaRegistrert: boolean
  readonly ansatte: number
  readonly kommune: string | null
  /** Forretningsadressen, eller postadressen når den mangler. */
  readonly adresse: string
  readonly postnr: string
  readonly poststed: string
  readonly telefon: string
  readonly epost: string
  readonly nettside: string
  readonly naering: string
}

export type Oppslag =
  | { ok: true; enhet: Enhet }
  | { ok: false; grunn: 'ugyldig' | 'finnes-ikke' | 'slettet' | 'nett' }

/** Fjerner mellomrom og sjekker modulus 11 – fanger de fleste tastefeil før vi spør. */
export function rensOrgnr(tekst: string): string | null {
  const nr = tekst.replace(/\s/g, '')
  if (!/^\d{9}$/.test(nr)) return null
  const vekter = [3, 2, 7, 6, 5, 4, 3, 2]
  const sum = vekter.reduce((s, v, i) => s + v * Number(nr[i]), 0)
  const rest = 11 - (sum % 11)
  const kontroll = rest === 11 ? 0 : rest
  if (kontroll === 10 || kontroll !== Number(nr[8])) return null
  return nr
}

function formFra(kode: string): Selskapsform | null {
  if (kode === 'ENK') return 'enk'
  if (kode === 'AS' || kode === 'ASA') return 'as'
  return null
}

interface Svar {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: { kode: string; beskrivelse: string }
  registrertIMvaregisteret?: boolean
  antallAnsatte?: number
  slettedato?: string
  forretningsadresse?: Adresse
  postadresse?: Adresse
  telefon?: string
  mobil?: string
  epostadresse?: string
  hjemmeside?: string
  naeringskode1?: { beskrivelse: string }
}

interface Adresse {
  adresse?: string[]
  postnummer?: string
  poststed?: string
  kommune?: string
}

/** «STAVANGER» → «Stavanger», «MO I RANA» → «Mo i Rana». */
export function stedsnavn(t: string): string {
  return t
    .toLowerCase()
    .split(/(\s|-)/)
    .map((ord) => (['i', 'på', 'og'].includes(ord) ? ord : ord.charAt(0).toUpperCase() + ord.slice(1)))
    .join('')
}

export async function slaOpp(tekst: string): Promise<Oppslag> {
  const orgnr = rensOrgnr(tekst)
  if (!orgnr) return { ok: false, grunn: 'ugyldig' }

  let svar: Response
  try {
    svar = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgnr}`, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    return { ok: false, grunn: 'nett' }
  }
  // 410 = slettet enhet; 404 = aldri registrert.
  if (svar.status === 410) return { ok: false, grunn: 'slettet' }
  if (svar.status === 404) return { ok: false, grunn: 'finnes-ikke' }
  if (!svar.ok) return { ok: false, grunn: 'nett' }

  const d = (await svar.json()) as Svar
  if (d.slettedato) return { ok: false, grunn: 'slettet' }

  const kode = d.organisasjonsform?.kode ?? ''
  const adr = d.forretningsadresse?.adresse?.length ? d.forretningsadresse : (d.postadresse ?? {})
  return {
    ok: true,
    enhet: {
      orgnr,
      navn: d.navn,
      formkode: kode,
      formnavn: d.organisasjonsform?.beskrivelse ?? kode,
      form: formFra(kode),
      mvaRegistrert: d.registrertIMvaregisteret === true,
      ansatte: d.antallAnsatte ?? 0,
      kommune: d.forretningsadresse?.kommune ?? null,
      adresse: (adr.adresse ?? []).join(', '),
      postnr: adr.postnummer ?? '',
      poststed: adr.poststed ? stedsnavn(adr.poststed) : '',
      telefon: d.telefon ?? d.mobil ?? '',
      epost: d.epostadresse ?? '',
      nettside: d.hjemmeside ?? '',
      naering: d.naeringskode1?.beskrivelse ?? '',
    },
  }
}

/** Det beste gjettet ut fra registeret. Brukeren kan endre alt. */
export function forslag(enhet: Enhet): { form: Selskapsform; mva: Mvatermin; lonn: boolean } {
  return {
    form: enhet.form ?? 'as',
    mva: enhet.mvaRegistrert ? 'tomaaned' : 'ingen',
    lonn: enhet.ansatte > 0 || enhet.form === 'as',
  }
}

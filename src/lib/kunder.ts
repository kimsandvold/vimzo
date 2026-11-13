import type { Logobestilling } from './logobestillinger'
import type { Profil } from './profil'

/**
 * Kundelisten i admin: profiler og logobestillinger slått sammen per konto.
 *
 * Profilen er det kunden selv har fylt inn, og den vinner. Mangler noe der –
 * eller finnes det ingen profil, fordi kunden bestilte før profilene kom –
 * fyller vi inn fra den nyeste bestillingen. Slik står det alltid nok til å
 * sende en faktura, også om e-posten med ordren er borte.
 */

export type ProfilMedId = Profil & { id: string }

export interface Kunde {
  uid: string
  profil: ProfilMedId | null
  /** Nyeste først. */
  bestillinger: Logobestilling[]
  navn: string
  bedrift: string
  orgnr: string
  /** Innloggingsadressen – den kontoen faktisk hører til. */
  epost: string
  /** Adressen kunden vil bli kontaktet på, hvis den er en annen. */
  kontaktEpost: string
  telefon: string
  adresse: string
  postnr: string
  poststed: string
  kontonummer: string
  /** Første spor av kunden: profilen eller den eldste bestillingen. */
  registrert: number
  /** Sum av bestillinger som ikke er kansellert, eks. mva. */
  omsetning: number
}

const forst = (...v: Array<string | undefined | null>) => v.find((x) => x && x.trim())?.trim() ?? ''

export function slaSammen(profiler: readonly ProfilMedId[], bestillinger: readonly Logobestilling[]): Kunde[] {
  const perUid = new Map<string, Logobestilling[]>()
  for (const b of bestillinger) {
    if (!b.uid) continue
    perUid.set(b.uid, [...(perUid.get(b.uid) ?? []), b])
  }
  const uider = new Set([...profiler.map((p) => p.id), ...perUid.keys()])
  const profilFor = new Map(profiler.map((p) => [p.id, p]))

  return [...uider]
    .map((uid): Kunde => {
      const p = profilFor.get(uid) ?? null
      const ordre = [...(perUid.get(uid) ?? [])].sort((a, b) => b.opprettet - a.opprettet)
      const o = ordre[0]
      const b = p?.bedrift
      const epost = forst(p?.konto?.epost, o?.epost, p?.person.epost)
      const kontakt = forst(p?.person.epost, b?.epost)
      return {
        uid,
        profil: p,
        bestillinger: ordre,
        navn: forst(p?.person.navn, o?.navn, p?.konto?.navn),
        bedrift: forst(b?.navn, o?.bedrift),
        orgnr: forst(b?.orgnr, o?.orgnr),
        epost,
        kontaktEpost: kontakt.toLowerCase() === epost.toLowerCase() ? '' : kontakt,
        telefon: forst(p?.person.telefon, b?.telefon, o?.telefon),
        adresse: forst(b?.adresse, o?.adresse),
        postnr: forst(b?.postnr, o?.postnr),
        poststed: forst(b?.poststed, o?.poststed),
        kontonummer: forst(b?.kontonummer),
        registrert: Math.min(
          p?.opprettet || Infinity,
          ...ordre.map((x) => x.opprettet || Infinity),
        ),
        omsetning: ordre.filter((x) => x.status !== 'kansellert').reduce((sum, x) => sum + x.pris, 0),
      }
    })
    .map((k) => ({ ...k, registrert: Number.isFinite(k.registrert) ? k.registrert : 0 }))
    .sort((a, b) => b.registrert - a.registrert)
}

/** Treffer søket i navn, bedrift, orgnr, e-post eller telefon? */
export function treffer(k: Kunde, sok: string): boolean {
  const q = sok.trim().toLowerCase()
  if (!q) return true
  const siffer = q.replace(/\s/g, '')
  return (
    [k.navn, k.bedrift, k.epost, k.kontaktEpost, k.poststed].some((f) => f.toLowerCase().includes(q)) ||
    (/^\d+$/.test(siffer) && [k.orgnr, k.telefon.replace(/\s/g, '')].some((f) => f.includes(siffer)))
  )
}

/** Fakturaopplysningene som én tekstblokk – for å lime inn i regnskapsprogrammet. */
export function fakturablokk(k: Kunde): string {
  return [
    k.bedrift || k.navn,
    k.orgnr && `Org.nr. ${k.orgnr}`,
    k.adresse,
    [k.postnr, k.poststed].filter(Boolean).join(' '),
    k.bedrift && k.navn && `Att: ${k.navn}`,
    k.epost,
    k.telefon,
  ]
    .filter(Boolean)
    .join('\n')
}

const csvFelt = (v: string | number) => {
  const t = String(v)
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/** Hele kundelisten som CSV (semikolon, slik norsk Excel vil ha det). */
export function somCsv(kunder: readonly Kunde[]): string {
  const hode = ['Navn', 'Bedrift', 'Org.nr.', 'E-post (konto)', 'Kontakt-e-post', 'Telefon', 'Adresse', 'Postnr.', 'Poststed', 'Kontonummer', 'Bestillinger', 'Omsetning eks. mva', 'Registrert', 'Konto-id']
  const rader = kunder.map((k) => [
    k.navn,
    k.bedrift,
    k.orgnr,
    k.epost,
    k.kontaktEpost,
    k.telefon,
    k.adresse,
    k.postnr,
    k.poststed,
    k.kontonummer,
    k.bestillinger.length,
    k.omsetning,
    k.registrert ? new Date(k.registrert).toISOString().slice(0, 10) : '',
    k.uid,
  ])
  return '﻿' + [hode, ...rader].map((r) => r.map(csvFelt).join(';')).join('\r\n')
}

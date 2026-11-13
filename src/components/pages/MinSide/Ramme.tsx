import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Arbeidsflate, Avatar, Firma, Gruppe, Hode, Lenke, Liste, Rutenett, Sidemeny } from '../../shared/Kontomeny'
import { KontoRamme } from '../Admin/felles'
import { useAdmin as useKonto } from '../Admin/kontekst'
import Icon, { type IkonNavn } from '../../shared/Icon'
import { formaterOrgnr, lagreProfil, lyttProfil, registrerKonto, type Profil } from '../../../lib/profil'
import { lyttMineDesign, velgStudiologo, type LagretDesign } from '../../../lib/logodesign'
import { MinSideKontekst, useMinSide, type MinSideData } from './kontekst'

/**
 * Rammen rundt alle sidene på Min side.
 *
 * Mønsteret folk kjenner fra banken, Fiken og Altinn: en fast sidemeny til
 * venstre med bedriften øverst, og arbeidsflaten til høyre på grå bakgrunn
 * med hvite kort. På mobil blir menyen en fanerad som kan rulles sidelengs.
 *
 * Rammen lytter på profilen og logoene én gang og deler dem via kontekst,
 * så det ikke hentes på nytt hver gang man bytter side.
 */

export default function MinSideRamme({
  tittel,
  undertittel,
  handling,
  seoTittel,
  ingress = 'Profilen, fristene, logoene og verktøyene dine – samlet på ett sted.',
  children,
}: {
  tittel: ReactNode
  undertittel?: ReactNode
  /** Knapp eller lenke helt til høyre i sidehodet. */
  handling?: ReactNode
  seoTittel: string
  /** Teksten på innloggingen, for den som kommer rett inn på en underside. */
  ingress?: string
  children: ReactNode
}) {
  return (
    <KontoRamme
      seoTittel={seoTittel}
      merke="Min side"
      ingress={ingress}
      hjem={{ til: '/min-side', tekst: 'Min side' }}
      tillatRegistrering
      lerret="sunken"
      bred
    >
      <Data>
        <Oppsett tittel={tittel} undertittel={undertittel} handling={handling}>
          {children}
        </Oppsett>
      </Data>
    </KontoRamme>
  )
}

function Data({ children }: { children: ReactNode }) {
  const { bruker } = useKonto()
  const [profil, settProfil] = useState<Profil | null | undefined>(undefined)
  const [logoer, settLogoer] = useState<LagretDesign[] | null>(null)
  const [logofeil, settLogofeil] = useState(false)

  useEffect(() => {
    let stopp: Array<() => void> = []
    let aktiv = true
    let registrert = false
    Promise.all([
      lyttProfil(
        bruker.uid,
        (p) => {
          settProfil(p)
          // Første innlogging: registrer kontoen med en gang, så admin finner
          // kunden igjen selv om profilen aldri fylles ut.
          if (p === null && !registrert) {
            registrert = true
            registrerKonto(bruker.uid).catch((e) => console.error('Kunne ikke registrere kontoen', e))
          }
        },
        (e) => {
          console.error(e)
          settProfil(null)
        },
      ),
      lyttMineDesign(bruker.uid, settLogoer, () => settLogofeil(true)),
    ]).then((s) => (aktiv ? (stopp = s) : s.forEach((f) => f())))
    return () => {
      aktiv = false
      stopp.forEach((f) => f())
    }
  }, [bruker.uid])

  const verdi = useMemo<MinSideData>(
    () => ({ profil, logoer, logofeil, lagre: (inn) => lagreProfil(bruker.uid, inn) }),
    [profil, logoer, logofeil, bruker.uid],
  )
  return <MinSideKontekst.Provider value={verdi}>{children}</MinSideKontekst.Provider>
}

/* ------------------------------------------------------------------ */
/* Oppsettet – sidemeny og arbeidsflate                                */
/* ------------------------------------------------------------------ */

interface Menypunkt {
  til: string
  navn: string
  ikon: IkonNavn
  /** Bare aktiv på nøyaktig denne adressen (Oversikt). */
  eksakt?: boolean
  /** Aktiv på alle adresser som starter med dette – studioet har én adresse per logo. */
  prefiks?: string
}

export function Oppsett({
  tittel,
  undertittel,
  handling,
  children,
}: {
  tittel: ReactNode
  undertittel?: ReactNode
  handling?: ReactNode
  children: ReactNode
}) {
  const { bruker } = useKonto()
  const { pathname } = useLocation()
  const { profil, logoer } = useMinSide()
  const bedrift = profil?.bedrift
  const studio = velgStudiologo(logoer)
  const visningsnavn = bedrift?.navn || profil?.person.navn || bruker.displayName || bruker.email || 'Min side'

  const hoved: Menypunkt[] = [
    { til: '/min-side', navn: 'Oversikt', ikon: 'panel', eksakt: true },
    { til: '/min-side/verktoy/frister', navn: 'Fristene', ikon: 'klokke' },
    { til: '/min-side/profil', navn: 'Profil', ikon: 'visittkort' },
    { til: '/min-side/logoer', navn: 'Logoer', ikon: 'penn' },
    { til: '/min-side/nettside', navn: 'Nettsiden', ikon: 'globus' },
  ]
  const verktoy: Menypunkt[] = [
    { til: '/min-side/verktoy/timepris', navn: 'Timepris', ikon: 'graf' },
    { til: '/min-side/verktoy/fakturere', navn: 'Hva må du fakturere?', ikon: 'dokument' },
    { til: '/min-side/verktoy/ansatt', navn: 'Hva koster en ansatt?', ikon: 'person' },
    {
      til: studio ? `/min-side/studio/${studio.id}` : '/logo',
      navn: 'Signatur og SoMe',
      ikon: 'epost',
      prefiks: '/min-side/studio',
    },
  ]

  return (
    <Rutenett>
      <Sidemeny aria-label="Min side">
        <Firma>
          <Avatar aria-hidden="true">{initialer(visningsnavn)}</Avatar>
          <div>
            <strong>{visningsnavn}</strong>
            <span>
              {bedrift?.orgnr
                ? `Org.nr. ${formaterOrgnr(bedrift.orgnr)}`
                : profil === undefined
                  ? ' '
                  : bedrift
                    ? 'Uten orgnummer'
                    : 'Privat'}
            </span>
          </div>
        </Firma>
        <Liste>
          {hoved.map((m) => (
            <li key={m.til}>
              <Lenke to={m.til} end={m.eksakt}>
                <Icon navn={m.ikon} storrelse={18} tykkelse={1.8} />
                {m.navn}
              </Lenke>
            </li>
          ))}
        </Liste>
        <Gruppe>Verktøy</Gruppe>
        <Liste>
          {verktoy.map((m) => (
            <li key={m.navn}>
              <Lenke
                to={m.til}
                className={({ isActive }) => (isActive || (m.prefiks && pathname.startsWith(m.prefiks)) ? 'active' : '')}
              >
                <Icon navn={m.ikon} storrelse={18} tykkelse={1.8} />
                {m.navn}
              </Lenke>
            </li>
          ))}
        </Liste>
      </Sidemeny>

      <Arbeidsflate>
        <Hode>
          <div>
            <h1>{tittel}</h1>
            {undertittel && <p>{undertittel}</p>}
          </div>
          {handling}
        </Hode>
        {children}
      </Arbeidsflate>
    </Rutenett>
  )
}

function initialer(navn: string): string {
  const ord = navn.replace(/\b(AS|ASA|ENK|DA|ANS)\b/g, '').trim().split(/\s+/).filter(Boolean)
  return ((ord[0]?.[0] ?? '') + (ord[1]?.[0] ?? '')).toUpperCase() || 'V'
}

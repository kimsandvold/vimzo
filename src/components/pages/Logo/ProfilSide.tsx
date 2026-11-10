import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useSEO } from '../../../hooks/useSEO'
import { hentLogobestilling } from '../../../lib/logobestillinger'
import Profil from './Profil'
import { Innlogging } from './Innlogging'
import { serialiser, useBruker } from './kjop'
import { LogoFonter, useFonter } from './fonter'
import { dekod, kod, lesLokalt, type Lagret } from './lagring'
import type { Design, Innhold } from './motor'

/**
 * Profilsiden: den visuelle profilen som én ren side – en liten merkevare-
 * bok, ikke en del av nettstedet. Ingen meny, ingen fot, bare logoen og
 * reglene for den.
 *
 * Designet kommer fra adressen (`?d=…`, så siden kan deles), fra en
 * bestilling (`/logo/profil/:id`) eller fra det kunden sist jobbet med.
 * Alt er vannmerket til filene er bestilt.
 *
 * Rutene står i routes.ts, og App.tsx sin Ramme skjuler meny og fot her –
 * slik den gjør for `/eksempel`.
 */
export default function ProfilSide() {
  useSEO({
    title: 'Visuell profil – Vimzo',
    description: 'Den visuelle profilen din.',
    noindex: true,
  })
  const bruker = useBruker()
  useFonter()
  const [sok] = useSearchParams()
  const { id } = useParams()
  const fraLenke = useMemo(() => {
    const d = sok.get('d')
    return d ? dekod(d) : null
  }, [sok])
  const [fraBestilling, setFraBestilling] = useState<(Pick<Lagret, 'design' | 'innhold'> & { produkt: string }) | null>(
    null,
  )

  useEffect(() => {
    if (!id || !bruker) return
    let aktiv = true
    hentLogobestilling(id)
      .then((b) => {
        if (!aktiv || !b) return
        const o = JSON.parse(b.design) as { design: Design; innhold: Innhold }
        const renset = dekod(kod(o))
        if (renset) setFraBestilling({ ...renset, produkt: b.produkt })
      })
      .catch((e) => console.error(e))
    return () => {
      aktiv = false
    }
  }, [id, bruker])

  if (bruker === undefined) return <Tom />
  if (!bruker)
    return (
      <Tom>
        <Innloggingsflate>
          <h1>Logg inn for å se profilen</h1>
          <Innlogging />
        </Innloggingsflate>
      </Tom>
    )

  const lokalt = lesLokalt(bruker.uid)
  const data = fraBestilling ?? fraLenke ?? lokalt
  // Uten vannmerke når profilen er kjøpt: en bestilling av «profil», eller det
  // lokale designet uendret siden det ble bestilt som profil.
  const kjopt =
    fraBestilling?.produkt === 'profil' ||
    Boolean(
      data &&
      lokalt?.bestilling?.produkt === 'profil' &&
      lokalt.bestilling.design === serialiser(data.design, data.innhold),
    )
  if (!data)
    return (
      <Tom>
        <Innloggingsflate>
          <h1>Ingen profil ennå</h1>
          <Lenke to="/logo">Lag en logo</Lenke>
        </Innloggingsflate>
      </Tom>
    )

  return (
    <>
      <LogoFonter />
      <div data-vannmerke={kjopt ? 'av' : undefined}>
        <Bok design={data.design} innhold={data.innhold} kjopt={kjopt} />
      </div>
    </>
  )
}

function Bok({ design, innhold, kjopt }: { design: Design; innhold: Innhold; kjopt: boolean }) {
  const lenke = kod({ design, innhold })
  return (
    <Side>
      <Linje>
        <Lenke to={`/logo?d=${lenke}`}>← Tilbake til editoren</Lenke>
        <Bestill to={`/logo?d=${lenke}&steg=bestill`}>{kjopt ? 'Last ned filene' : 'Bestill'}</Bestill>
      </Linje>
      <Innhold>
        <Skjult>Visuell profil for {innhold.navn.trim() || 'firmaet'}</Skjult>
        <Profil design={design} innhold={innhold} />
      </Innhold>
    </Side>
  )
}

/* ------------------------------------------------------------------- stiler */

const Side = styled.div`
  min-height: 100vh;
  background: #fff;
`

/** Overskriften for skjermlesere – arkene selv er bildet. */
const Skjult = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`

const Linje = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem clamp(1rem, 4vw, 2rem);
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Lenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
`

const Bestill = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  font-size: var(--fs-body);
  font-weight: 600;
  color: #fff;
  text-decoration: none;
`

const Innhold = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(0.75rem, 2vw, 1.5rem) clamp(0.75rem, 2vw, 1.5rem) 4rem;
`

const Tom = styled.div`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background: #fff;
`

const Innloggingsflate = styled.div`
  display: grid;
  gap: 1.5rem;
  width: min(100%, 400px);

  h1 {
    margin: 0;
    font-size: var(--fs-title);
    letter-spacing: var(--ls-title);
  }
`

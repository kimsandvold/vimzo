import { useAdmin as useKonto } from '../Admin/kontekst'
import { Dempet } from '../Admin/felles'
import MinSideRamme from './Ramme'
import ProfilSeksjon from './Profil'
import { useMinSide } from './kontekst'

/** Min side → Profil: deg og bedriften, i ro eller under redigering. */
export default function ProfilSide() {
  return (
    <MinSideRamme
      seoTittel="Profil – Min side – Vimzo"
      tittel="Profil"
      undertittel="Fylles inn én gang, og brukes i signaturen, fristkalenderen og på tilbud."
    >
      <Innhold />
    </MinSideRamme>
  )
}

function Innhold() {
  const { bruker } = useKonto()
  const { profil, lagre } = useMinSide()
  if (profil === undefined) return <Dempet>Henter profilen …</Dempet>
  return (
    <ProfilSeksjon
      profil={profil}
      forslagPerson={{ navn: bruker.displayName ?? '', epost: bruker.email ?? '' }}
      vedLagre={lagre}
    />
  )
}

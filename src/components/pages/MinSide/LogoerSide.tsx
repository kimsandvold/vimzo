import MinSideRamme from './Ramme'
import MineLogoer from './MineLogoer'
import { useMinSide } from './kontekst'

/** Min side → Logoer: utkast og kjøpte, med nedlasting og studio. */
export default function LogoerSide() {
  return (
    <MinSideRamme seoTittel="Logoer – Min side – Vimzo" tittel="Logoer" undertittel="Utkast og kjøpte logoer. Kjøpte kan lastes ned igjen når som helst.">
      <Innhold />
    </MinSideRamme>
  )
}

function Innhold() {
  const { logoer, logofeil } = useMinSide()
  return <MineLogoer liste={logoer} feil={logofeil} />
}

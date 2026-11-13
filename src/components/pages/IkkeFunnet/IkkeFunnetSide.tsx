import { useSEO } from '../../../hooks/useSEO'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import { Knapp } from '../../../ui'

export default function IkkeFunnetSide() {
  useSEO({
    title: 'Siden finnes ikke – Vimzo',
    description: 'Vi fant ikke siden du lette etter.',
    noindex: true,
  })

  return (
    <>
      <Sidehode
        motiv="sok"
        stikkord="404"
        tittel="Her var det tomt."
        ingress="Siden du lette etter finnes ikke – eller den har flyttet. Si fra, så retter vi lenken."
        handlinger={
          <>
            <Knapp til="/" variant="aksent">
              Til forsiden
            </Knapp>
            <Knapp til="/kontakt" variant="myk">
              Si fra om en død lenke
            </Knapp>
          </>
        }
      />
      <Avslutt />
    </>
  )
}

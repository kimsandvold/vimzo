import { useSEO } from '../../../hooks/useSEO'
import { organisasjon, nettsted, faqLd } from '../../../lib/jsonLd'
import { faq } from '../../../data/faq'
import Helt from '../../hjem/Helt'
import Inkludert from '../../hjem/Inkludert'
import Priser from '../../hjem/Priser'
import Verktoy from '../../hjem/Verktoy'
import Sporsmal from '../../hjem/Sporsmal'
import Avslutt from '../../hjem/Avslutt'

/**
 * Forsiden.
 *
 * Strategien er at siden selv er produktet: det første du møter er ikke en
 * beskrivelse av hva vi lager, men prisen på din egen nettside. Alt under er
 * svar på de tre spørsmålene som kommer etterpå – hva får jeg, hvor mye jobb
 * er det for meg, hva koster det.
 *
 * «Slik går det til»-seksjonen lå her og er fjernet. Den fortalte at kunden
 * tar en prat, vi lager siden, kunden sier ja – nøyaktig det «Du gjør»-lista
 * i Inkludert allerede sier, bare med tre kort rundt. Verre: den sa 30 min
 * der Inkludert sier én time. To tall for det samme, synlige samtidig.
 *
 * Flatene veksler lyst/hvitt med ett tonet felt rundt prisene og mørkt i
 * begge ender, så siden har en begynnelse og en slutt uten at vi må tegne
 * en eneste strek.
 */
export default function ForsideSide() {
  useSEO({
    title: 'Vimzo – nettsider laget for din bedrift, med åpne priser',
    description:
      'Se omtrent hva nettsiden din vil koste før du snakker med noen. Vi lager resten – ' +
      'domene, tekst, bilder og publisering – og du får fast pris skriftlig etter en prat. ' +
      'Håndlaget i Lillehammer.',
    jsonLd: [organisasjon(), nettsted(), faqLd(faq.slice(0, 6))],
  })

  return (
    <>
      <Helt />
      <Inkludert />
      <Priser />
      <Verktoy />
      <Sporsmal />
      <Avslutt />
    </>
  )
}

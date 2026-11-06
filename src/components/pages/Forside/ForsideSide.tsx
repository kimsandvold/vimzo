import { useSEO } from '../../../hooks/useSEO'
import { organisasjon, nettsted, faqLd } from '../../../lib/jsonLd'
import { faq } from '../../../data/faq'
import Helt from '../../hjem/Helt'
import Inkludert from '../../hjem/Inkludert'
import Steg from '../../hjem/Steg'
import Priser from '../../hjem/Priser'
import Verktoy from '../../hjem/Verktoy'
import Sporsmal from '../../hjem/Sporsmal'
import Avslutt from '../../hjem/Avslutt'

/**
 * Forsiden.
 *
 * Strategien er at siden selv er produktet: det første du møter er ikke en
 * beskrivelse av hva vi lager, men en nettside du bygger med ditt eget
 * firmanavn. Alt under er svar på de tre spørsmålene som kommer etterpå –
 * hva får jeg, hvor mye jobb er det for meg, hva koster det.
 *
 * Flatene veksler lyst/hvitt med ett tonet felt rundt prisene og mørkt i
 * begge ender, så siden har en begynnelse og en slutt uten at vi må tegne
 * en eneste strek.
 */
export default function ForsideSide() {
  useSEO({
    title: 'Vimzo – se hva nettsiden din koster, før du bestiller',
    description:
      'Fire spørsmål, så ser du prisen og hva som inngår. Vi lager resten: domene, tekst, ' +
      'bilder og publisering. Like god på mobil, nettbrett og PC. Fra 14 900 kr, ' +
      'deretter 349 kr/mnd.',
    jsonLd: [organisasjon(), nettsted(), faqLd(faq.slice(0, 6))],
  })

  return (
    <>
      <Helt />
      <Inkludert />
      <Steg />
      <Priser />
      <Verktoy />
      <Sporsmal />
      <Avslutt />
    </>
  )
}

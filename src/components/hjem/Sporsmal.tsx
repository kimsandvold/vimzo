import styled from 'styled-components'
import { Innsig, Knapp, Seksjon, Stikkord, Tittel, Wrap } from '../../ui'
import Sporsmalsliste from '../shared/Sporsmalsliste'
import { faq } from '../../data/faq'

/**
 * Spørsmålene. Tittelen til venstre, svarene til høyre – da får de luft uten
 * at seksjonen blir en vegg av tekst, og tittelkolonnen kan bli stående mens
 * man åpner svar.
 */
export default function Sporsmal() {
  return (
    <Seksjon id="faq">
      <Wrap>
        <Oppsett>
          <Innsig>
            <Venstre>
              <Stikkord>Spørsmål</Stikkord>
              <Tittel $niva="medium">Det folk pleier å lure på.</Tittel>
              <Knapp til="/kontakt" variant="myk">
                Spør om noe annet
              </Knapp>
            </Venstre>
          </Innsig>

          <Innsig forsinkelse={90}>
            <Sporsmalsliste sporsmal={faq.slice(0, 6)} />
          </Innsig>
        </Oppsett>
      </Wrap>
    </Seksjon>
  )
}

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Venstre = styled.div`
  position: sticky;
  top: 7rem;

  button,
  a {
    margin-top: 1.75rem;
  }

  @media (max-width: 900px) {
    position: static;
  }
`

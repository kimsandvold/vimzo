import styled from 'styled-components'
import { Hode, Innsig, Pil, Seksjon, Stikkord, Tittel, Wrap } from '../../ui'
import { verktoy } from '../../data/verktoy'

/**
 * Regneverktøyene, satt som en liste – ikke som kort.
 *
 * En liste med store, klikkbare rader leser raskere enn et rutenett av bokser, og den
 * tåler at vi legger til flere eksempler uten at gitteret blir rotete.
 * Bransjen står til venstre som en kolonne, så leseren finner sin egen med
 * øynene i stedet for å lese alle.
 */
export default function Verktoy() {
  return (
    <Seksjon $flate="surface" id="verktoy">
      <Wrap>
        <Innsig>
          <Hode>
            <div>
              <Stikkord>Regneverktøy · bygget for det du selger</Stikkord>
              <Tittel $niva="medium">La kunden regne ut prisen selv.</Tittel>
            </div>
            <Pil til="/logo">Prøv logoverktøyet gratis</Pil>
          </Hode>
        </Innsig>

        <Liste>
          {verktoy.map((v, i) => (
            <Innsig key={v.navn} forsinkelse={i * 50}>
              <Rad>
                <Bransje>{v.bransje}</Bransje>
                <Navn>{v.navn}</Navn>
              </Rad>
            </Innsig>
          ))}
        </Liste>
      </Wrap>
    </Seksjon>
  )
}

const Liste = styled.ul`
  list-style: none;
  /* Én hårfin skillelinje mellom rader er det eneste stedet på siden der en
     strek gjør jobben bedre enn luft. */
  box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.neutral[200]};
`

const Rad = styled.li`
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: baseline;
  padding: clamp(1.1rem, 2vw, 1.6rem) 0;
  box-shadow: inset 0 -1px 0 ${({ theme }) => theme.colors.neutral[200]};

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.3rem;
  }
`

const Bransje = styled.span`
  font-size: 0.85rem;
  font-weight: 550;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Navn = styled.span`
  /* Grotesk, ikke serif. Radnavn i displayserif leste som
     overskrifter stablet oppå hverandre – da betyr ikke serifen noe lenger. */
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1.15rem, 1.8vw, 1.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
`

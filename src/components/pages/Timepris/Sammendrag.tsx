import styled from 'styled-components'

/**
 * Svaret, klebet til toppen – men bare på smale skjermer.
 *
 * På maskin ligger resultatkortet ved siden av skjemaet og er alltid synlig.
 * På telefon faller det ned under et skjema som er flere skjermhøyder langt,
 * og da fyller man ut felt etter felt uten å se at tallet endrer seg. Hele
 * poenget med verktøyet forsvinner.
 *
 * Denne legger seg rett under navigasjonen mens man ruller gjennom skjemaet.
 * Kontaktknappen ligger nede til høyre, så de kommer ikke i veien for
 * hverandre.
 */

const Stripe = styled.div`
  display: none;

  @media (max-width: 1100px) {
    position: sticky;
    top: calc(var(--nav-hoyde) + 0.5rem);
    z-index: 5;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: 0.7rem 1rem;
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    background: ${({ theme }) => theme.colors.deep};
    color: ${({ theme }) => theme.colors.inkInverted};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`

const Etikett = styled.span`
  color: ${({ theme }) => theme.colors.accentLight};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  font-weight: 550;
  line-height: 1.3;
`

const Tall = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.title};
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

export default function Sammendrag({ etikett, tall }: { etikett: string; tall: string }) {
  return (
    <Stripe aria-hidden="true">
      <Etikett>{etikett}</Etikett>
      <Tall>{tall}</Tall>
    </Stripe>
  )
}

import styled from 'styled-components'

/**
 * Fallback mens en sidebit lastes ned. Den skal nesten aldri vises – sidene
 * forhåndslastes i `main.tsx` – så den er bevisst dempet i stedet for å være
 * en snurrende indikator som trekker blikket.
 */
const Boks = styled.div`
  min-height: 60svh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.08em;
`

export default function Laster() {
  return <Boks role="status">Laster …</Boks>
}

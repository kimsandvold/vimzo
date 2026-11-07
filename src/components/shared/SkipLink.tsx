import styled from 'styled-components'

/**
 * Hopp-til-innhold. Usynlig til den får tastaturfokus – da er den det første
 * en skjermleserbruker eller tastaturbruker møter.
 */
const Lenke = styled.a`
  position: absolute;
  left: 1rem;
  top: -4rem;
  z-index: ${({ theme }) => theme.zIndex.nav + 1};
  background: ${({ theme }) => theme.colors.accent};
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 0.9375rem;
  font-weight: 550;
  text-decoration: none;
  transition: top ${({ theme }) => theme.transitions.default};

  &:focus {
    top: 1rem;
  }
`

/**
 * Flytter fokus til hovedinnholdet, ikke bare rullingen. Ankeret alene
 * flyttet ikke fokus i en app som denne – neste Tab startet da på nytt
 * øverst i menyen, og lenken gjorde ingenting for den som trengte den.
 */
export default function SkipLink() {
  return (
    <Lenke
      href="#innhold"
      onClick={(e) => {
        const hoved = document.getElementById('innhold')
        if (!hoved) return
        e.preventDefault()
        hoved.focus()
        hoved.scrollIntoView()
      }}
    >
      Hopp til innhold
    </Lenke>
  )
}

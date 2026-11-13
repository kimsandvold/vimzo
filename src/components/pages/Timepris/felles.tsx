import styled from 'styled-components'
import { Link } from 'react-router-dom'

/**
 * Byggeklossene timeprissidene deler.
 *
 * Hovedsiden og de seks bransjesidene har samme form, men aldri samme tekst.
 * Det som er felles, er rammen – ikke innholdet.
 */

export const Kortsvar = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};
  padding: 1.4rem 1.6rem;
  border-left: 3px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0 ${({ theme }) => theme.borderRadius.medium} ${({ theme }) => theme.borderRadius.medium} 0;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.body};
    line-height: 1.6;
  }

  strong {
    font-weight: 650;
  }
`

export const Prosa = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};

  h2 {
    margin: 2.5rem 0 0.75rem;
    font-size: ${({ theme }) => theme.fontSizes.title};
    letter-spacing: -0.025em;
  }

  h3 {
    margin: 2rem 0 0.5rem;
    font-size: ${({ theme }) => theme.fontSizes.lead};
  }

  p {
    margin: 0 0 1rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.7;
  }

  ul {
    margin: 0 0 1rem;
    padding-left: 1.2rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.7;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-underline-offset: 3px;

    &:hover {
      color: ${({ theme }) => theme.colors.accentHover};
    }
  }
`

export const Bransjeliste = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.5rem;
`

export const Bransjelenke = styled(Link)`
  padding: 0.55rem 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.fontSizes.small};
  text-decoration: none;
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`

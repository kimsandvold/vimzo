import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

/**
 * Sidemenyen og arbeidsflaten for de innloggede områdene – Min side og admin.
 *
 * Én form for begge: fast meny til venstre med kontoen øverst, arbeidsflate
 * til høyre på grå bakgrunn. På mobil blir menyen en fanerad som kan rulles
 * sidelengs, og kontoboksen skjules.
 */

export const Rutenett = styled.div`
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }
`

export const Sidemeny = styled.nav`
  position: sticky;
  top: calc(64px + 1.5rem);
  display: grid;
  gap: 0.25rem;

  @media (max-width: 960px) {
    position: static;
    display: flex;
    gap: 0.25rem;
    margin: 0 calc(-1 * clamp(1rem, 3vw, 2rem));
    padding: 0 clamp(1rem, 3vw, 2rem) 0.25rem;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

export const Firma = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};

  div {
    display: grid;
    min-width: 0;
  }

  strong {
    overflow: hidden;
    font-size: var(--fs-small);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  div > span {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }

  @media (max-width: 960px) {
    display: none;
  }
`

export const Avatar = styled.span`
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: var(--fs-small);
  font-weight: 600;
  letter-spacing: 0.02em;
`

export const Liste = styled.ul`
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 960px) {
    display: contents;

    li {
      flex: none;
    }
  }
`

export const Gruppe = styled.p`
  margin: 1.25rem 0 0.35rem;
  padding: 0 0.75rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: var(--fs-micro);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: 960px) {
    display: none;
  }
`

export const Lenke = styled(NavLink)`
  display: flex;
  gap: 0.7rem;
  align-items: center;
  min-height: 40px;
  padding: 0 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: var(--fs-small);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default};

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: ${({ theme }) => theme.colors.ink};
  }

  &.active {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};
    box-shadow: ${({ theme }) => theme.shadows.xs};

    svg {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  @media (max-width: 960px) {
    min-height: 38px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.surface};

    &.active {
      border-color: ${({ theme }) => theme.colors.accent};
      background: ${({ theme }) => theme.colors.accentSoft};
      color: ${({ theme }) => theme.colors.accentInk};
      box-shadow: none;
    }
  }
`

export const Arbeidsflate = styled.div`
  min-width: 0;
`

export const Hode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: var(--ls-title);
  }

  p {
    margin: 0.25rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
  }
`

/** Antall som venter, helt til høyre i et menypunkt. */
export const Teller = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.35rem;
  height: 1.35rem;
  margin-left: auto;
  padding: 0 0.35rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: var(--fs-micro);
  font-weight: 600;
`

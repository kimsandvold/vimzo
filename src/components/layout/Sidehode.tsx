import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Wrap } from '../../ui'
import Icon from '../shared/Icon'
import type { ReactNode } from 'react'

export interface Smule {
  navn: string
  sti?: string
}

/**
 * Sidehodet på undersidene.
 *
 * Mørkt, med samme aksentsky som forsidens helt – da kjenner man igjen
 * stedet, og navbaren står skarpt mot det. Tittelen er stor og smal
 * (12 tegn), ingressen står til høyre på brede skjermer. Ingen bokser,
 * ingen streker.
 */
export default function Sidehode({
  smuler = [],
  stikkord,
  tittel,
  ingress,
  handlinger,
  barn,
}: {
  smuler?: Smule[]
  stikkord?: string
  tittel: ReactNode
  ingress?: ReactNode
  handlinger?: ReactNode
  /** Fullbredde innhold nederst: faner, nøkkeltall, hurtiglenker. */
  barn?: ReactNode
}) {
  return (
    <Flate data-surface="dark">
      <Sky aria-hidden="true" />
      <Wrap>
        {smuler.length > 0 && (
          <Smuler aria-label="Brødsmuler">
            <ol>
              <li>
                <Link to="/">Forsiden</Link>
              </li>
              {smuler.map((s) => (
                <li key={s.navn}>
                  <Icon navn="pilHoyre" storrelse={12} tykkelse={2.2} />
                  {s.sti ? <Link to={s.sti}>{s.navn}</Link> : <span aria-current="page">{s.navn}</span>}
                </li>
              ))}
            </ol>
          </Smuler>
        )}

        <Gitter>
          <div>
            {stikkord && <Stikk>{stikkord}</Stikk>}
            <h1>{tittel}</h1>
          </div>
          {(ingress || handlinger) && (
            <Side>
              {ingress && <Ingress>{ingress}</Ingress>}
              {handlinger && <Handlinger>{handlinger}</Handlinger>}
            </Side>
          )}
        </Gitter>

        {barn && <Bunn>{barn}</Bunn>}
      </Wrap>
    </Flate>
  )
}

const Flate = styled.header`
  position: relative;
  overflow: hidden;
  margin-top: calc(-1 * var(--nav-hoyde));
  padding: calc(4.5rem + var(--nav-hoyde)) 0 clamp(3rem, 6vw, 5rem);
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};

  h1 {
    margin: 0;
    font-size: clamp(2.6rem, 5.4vw + 0.8rem, 4.8rem);
    font-weight: 700;
    line-height: 0.98;
    letter-spacing: -0.042em;
    max-width: 13ch;
    text-wrap: balance;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: calc(2.25rem + var(--nav-hoyde)) 0 2.75rem;
  }
`

const Sky = styled.div`
  position: absolute;
  top: -45%;
  right: -12%;
  width: 60vw;
  height: 60vw;
  max-width: 820px;
  max-height: 820px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(108, 92, 255, 0.45) 0%, rgba(108, 92, 255, 0) 62%);
  pointer-events: none;
`

const Smuler = styled.nav`
  position: relative;
  margin-bottom: clamp(2rem, 4vw, 3rem);

  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: rgba(251, 247, 240, 0.5);
  }

  a {
    color: rgba(251, 247, 240, 0.5);
    text-decoration: none;

    &:hover {
      color: #fff;
    }
  }
`

const Gitter = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 2rem 4rem;
  align-items: end;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Stikk = styled.p`
  margin-bottom: 1rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Side = styled.div``

const Ingress = styled.p`
  max-width: 44ch;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
`

const Bunn = styled.div`
  position: relative;
  margin-top: clamp(2.25rem, 4vw, 3.5rem);
`

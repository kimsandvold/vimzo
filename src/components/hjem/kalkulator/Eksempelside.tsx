import styled from 'styled-components'
import { EKSEMPLER } from '../../../data/eksempelsider'

/**
 * En liten nettside i prisruten – slik en side for denne bransjen kan se ut.
 *
 * Vimzo er nytt og har ennå få ferdige kundesider å vise. Da viser vi i
 * stedet hva den besøkende selv vil få, for sin egen bransje og med sitt
 * eget navn så snart det er skrevet inn. Den er merket «Eksempel», og ingen
 * av navnene er ekte kunder.
 *
 * Alt er CSS og tekst – ingen bilder å laste, og den skifter med en gang
 * man trykker på en annen bransje.
 */

export default function Eksempelside({ bransje, navn }: { bransje: string; navn: string }) {
  const e = EKSEMPLER[bransje] ?? EKSEMPLER.annet
  const firma = navn.trim() || e.navn

  return (
    <Ramme aria-label={`Eksempel på en nettside for ${firma}`} style={{ '--farge': e.farge } as React.CSSProperties}>
      <Merke>Eksempel</Merke>
      <Meny aria-hidden="true">
        <span className="logo">
          <i />
          {firma}
        </span>
        <span className="lenker">
          <i />
          <i />
          <i />
        </span>
      </Meny>
      <Helt>
        <strong>{e.tittel}</strong>
        <span>Fast pris og svar innen én arbeidsdag.</span>
        <em>{e.knapp}</em>
      </Helt>
      <Kort aria-hidden="true">
        {e.kort.map((k) => (
          <span key={k}>
            <i />
            {k}
          </span>
        ))}
      </Kort>
    </Ramme>
  )
}

const Ramme = styled.figure`
  position: relative;
  margin: 0 0 1.1rem;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-family: ${({ theme }) => theme.fonts.body};
  transition: border-color 0.3s;
`

const Merke = styled.figcaption`
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  z-index: 1;
  padding: 0.1rem 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: rgba(255, 255, 255, 0.92);
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.6875rem;
  font-weight: 500;
`

const Meny = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;

  .logo {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logo i {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 4px;
    background: var(--farge);
    transition: background 0.4s;
  }

  .lenker {
    display: flex;
    gap: 0.4rem;
    margin-right: 4.2rem;
  }

  .lenker i {
    width: 22px;
    height: 5px;
    border-radius: 3px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const Helt = styled.div`
  display: grid;
  justify-items: start;
  gap: 0.35rem;
  padding: 1rem 0.9rem 1.05rem;
  background: linear-gradient(135deg, var(--farge), color-mix(in srgb, var(--farge) 70%, #000));
  color: #fff;
  transition: background 0.4s;

  strong {
    max-width: 18ch;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  span {
    font-size: 0.6875rem;
    opacity: 0.85;
  }

  em {
    margin-top: 0.35rem;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: #fff;
    color: var(--farge);
    font-size: 0.6875rem;
    font-style: normal;
    font-weight: 600;
  }
`

const Kort = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
  padding: 0.6rem 0.8rem 0.75rem;

  span {
    display: grid;
    gap: 0.3rem;
    padding: 0.45rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    font-size: 0.625rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  i {
    height: 22px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--farge) 14%, #fff);
    transition: background 0.4s;
  }
`

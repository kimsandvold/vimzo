import styled from 'styled-components'

/**
 * Felles byggeklosser for Min side, så seksjonene ser ut som én side og
 * ikke som fire komponenter som tilfeldigvis står etter hverandre.
 *
 * Samme regler som resten av nettstedet: flate kort med hårfin kant, én
 * overskrift per seksjon, og typeskalaen fra GlobalStyles – ingen egne
 * størrelser.
 */

export const Blokk = styled.section`
  margin-top: 1rem;
`

export const BlokkHode = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }

  p {
    margin: 0.25rem 0 0;
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-small);
  }
`

export const Flate = styled.div`
  padding: clamp(1.1rem, 2vw, 1.5rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
`

/** Liten etikett over et kort: «DEG», «BEDRIFTEN». */
export const Etikett = styled.p`
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: var(--fs-micro);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

/** Tekstknapp med aksentfarge – «Endre», «Se alle». */
export const Tekstknapp = styled.button`
  padding: 0.35rem 0;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.accent};
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

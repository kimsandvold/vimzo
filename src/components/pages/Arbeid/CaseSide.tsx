import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, ORG_ID } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import IkkeFunnetSide from '../IkkeFunnet/IkkeFunnetSide'
import { cases } from '../../../data/cases'

export default function CaseSide() {
  const { slug } = useParams()
  const sak = cases.find((c) => c.slug === slug)

  if (!sak) return <IkkeFunnetSide />
  return <Sak sak={sak} />
}

function Sak({ sak }: { sak: (typeof cases)[number] }) {
  useSEO({
    title: `${sak.kunde} – ${sak.bransje} | Vimzo`,
    description: sak.oppdrag.slice(0, 155),
    jsonLd: [
      brodsmuler([
        { navn: 'Arbeid', sti: '/arbeid' },
        { navn: sak.kunde, sti: `/arbeid/${sak.slug}` },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: `${sak.kunde} – nettsted`,
        description: sak.oppdrag,
        dateCreated: sak.ar,
        url: sak.url,
        creator: { '@id': ORG_ID },
        about: sak.bransje,
      },
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Arbeid', sti: '/arbeid' }, { navn: sak.kunde }]}
        stikkord={`${sak.bransje} · ${sak.ar}`}
        tittel={sak.kunde}
        ingress={sak.oppdrag}
        barn={
          <Knapp href={sak.url} variant="aksent" ikon="pilHoyre">
            Besøk nettstedet
          </Knapp>
        }
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Oppsett>
            <Venstre>
              <h2>Hva vi bygde</h2>
              <Punkter>
                {sak.losning.map((l) => (
                  <li key={l}>
                    <Icon navn="sjekk" storrelse={16} tykkelse={2.4} />
                    <span>{l}</span>
                  </li>
                ))}
              </Punkter>
            </Venstre>

            <Hoyre>
              <h2>Tall</h2>
              <Tallkort>
                {sak.resultater.map((r) => (
                  <div key={r.etikett}>
                    <strong>{r.verdi}</strong>
                    <span>{r.etikett}</span>
                  </div>
                ))}
              </Tallkort>
              <Fotnote>
                Vi publiserer bare tall vi har målt selv, og aldri anslag på hva en nettside har
                «ført til» i omsetning.
              </Fotnote>
            </Hoyre>
          </Oppsett>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.9fr);
  gap: 3.5rem;
  align-items: start;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 1.25rem;
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
`

const Venstre = styled.div``

const Punkter = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  list-style: none;

  li {
    display: flex;
    gap: 0.75rem;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.6;
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.35em;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Hoyre = styled.div``

const Tallkort = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  > div {
    padding: 1.35rem 1.5rem;
    border-radius: ${({ theme }) => theme.borderRadius.large};
    background: ${({ theme }) => theme.colors.deep};
    color: ${({ theme }) => theme.colors.inkInverted};
  }

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -0.045em;
    line-height: 1.1;
  }

  span {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Fotnote = styled.p`
  margin-top: 1.25rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

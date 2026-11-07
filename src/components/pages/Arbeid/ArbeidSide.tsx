import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import { cases, casesNotat } from '../../../data/cases'

export default function ArbeidSide() {
  useSEO({
    title: 'Arbeid – prosjekter vi har levert | Vimzo',
    description:
      'Nettsider vi har bygget, med hva som faktisk ble levert og hvilke tall vi kan stå for. ' +
      'Ingen anslag og ingen pyntede skjermbilder.',
    jsonLd: [
      brodsmuler([{ navn: 'Arbeid', sti: '/arbeid' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Arbeid',
        description: 'Prosjekter levert av Vimzo.',
        hasPart: cases.map((c) => ({
          '@type': 'CreativeWork',
          name: c.kunde,
          url: `https://vimzo.no/arbeid/${c.slug}`,
          about: c.bransje,
          dateCreated: c.ar,
        })),
      },
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Arbeid' }]}
        stikkord="Arbeid"
        tittel="Prosjekter, vist som de faktisk er"
        ingress="Her står bare sider vi har levert, og bare tall vi har målt selv. Et kort referansegalleri er mindre skadelig enn et langt som ikke holder vann."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Liste>
            {cases.map((c) => (
              <Kort key={c.slug} to={`/arbeid/${c.slug}`} $aksent={c.aksent}>
                <Topp>
                  <Meta>
                    <span>{c.bransje}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.ar}</span>
                  </Meta>
                  <h2>{c.kunde}</h2>
                  <p>{c.oppdrag}</p>
                </Topp>

                <Tall>
                  {c.resultater.map((r) => (
                    <div key={r.etikett}>
                      <strong>{r.verdi}</strong>
                      <span>{r.etikett}</span>
                    </div>
                  ))}
                </Tall>

                <Bunn>
                  <span>Les hele saken</span>
                  <Icon navn="pilHoyre" storrelse={17} tykkelse={1.9} />
                </Bunn>
              </Kort>
            ))}
          </Liste>

          <Notat>{casesNotat}</Notat>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Skal ditt prosjekt stå her neste gang?"
        tekst="Fortell kort hva bedriften gjør, så sier vi hva vi ville bygget – og hva det ville kostet."
      />
    </>
  )
}

const Liste = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: 1.5rem;
`

const Kort = styled(Link)<{ $aksent: string }>`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.paper};
  text-decoration: none;
  color: inherit;
  transition:
    border-color ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.soft},
    transform ${({ theme }) => theme.transitions.soft};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-3px);
  }
`

const Topp = styled.div`
  h2 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Meta = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle} !important;
`

const Tall = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  margin: 1.75rem 0;
  padding: 1.25rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.04em;
  }

  span {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    max-width: 18ch;
  }
`

const Bunn = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  font-size: 0.9375rem;
  font-weight: 550;
  color: ${({ theme }) => theme.colors.accent};
`

const Notat = styled.p`
  margin-top: 2rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, ORG_ID } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import { guider } from '../../../data/guider'

/** Norsk datoformat uten klokkeslett – «14. oktober 2026». */
function visDato(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GuiderSide() {
  useSEO({
    title: 'Guider – nettsider, SEO og AI-synlighet | Vimzo',
    description:
      'Fagartikler om hva en nettside koster, hvordan du blir synlig i ChatGPT og Google AI, og ' +
      'når WordPress er riktig valg. Skrevet for små og mellomstore bedrifter.',
    jsonLd: [
      brodsmuler([{ navn: 'Guider', sti: '/guider' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Vimzo-guider',
        description: 'Fagartikler om nettsider, søk og synlighet for små og mellomstore bedrifter.',
        inLanguage: 'nb-NO',
        publisher: { '@id': ORG_ID },
        blogPost: guider.map((g) => ({
          '@type': 'BlogPosting',
          headline: g.tittel,
          description: g.ingress,
          datePublished: g.publisert,
          url: `https://vimzo.no/guider/${g.slug}`,
        })),
      },
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Guider' }]}
        stikkord="Guider"
        tittel="Det vi får spørsmål om, skrevet ned én gang"
        ingress="Ingen e-postliste, ingen nedlastbar PDF mot kontaktinfo. Bare svarene, så du kan ta et opplyst valg – også hvis du ender med å velge noen andre."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Liste>
            {guider.map((g) => (
              <Kort key={g.slug} to={`/guider/${g.slug}`}>
                <Meta>
                  <Kategori>{g.kategori}</Kategori>
                  <span>{visDato(g.publisert)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{g.lesetid} min</span>
                </Meta>
                <h2>{g.tittel}</h2>
                <p>{g.ingress}</p>
                <Les>
                  <span>Les guiden</span>
                  <Icon navn="pilHoyre" storrelse={17} tykkelse={1.9} />
                </Les>
              </Kort>
            ))}
          </Liste>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Står det noe her du vil ha hjelp til?"
        tekst="Vi gjør det vi skriver om. Ta kontakt, så sier vi ærlig fra om det er verdt pengene for akkurat din bedrift."
      />
    </>
  )
}

const Liste = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
`

const Kort = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.paper};
  text-decoration: none;
  color: inherit;
  transition:
    border-color ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.soft},
    transform ${({ theme }) => theme.transitions.soft};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
    margin-bottom: 1.5rem;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-3px);
  }
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Kategori = styled.span`
  padding: 0.22rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`

const Les = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  font-size: 0.9375rem;
  font-weight: 550;
  color: ${({ theme }) => theme.colors.accent};
`

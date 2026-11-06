import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, tjenesteLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import { tjenester } from '../../../data/tjenester'

/**
 * Alle tjenestene på én side, med anker per tjeneste.
 *
 * Valget om én side framfor åtte er bevisst: hver enkelt tjeneste har ikke nok
 * eget innhold til å fortjene en egen URL, og åtte tynne sider konkurrerer med
 * hverandre i søk i stedet for å løfte hverandre. Hver tjeneste publiseres
 * likevel som sin egen `Service` i strukturerte data.
 */
export default function TjenesterSide() {
  const { hash } = useLocation()

  useSEO({
    title: 'Tjenester – nettside, SEO, AI-synlighet, foto | Vimzo',
    description:
      'Håndkodet nettside, forhåndsrendring, teknisk SEO, synlighet i AI-assistenter, innhold, ' +
      'foto og dronevideo, verktøy og drift. Se nøyaktig hva som inngår i hver tjeneste.',
    jsonLd: [
      brodsmuler([{ navn: 'Tjenester', sti: '/tjenester' }]),
      ...tjenester.map(tjenesteLd),
    ],
  })

  // useSEO ruller til toppen ved sidebytte. Kommer man inn på /tjenester#seo,
  // må vi hoppe videre til ankeret etterpå – ellers lander man alltid øverst.
  useEffect(() => {
    if (!hash) return
    const mal = document.getElementById(hash.slice(1))
    if (mal) requestAnimationFrame(() => mal.scrollIntoView({ block: 'start' }))
  }, [hash])

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Tjenester' }]}
        stikkord="Tjenester"
        tittel="Alt vi gjør, og nøyaktig hva som inngår"
        ingress="Du trenger ikke bestille alt. De fleste begynner med en side som virker, og legger til innhold og synlighet etter hvert som det lønner seg."
        barn={
          <Hurtiglenker>
            {tjenester.map((t) => (
              <a key={t.id} href={`#${t.id}`}>
                <Icon navn={t.ikon} storrelse={15} />
                {t.navn}
              </a>
            ))}
          </Hurtiglenker>
        }
      />

      {tjenester.map((t, i) => (
        <Seksjon key={t.id} id={t.id} $flate={i % 2 === 0 ? 'surface' : 'paper'} $tett>
          <Wrap>
            <Oppsett>
              <Venstre>
                <Ikonflate>
                  <Icon navn={t.ikon} storrelse={22} tykkelse={1.7} />
                </Ikonflate>
                <Nummer>{String(i + 1).padStart(2, '0')}</Nummer>
              </Venstre>

              <Midt>
                <h2>{t.navn}</h2>
                <Kort>{t.kort}</Kort>
                <p>{t.lang}</p>
              </Midt>

              <Hoyre>
                <h3>Dette inngår</h3>
                <ul>
                  {t.punkter.map((p) => (
                    <li key={p}>
                      <Icon navn="sjekk" storrelse={15} tykkelse={2.4} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Hoyre>
            </Oppsett>
          </Wrap>
        </Seksjon>
      ))}

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Bunnkort>
            <div>
              <h2>Usikker på hva du trenger?</h2>
              <p>
                Det vanligste er å starte med en side som virker, og legge til innhold og
                synlighet når den begynner å gi noe tilbake. Vi sier fra hvis du er i ferd med å
                kjøpe noe du ikke trenger ennå.
              </p>
            </div>
            <Knapp til="/priser" variant="aksent">
              Se priser og pakker
            </Knapp>
          </Bunnkort>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

const Hurtiglenker = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.9rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${({ theme }) => theme.colors.surface};
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    text-decoration: none;
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      color ${({ theme }) => theme.transitions.default};

    &:hover {
      border-color: ${({ theme }) => theme.colors.accent};
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
`

const Venstre = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 1000px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
`

const Ikonflate = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
`

const Nummer = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Midt = styled.div`
  h2 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    scroll-margin-top: 7rem;
  }

  p {
    font-size: 0.9875rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Kort = styled.p`
  margin: 0.75rem 0 1.1rem;
  font-size: ${({ theme }) => theme.fontSizes.md} !important;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink} !important;
`

const Hoyre = styled.div`
  padding: 1.5rem 1.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};

  h3 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin-bottom: 1.1rem;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    list-style: none;
  }

  li {
    display: flex;
    gap: 0.6rem;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.3em;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Bunnkort = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 0.6rem;
  }

  p {
    max-width: 62ch;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`

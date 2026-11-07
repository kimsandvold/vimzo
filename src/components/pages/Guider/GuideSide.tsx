import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { artikkelLd, brodsmuler } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import IkkeFunnetSide from '../IkkeFunnet/IkkeFunnetSide'
import { guider, type Blokk, type Guide } from '../../../data/guider'
import { firma } from '../../../data/firma'

/** Gjør overskriften om til en id som tåler å stå i en URL. */
function ankerId(tekst: string): string {
  return tekst
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function visDato(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GuideSide() {
  const { slug } = useParams()
  const guide = guider.find((g) => g.slug === slug)

  if (!guide) return <IkkeFunnetSide />
  return <Artikkel guide={guide} />
}

function Artikkel({ guide }: { guide: Guide }) {
  useSEO({
    // Merkenavnet bare når det er plass – Google kutter titler over ~60 tegn.
    title: guide.tittel.length > 55 ? guide.tittel : `${guide.tittel} | Vimzo`,
    description: guide.ingress,
    jsonLd: [
      brodsmuler([
        { navn: 'Guider', sti: '/guider' },
        { navn: guide.tittel, sti: `/guider/${guide.slug}` },
      ]),
      artikkelLd(guide),
    ],
  })

  const andre = guider.filter((g) => g.slug !== guide.slug)

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Guider', sti: '/guider' }, { navn: guide.kategori }]}
        stikkord={guide.kategori}
        tittel={guide.tittel}
        ingress={guide.ingress}
        barn={
          <Byline>
            <span>{firma.grunnlegger}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={guide.publisert}>{visDato(guide.publisert)}</time>
            <span aria-hidden="true">·</span>
            <span>{guide.lesetid} minutter</span>
          </Byline>
        }
      />

      <Brodtekst>
        <Wrap>
          <Oppsett>
            <Innhold>
              {/* Kortsvaret står før alt annet. Det er avsnittet en AI-assistent
                  helst siterer, og det eneste leseren trenger hvis hun har
                  dårlig tid. */}
              <Kortsvar>
                <h2>Kort svar</h2>
                <p>{guide.kortsvar}</p>
              </Kortsvar>

              {guide.seksjoner.map((s) => (
                <Bolk key={s.overskrift}>
                  <h2 id={ankerId(s.overskrift)}>{s.overskrift}</h2>
                  {s.innhold.map((b, i) => (
                    <Blokkvisning key={i} blokk={b} />
                  ))}
                </Bolk>
              ))}

              <Avslutningsnotat>
                <Icon navn="samtale" storrelse={18} />
                <p>
                  Spørsmål til noe av dette? Du får svar fra den som faktisk gjør jobben.{' '}
                  <Link to="/kontakt">Ta kontakt</Link>.
                </p>
              </Avslutningsnotat>
            </Innhold>

            <Sidespalte>
              <Innholdsfortegnelse aria-label="I denne guiden">
                <h2>I denne guiden</h2>
                <ol>
                  {guide.seksjoner.map((s) => (
                    <li key={s.overskrift}>
                      <a href={`#${ankerId(s.overskrift)}`}>{s.overskrift}</a>
                    </li>
                  ))}
                </ol>
              </Innholdsfortegnelse>

              {andre.length > 0 && (
                <Videre aria-label="Flere guider">
                  <h2>Flere guider</h2>
                  <ul>
                    {andre.map((g) => (
                      <li key={g.slug}>
                        <Link to={`/guider/${g.slug}`}>{g.tittel}</Link>
                      </li>
                    ))}
                  </ul>
                </Videre>
              )}
            </Sidespalte>
          </Oppsett>
        </Wrap>
      </Brodtekst>

      <Avslutt />
    </>
  )
}

/** Én blokk fra artikkeldataene, rendret som riktig HTML-element. */
function Blokkvisning({ blokk }: { blokk: Blokk }) {
  switch (blokk.type) {
    case 'p':
      return <p>{blokk.tekst}</p>
    case 'liste':
      return (
        <Punktliste>
          {blokk.punkter.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </Punktliste>
      )
    case 'nummerert':
      return (
        <Nummerliste>
          {blokk.punkter.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </Nummerliste>
      )
    case 'faktaboks':
      return (
        <Faktaboks>
          <h3>{blokk.tittel}</h3>
          <p>{blokk.tekst}</p>
        </Faktaboks>
      )
    case 'tabell':
      return (
        <Tabellramme tabIndex={0} role="region" aria-label={`Tabell: ${blokk.kolonner.filter(Boolean).join(', ')}`}>
          <table>
            <thead>
              <tr>
                {blokk.kolonner.map((k) => (
                  <th key={k || 'tom'} scope="col">
                    {k || <Skjult>Hva</Skjult>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blokk.rader.map((rad) => (
                <tr key={rad.join('|')}>
                  {rad.map((celle, i) => (
                    <td key={i}>{celle}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Tabellramme>
      )
  }
}

const Byline = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  /* Står på den mørke sidehode-flaten – inkSubtle ga 3,7:1 her. */
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Brodtekst = styled.article`
  padding: 4rem 0 5rem;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 0 3.5rem;
  }
`

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17rem;
  gap: 4rem;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
`

const Innhold = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.75;
    color: ${({ theme }) => theme.colors.ink};
    margin-bottom: 1.15rem;
  }
`

const Kortsvar = styled.div`
  padding: 1.6rem 1.75rem;
  margin-bottom: 3rem;
  border-left: 3px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0 ${({ theme }) => theme.borderRadius.medium} ${({ theme }) => theme.borderRadius.medium} 0;
  background: ${({ theme }) => theme.colors.accentSoft};

  h2 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkMuted};
    margin-bottom: 0.75rem;
  }

  p {
    margin-bottom: 0;
    color: ${({ theme }) => theme.colors.ink} !important;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
  }
`

const Bolk = styled.section`
  margin-bottom: 2.75rem;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 1.1rem;
    scroll-margin-top: 7rem;
  }
`

const Punktliste = styled.ul`
  margin: 0 0 1.35rem 1.1rem;

  li {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
    margin-bottom: 0.55rem;
    padding-left: 0.35rem;
  }

  li::marker {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Nummerliste = styled.ol`
  margin: 0 0 1.35rem 1.25rem;

  li {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
    margin-bottom: 0.55rem;
    padding-left: 0.35rem;
  }

  li::marker {
    font-family: ${({ theme }) => theme.fonts.mono};
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Faktaboks = styled.aside`
  padding: 1.4rem 1.6rem;
  margin: 1.75rem 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};

  h3 {
    font-size: 1rem;
    font-family: ${({ theme }) => theme.fonts.body};
    margin-bottom: 0.5rem;
  }

  p {
    margin-bottom: 0;
    font-size: 0.9375rem !important;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted} !important;
  }
`

/* Tabeller får rulle for seg selv – siden skal aldri rulle sidelengs. */
const Tabellramme = styled.div`
  overflow-x: auto;
  margin: 1.75rem 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    min-width: 34rem;
  }

  th,
  td {
    padding: 0.85rem 1.1rem;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  th {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    background: ${({ theme }) => theme.colors.sunken};
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  td:first-child {
    font-weight: 550;
  }
`

const Avslutningsnotat = styled.div`
  display: flex;
  gap: 0.85rem;
  padding: 1.35rem 1.5rem;
  margin-top: 3rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  svg {
    flex-shrink: 0;
    margin-top: 0.3em;
    color: ${({ theme }) => theme.colors.accent};
  }

  p {
    margin-bottom: 0;
    font-size: 0.9375rem !important;
    color: ${({ theme }) => theme.colors.inkMuted} !important;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Sidespalte = styled.aside`
  position: sticky;
  top: 6rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  h2 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin-bottom: 1rem;
  }

  @media (max-width: 1000px) {
    position: static;
  }
`

const Innholdsfortegnelse = styled.nav`
  ol {
    list-style: none;
    counter-reset: punkt;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  li {
    counter-increment: punkt;
    display: flex;
    gap: 0.6rem;
    font-size: 0.875rem;
    line-height: 1.45;
  }

  li::before {
    content: counter(punkt, decimal-leading-zero);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
    padding-top: 0.15em;
  }

  a {
    color: ${({ theme }) => theme.colors.inkMuted};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Videre = styled.nav`
  padding-top: 1.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  a {
    font-size: 0.875rem;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Skjult = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`

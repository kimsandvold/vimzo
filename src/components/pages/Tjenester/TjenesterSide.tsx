import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { Knapp, Seksjon, Stikkord, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, tjenesteLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import { prisFor, tjenester, type Gruppe, type Tjeneste } from '../../../data/tjenester'
import { formaterPris, formaterRamme, pakker } from '../../../data/pakker'

const inngar = tjenester.filter((t) => t.gruppe === 'inngar')
const tillegg = tjenester.filter((t) => t.gruppe === 'tillegg')

/**
 * Tjenestesiden: hva som inngår, og hva som koster ekstra.
 *
 * Den var ni like seksjoner etter hverandre før, hver med ikon, nummer og en
 * punktliste – og det var umulig å se hva som var inkludert og hva som ville
 * komme på regningen. Nå er det to rutenett med enkle kort, etter mønster av
 * fsnot.es: tittel, to setninger, ferdig. Detaljene ligger i en lukket
 * «Hva som inngår» på hvert kort, så de er der for den som vil lese – og for
 * søkemotorer og AI-assistenter, som leser dem uansett – uten å fylle siden.
 *
 * Fortsatt én side og ikke tolv: hver tjeneste har ikke nok innhold til en egen
 * URL, og tynne sider konkurrerer med hverandre i søk. Hver publiseres likevel
 * som sin egen `Service` i strukturerte data.
 */
export default function TjenesterSide() {
  const { hash } = useLocation()

  useSEO({
    title: 'Tjenester – hva som inngår i en nettside, og hva som koster ekstra | Vimzo',
    description:
      'Domene, design, tekster, Google-oppsett og drift inngår alltid. Foto, logo, kalkulator ' +
      'og 3D er tillegg med pris på forhånd. Endelig pris avtales etter en prat.',
    jsonLd: [brodsmuler([{ navn: 'Tjenester', sti: '/tjenester' }]), ...tjenester.map(tjenesteLd)],
  })

  // useSEO ruller til toppen ved sidebytte. Kommer man inn på /tjenester#foto,
  // må vi hoppe videre til ankeret etterpå – ellers lander man alltid øverst.
  useEffect(() => {
    if (!hash) return
    const mal = document.getElementById(hash.slice(1))
    if (!mal) return
    // Peker lenken på ett bestemt kort, åpner vi detaljene – det er dem man kom for.
    const detaljer = mal.tagName === 'ARTICLE' ? mal.querySelector('details') : null
    if (detaljer) detaljer.open = true
    requestAnimationFrame(() => mal.scrollIntoView({ block: 'start' }))
  }, [hash])

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Tjenester' }]}
        stikkord="Tjenester"
        tittel="Hva du får, og hva som koster ekstra"
        ingress="Det meste av det en liten bedrift trenger, er alltid med. Resten er tillegg – og du ser hva de koster før du tar kontakt."
      />

      <Seksjon id="inngar" $flate="surface" $tett>
        <Wrap>
          <Topp>
            <Stikkord>Inngår</Stikkord>
            <h2>Med i alle pakker</h2>
            <p>
              Dette er med uansett størrelse – en liten side lander typisk på{' '}
              {formaterRamme(pakker[0].pris)} kr. Det som er merket, kommer med fra Bedrift.
            </p>
          </Topp>
          <Rutenett>
            {inngar.map((t) => (
              <Tjenestekort key={t.id} tjeneste={t} />
            ))}
          </Rutenett>
        </Wrap>
      </Seksjon>

      <Seksjon id="tillegg" $flate="paper" $tett>
        <Wrap>
          <Topp>
            <Stikkord>Tillegg</Stikkord>
            <h2>Når du trenger mer</h2>
            <p>Prisen står på hvert tillegg. Der det står «fra», avhenger den av omfanget – du får den skriftlig før vi begynner.</p>
          </Topp>
          <Rutenett>
            {tillegg.map((t) => (
              <Tjenestekort key={t.id} tjeneste={t} />
            ))}
          </Rutenett>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Usikker>
            <h2>Usikker på hva du trenger?</h2>
            <p>
              De fleste begynner med en side som virker, og legger til mer når den gir noe tilbake.
              Vi sier fra hvis du er i ferd med å kjøpe noe du ikke trenger ennå.
            </p>
            <Knapp til="/priser" variant="aksent">
              Se pakker og priser
            </Knapp>
          </Usikker>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

function Tjenestekort({ tjeneste: t }: { tjeneste: Tjeneste }) {
  const priser = prisFor(t)
  return (
    <Kort id={t.id} $gruppe={t.gruppe}>
      {priser.length > 0 && (
        <Pris>
          {priser.map((p) => (
            <span key={p.navn}>
              {priser.length > 1 && <small>{p.navn} </small>}
              {p.fraPris && <small>fra </small>}
              {formaterPris(p.pris)} kr
              {p.enhet && <small> {p.enhet}</small>}
            </span>
          ))}
        </Pris>
      )}
      <h3>{t.navn}</h3>
      {t.merknad && <Merknad>{t.merknad}</Merknad>}
      <p>{t.tekst}</p>
      <Detaljer>
        <summary>Hva som inngår</summary>
        <ul>
          {t.punkter.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Detaljer>
    </Kort>
  )
}

/* ------------------------------------------------------------------ stil */

/** Sentrert stikkord, overskrift og én linje – som seksjonsinngangene på fsnot.es. */
const Topp = styled.div`
  max-width: 44rem;
  margin: 0 auto clamp(2rem, 4vw, 3rem);
  text-align: center;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  p {
    margin: 1rem auto 0;
    max-width: 52ch;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

/**
 * Ett kort per tjeneste. Ingen ikon, intet nummer – tittelen gjør jobben.
 *
 * Inngår-kortene ligger på en svak grå flate mot hvitt; tilleggene er hvite
 * mot papir. Forskjellen er liten med vilje: den skal skille de to gruppene
 * når man blar, ikke rangere dem.
 */
const Kort = styled.article<{ $gruppe: Gruppe }>`
  display: flex;
  flex-direction: column;
  padding: 1.6rem 1.6rem 1.3rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme, $gruppe }) => ($gruppe === 'inngar' ? theme.colors.paper : theme.colors.surface)};
  scroll-margin-top: calc(var(--nav-hoyde) + 1.5rem);

  h3 {
    margin: 0;
    font-size: 1.1875rem;
    font-weight: 650;
    line-height: 1.25;
    letter-spacing: -0.025em;
    color: ${({ theme }) => theme.colors.ink};
  }

  > p {
    flex: 1;
    margin: 0.6rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:target {
    border-color: ${({ theme }) => theme.colors.accentVivid};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
`

const Pris = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1rem;
  margin: 0 0 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.accentInk};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Merknad = styled.span`
  align-self: flex-start;
  margin-top: 0.5rem;
  padding: 0.2rem 0.55rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: 0.75rem;
  font-weight: 600;
`

/**
 * Detaljene, lukket som standard.
 *
 * `<details>` og ikke en React-bryter: innholdet står i HTML-en uansett, så
 * søkemotorer og AI-assistenter leser punktene selv om ingen åpner dem.
 */
const Detaljer = styled.details`
  margin-top: 1.1rem;
  padding-top: 0.9rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '+';
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1;
    }
  }

  &[open] summary::after {
    content: '–';
  }

  ul {
    display: grid;
    gap: 0.4rem;
    margin: 0.8rem 0 0;
    padding: 0 0 0 1.1rem;
  }

  li {
    font-size: 0.875rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Usikker = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  text-align: center;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: -0.03em;
  }

  p {
    margin: 0.75rem 0 1.5rem;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

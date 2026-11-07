import styled from 'styled-components'
import { Ingress, Innsig, Seksjon, Stikkord, Tittel, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, organisasjon } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Icon from '../../shared/Icon'
import Avslutt from '../../hjem/Avslutt'
import { firma } from '../../../data/firma'
import type { IkonNavn } from '../../shared/Icon'

const PRINSIPPER: Array<{ ikon: IkonNavn; tittel: string; tekst: string }> = [
  {
    ikon: 'dokument',
    tittel: 'Prisen står på nettsiden',
    tekst:
      'Vi legger prisene åpent ut. Det sparer deg for en telefon du ikke vil ta, og oss for et ' +
      'tilbud til noen som uansett skulle brukt en tredel.',
  },
  {
    ikon: 'skjold',
    tittel: 'Du eier alt når vi er ferdige',
    tekst:
      'Kildekode, domene og innhold står i ditt navn. Du kan flytte hele nettstedet til hvem ' +
      'som helst, når som helst, uten å spørre oss.',
  },
  {
    ikon: 'graf',
    tittel: 'Vi måler før vi sier oss fornøyd',
    tekst:
      'Lastetid, tilgjengelighet og Lighthouse måles før lansering, og du får rapporten. Ligger ' +
      'tallene under målet, retter vi det før siden går live.',
  },
  {
    ikon: 'samtale',
    tittel: 'Vi sier fra når du ikke trenger noe',
    tekst:
      'Den dyreste pakken er ikke riktig for alle. Trenger du bare tre sider som virker, sier vi ' +
      'det – selv om det er dårligere butikk for oss.',
  },
]

export default function OmSide() {
  useSEO({
    title: `Om Vimzo – ${firma.grunnlegger}, ${firma.grunnleggerTittel.toLowerCase()}`,
    description:
      'Vimzo lager håndkodede, forhåndsrendrede nettsider for små og mellomstore bedrifter. ' +
      `Drevet av ${firma.grunnlegger}, med åpne priser og fast pris etter en prat.`,
    jsonLd: [brodsmuler([{ navn: 'Om oss', sti: '/om' }]), organisasjon()],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Om oss' }]}
        stikkord="Om Vimzo"
        tittel="Én som koder, og som svarer på telefonen"
        ingress={`Vimzo drives av ${firma.grunnlegger}. Du snakker med den som faktisk bygger nettsiden – det er hele poenget med å være liten.`}
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Tospalte>
            <Tekst>
              <h2>Hvorfor Vimzo finnes</h2>
              <p>
                De fleste norske småbedrifter har en nettside de ikke er stolte av. Den er treg på
                mobil, den ble satt opp av en nevø i 2019, og ingen husker hvem som har passordet
                til hostingen. Samtidig betaler de et par tusen i måneden for et system de åpner to
                ganger i året.
              </p>
              <p>
                Det finnes en enklere måte. En nettside med ti sider trenger ikke en database, en
                serverpark og tolv plugins. Den trenger å være rask, tydelig, mulig å finne – og
                billig å eie i fem år.
              </p>
              <p>
                Så vi gjør det gammeldags og nytt på samme tid: håndkodet HTML, CSS og JavaScript,
                bygget ferdig før noen besøker siden og lagt ut som rene filer. Ingenting som ruster,
                ingenting som må oppdateres, og ingenting som står mellom innholdet ditt og den som
                leser det – enten det er et menneske eller en AI-assistent.
              </p>

              <h2>Hvordan vi jobber</h2>
              <p>
                Du får én kontaktperson gjennom hele prosjektet. Vi avtaler fast pris før vi
                begynner, og den står selv om arbeidet tar lengre tid enn vi trodde. Siden ligger
                på en testadresse du kan følge med på fra første dag, så du slipper å vente på én
                stor presentasjon til slutt.
              </p>
              <p>
                Innholdet skriver vi. Det er ikke fordi vi ikke stoler på deg, men fordi tekst som
                både leser godt og rangerer er et fag – og fordi en nettside som eieren skal fylle
                selv mellom alt annet, nesten alltid forfaller. Endrer noe seg hos deg, sier du fra,
                så retter vi det. Du betaler for tiden det faktisk tar – ingen abonnement på
                endringer du ikke bruker.
              </p>
            </Tekst>

            <Faktaboks>
              <h2>Kort om oss</h2>
              <dl>
                <div>
                  <dt>Drives av</dt>
                  <dd>
                    {firma.grunnlegger}
                    <small>{firma.grunnleggerTittel}</small>
                  </dd>
                </div>
                <div>
                  <dt>Jobber</dt>
                  <dd>Digitalt – på telefon, video og en testadresse du følger med på</dd>
                </div>
                <div>
                  <dt>Leverer til</dt>
                  <dd>{firma.dekningsomrade.join(' · ')}</dd>
                </div>
                {firma.orgNr && (
                  <div>
                    <dt>Org.nr</dt>
                    <dd>{firma.orgNr}</dd>
                  </div>
                )}
                <div>
                  <dt>Bygget med</dt>
                  <dd>HTML, CSS og JavaScript. Ikke WordPress.</dd>
                </div>
              </dl>
            </Faktaboks>
          </Tospalte>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="paper" $tett>
        <Wrap>
          <Innsig>
  <SeksjonsHode>
    <Stikkord>Slik driver vi</Stikkord>
    <Tittel>Fire ting vi ikke forhandler om</Tittel>
    <Ingress>Ingen av dem er oppsiktsvekkende. De er bare uvanlig nok i bransjen til at det er verdt å skrive dem ned.</Ingress>
  </SeksjonsHode>
</Innsig>
          <Prinsipper>
            {PRINSIPPER.map((p) => (
              <li key={p.tittel}>
                <Ikonflate>
                  <Icon navn={p.ikon} storrelse={20} tykkelse={1.7} />
                </Ikonflate>
                <h3>{p.tittel}</h3>
                <p>{p.tekst}</p>
              </li>
            ))}
          </Prinsipper>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Ta en prat før du bestemmer deg"
        tekst="Tredve minutter, ingen forpliktelser. Du får et ærlig svar på om vi er riktig leverandør for akkurat din bedrift."
      />
    </>
  )
}

const Tospalte = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.8fr);
  gap: 4rem;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
`

const Tekst = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 1.1rem;
  }

  h2:not(:first-child) {
    margin-top: 2.75rem;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.75;
    margin-bottom: 1.15rem;
  }
`

const Faktaboks = styled.div`
  position: sticky;
  top: 6rem;
  padding: 1.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};

  h2 {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin-bottom: 1.25rem;
  }

  dl {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  dt {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin-bottom: 0.2rem;
  }

  dd {
    font-size: 0.9375rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.ink};
  }

  small {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  @media (max-width: 1000px) {
    position: static;
  }
`

const Prinsipper = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
  gap: 1.25rem;
  list-style: none;

  li {
    padding: 1.75rem 1.6rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    background: ${({ theme }) => theme.colors.surface};
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1.0625rem;
    letter-spacing: -0.015em;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Ikonflate = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin-bottom: 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
`

const SeksjonsHode = styled.div`
  margin-bottom: clamp(2rem, 4vw, 3rem);
`

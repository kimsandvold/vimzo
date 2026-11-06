import styled, { css } from 'styled-components'
import { Hode, Innsig, Knapp, Pil, Seksjon, Tittel, Wrap } from '../../ui'
import Belop from '../shared/Belop'
import Icon from '../shared/Icon'
import { pakker, driftsnivaer, ANTALL_AVDRAG } from '../../data/pakker'

/**
 * Prisene. Månedsbeløpet står størst, fordi det er den summen en liten
 * bedrift vurderer mot resten av budsjettet – engangsprisen står rett under,
 * uten små skrift.
 *
 * Kortene har ingen kant. Det fremhevede løftes med skygge og et løft i
 * y-aksen i stedet, så raden leser som tre papirark der ett ligger øverst.
 */
export default function Priser() {
  return (
    <Seksjon $flate="tint" id="priser">
      <Wrap>
        <Innsig>
          <Hode>
            <div>
              <Tittel>Fast pris. Alt inkludert.</Tittel>
            </div>
            <Pil til="/priser">Alle priser og tillegg</Pil>
          </Hode>
        </Innsig>

        <Rad>
          {pakker.map((p, i) => (
            <Innsig key={p.id} forsinkelse={i * 80}>
              <Kort $fremhevet={!!p.fremhevet}>
                {p.fremhevet && <Merke>Mest valgt</Merke>}
                <Navn>{p.navn}</Navn>

                {p.manedspris === null || p.pris === null ? (
                  <>
                    <Pris>
                      <Avtale>Etter avtale</Avtale>
                    </Pris>
                    <Samlet>Omfanget avtaler vi, så får du fast pris skriftlig</Samlet>
                  </>
                ) : (
                  <>
                    <Pris>
                      <strong>
                        <Belop verdi={p.manedspris} />
                      </strong>
                      <span>kr/mnd</span>
                    </Pris>
                    <Samlet>
                      i {ANTALL_AVDRAG} mnd · 0 kr oppstart
                      <br />
                      eller <Belop verdi={p.pris} /> kr betalt på én gang
                    </Samlet>
                  </>
                )}


                <Punkter>
                  {p.punkter.map((punkt) => (
                    <li key={punkt}>
                      <Icon navn="sjekk" storrelse={14} tykkelse={2.6} />
                      {punkt}
                    </li>
                  ))}
                </Punkter>

                <Bunn>
                  <Knapp til="/kontakt" variant={p.fremhevet ? 'aksent' : 'myk'}>
                    Få tilbud
                  </Knapp>
                </Bunn>
              </Kort>
            </Innsig>
          ))}
        </Rad>

        <Innsig forsinkelse={240}>
          <Driftsrad>
            {driftsnivaer.map((d) => (
              <span key={d.id}>
                <strong>
                  <Belop verdi={d.pris} /> kr/mnd
                </strong>{' '}
                {d.navn.toLowerCase()}
              </span>
            ))}
            <span>Første års domene inkludert</span>
            <span>Ingen bindingstid</span>
          </Driftsrad>
        </Innsig>
      </Wrap>
    </Seksjon>
  )
}

const Rad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;

  /* Innsig-wrapperen må strekke seg, ellers blir ikke kortene like høye. */
  > * {
    height: 100%;
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Kort = styled.article<{ $fremhevet: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  /* Flatt og ugjennomsiktig, med en hårfin kant. Frosten og gjennomsikten
     som lå her før var enda et lag å se gjennom – kortene skal lese som
     rolige felt på sandflaten, ikke som ark som svever over den. */
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 7rem;

  ${({ $fremhevet, theme }) =>
    $fremhevet
      ? css`
          border-color: ${theme.colors.borderStrong};
          @media (min-width: 901px) {
            transform: translateY(-14px);
          }
        `
      : css`
          border-color: ${theme.colors.border};
        `}
`

const Merke = styled.span`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.3rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: 0.75rem;
  font-weight: 650;
`

const Navn = styled.h3`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Pris = styled.p`
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-top: 1rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(2.2rem, 3.4vw, 2.9rem);
    font-weight: 500;
    letter-spacing: -0.05em;
  }

  /* Direkte barn: ellers treffer regelen også spans inne i <Belop>,
     og beløpet arver småskriften i stedet for sin egen grad. */
  > span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`


/** Ord, ikke beløp – skal ikke arve mono og sifferstørrelse fra <Pris>. */
const Avtale = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  letter-spacing: -0.025em;
`

const Samlet = styled.p`
  margin-top: 0.3rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Punkter = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 1.75rem 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.925rem;
    font-weight: 500;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Bunn = styled.div`
  margin-top: auto;

  a {
    width: 100%;
  }
`

/** Driftsprisene som én rolig linje – de skal finnes, men ikke konkurrere. */
const Driftsrad = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 2rem;
  margin-top: clamp(2rem, 4vw, 3rem);
  font-size: 0.925rem;
  color: ${({ theme }) => theme.colors.inkMuted};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 500;
    color: ${({ theme }) => theme.colors.ink};
  }
`

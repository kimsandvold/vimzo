import styled from 'styled-components'
import { Innsig, Seksjon, Stikkord, Tittel, Wrap } from '../../ui'

/**
 * Tre steg, satt som en tidslinje der *din* innsats er markert.
 *
 * Poenget er ikke å forklare prosessen, men å vise hvor lite av den som
 * faller på kunden: to av tre bokser er våre, og den ene som er hans tar en
 * halvtime. Derfor har stegene en liten etikett som sier hvem som jobber.
 *
 * Steg 02 har bevisst ingen varighet. Hvor lang tid en side tar avhenger av
 * omfang, bilder og hvor fort vi får svar – en dato her ville vært gjetting,
 * og poenget med raden er uansett de to boksene som koster kunden tid.
 */
const STEG = [
  { nr: '01', hvem: 'Du', tittel: 'Tar en prat', tid: '30 min', din: true },
  { nr: '02', hvem: 'Vi', tittel: 'Lager alt sammen', tid: 'Etter avtale', din: false },
  { nr: '03', hvem: 'Du', tittel: 'Sier ja. Siden er live', tid: '1 time', din: true },
] as const

export default function Steg() {
  return (
    <Seksjon id="slik" $tett>
      <Wrap>
        <Innsig>
          <Topp>
            <Stikkord>Slik går det til</Stikkord>
            <Tittel $niva="medium">Tre steg. Du er med på to.</Tittel>
          </Topp>
        </Innsig>

        <Rad>
          {STEG.map((s, i) => (
            <Innsig key={s.nr} forsinkelse={i * 90}>
              <Boks $din={s.din}>
                <Hode>
                  <Nr>{s.nr}</Nr>
                  <Hvem $din={s.din}>{s.hvem}</Hvem>
                </Hode>
                <h3>{s.tittel}</h3>
                <Tid>{s.tid}</Tid>
              </Boks>
            </Innsig>
          ))}
        </Rad>
      </Wrap>
    </Seksjon>
  )
}

/* Eneste midtstilte seksjonen på siden. Bryter rytmen én gang, der de tre
   like kortene under uansett ber om symmetri. */
const Topp = styled.div`
  display: flex;
  flex-direction: column;
  /* Både align-items OG margin-inline trengs: det første sentrerer boksen i
     flex-raden, det andre fordi <Tittel> har egen max-width og ellers blir
     stående til venstre inni den sentrerte kolonnen. */
  align-items: center;
  text-align: center;
  margin-bottom: clamp(2rem, 4vw, 3rem);

  h2 {
    margin-inline: auto;
  }
`

const Rad = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  list-style: none;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Boks = styled.li<{ $din: boolean }>`
  height: 100%;
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme, $din }) => ($din ? theme.colors.sunken : theme.colors.surface)};
  box-shadow: ${({ theme, $din }) => ($din ? 'none' : theme.shadows.md)};

  h3 {
    margin-top: 1.5rem;
    /* Korttitler er grensesnitt, ikke overskrifter. */
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
`

const Hode = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Nr = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.neutral[400]};
`

/** Den lille etiketten som sier hvem som jobber. Aksent = din innsats. */
const Hvem = styled.span<{ $din: boolean }>`
  padding: 0.25rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  background: ${({ theme, $din }) => ($din ? theme.colors.accent : theme.colors.neutral[100])};
  color: ${({ theme, $din }) => ($din ? '#fff' : theme.colors.inkSubtle)};
`

const Tid = styled.p`
  margin-top: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

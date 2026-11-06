import styled from 'styled-components'
import Icon from '../shared/Icon'
import { trygghet } from '../../data/inkludert'
import { Wrap } from '../../ui'
import Kalkulator from './kalkulator/Kalkulator'

/**
 * Forsidens åpning.
 *
 * Én setning, og så får du regne. Vi forklarer ikke hva en nettside koster –
 * du finner det ut selv, på fire spørsmål, uten å oppgi e-post eller snakke
 * med en selger.
 *
 * Flaten er lys. Den var mørk før, med et vinterfoto under, og det så
 * håndlaget ut – men det så også ut som noe som ble laget i 2015. Et skjema
 * man skal fylle ut leser dessuten lettere på lyst. Den eneste mørke flaten
 * her er estimatkortet, og det er med vilje: det er det du skal se på.
 */
export default function Helt() {
  return (
    <Flate>
      <Glod aria-hidden="true" />
      <Bakglod aria-hidden="true" />
      <Innhold>
        <Topp>
          <h1>
            Se hva du får.
            <Uthevet>Og hva det koster.</Uthevet>
          </h1>
          <Sidelinje>
            Fire spørsmål, så står prisen på nettsiden din der – sammen med lista over hva som inngår.
            Ingen e-post, ingen selger, ingenting sendes før du vil.
          </Sidelinje>
        </Topp>

        <Kalkulator />

        <Loftene>
          {trygghet.map((t) => (
            <li key={t.tittel}>
              <Icon navn="sjekk" storrelse={14} tykkelse={3} />
              {t.tittel}
            </li>
          ))}
        </Loftene>
      </Innhold>
    </Flate>
  )
}

const Flate = styled.section`
  position: relative;
  overflow: hidden;
  margin-top: calc(-1 * var(--nav-hoyde));
  padding: calc(2.5rem + var(--nav-hoyde)) 0 clamp(3rem, 6vh, 5rem);
  /*
   * Her lå et rutenett en kort stund. Det ble fjernet: et flatt rutenett er
   * standardbakteppet på enhver SaaS-side, og et med perspektiv ville vært
   * verre – det daterer seg raskere enn noe annet på siden. Dybden kommer
   * fra lys i stedet, som ikke er et motiv man må forsvare.
   */
  background:
    radial-gradient(120% 90% at 85% 0%, rgba(91, 74, 232, 0.07) 0%, rgba(91, 74, 232, 0) 55%),
    linear-gradient(to bottom, #FFFFFF 0%, ${({ theme }) => theme.colors.paper} 60%);
  color: ${({ theme }) => theme.colors.ink};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: calc(1.5rem + var(--nav-hoyde)) 0 3rem;
  }
`

/**
 * Én kald indigo glød oppe til høyre.
 *
 * Den erstatter fotografiet og filmkornet som lå her før. Begge deler ga
 * flaten en nostalgisk tone som sto i veien for det siden faktisk er – et
 * verktøy. En enkelt, svak gradient gir dybde uten å datere noe, og den
 * koster null nettverkskall mot fotografiets 213 kB.
 */
const Glod = styled.div`
  position: absolute;
  top: -34vw;
  right: -14vw;
  width: 72vw;
  height: 72vw;
  max-width: 1000px;
  max-height: 1000px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: radial-gradient(circle, rgba(108, 92, 255, 0.15) 0%, rgba(108, 92, 255, 0.05) 45%, rgba(108, 92, 255, 0) 68%);
  pointer-events: none;
`

/**
 * Glød nummer to, bak estimatkortet.
 *
 * Kortet lå før som en svart firkant rett på hvitt papir. Denne legger en
 * svak indigo-pøl under det, så det ser ut til å ligge PÅ siden i stedet for
 * å være klippet ut av den. Den er større og svakere enn gløden over – den
 * skal kjennes, ikke ses.
 */
const Bakglod = styled.div`
  position: absolute;
  top: 18%;
  right: -6%;
  width: 58vw;
  height: 58vw;
  max-width: 900px;
  max-height: 900px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: radial-gradient(circle, rgba(91, 74, 232, 0.16) 0%, rgba(91, 74, 232, 0.05) 42%, rgba(91, 74, 232, 0) 66%);
  pointer-events: none;

  @media (max-width: 1040px) {
    display: none;
  }
`

const Innhold = styled(Wrap)`
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.heroInnhold};
`

/**
 * Overskrift og ingress.
 *
 * De sto ved siden av hverandre før, med ingressen helt ute til høyre. På en
 * bred skjerm ble det sju hundre piksler mellom dem, og da leser de som to
 * urelaterte blokker i stedet for som en setning og forklaringen på den.
 * Nå står ingressen under overskriften, der øyet allerede er.
 *
 * At høyre halvdel av raden blir stående tom er greit – det er den samme
 * asymmetrien som ellers på siden, og den store serifen tåler rommet.
 */
const Topp = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(1rem, 1.6vw, 1.6rem);
  margin-bottom: clamp(1.75rem, 3.5vh, 2.75rem);

  h1 {
    margin: 0;
    /* Egen grad, ikke 4xl: tittelen deler plass med kalkulatoren og må holde
       seg på to linjer, ellers havner estimatet under folden. */
    font-size: clamp(2.7rem, 4.5vw + 0.85rem, 5.2rem);
    font-weight: 700;
    line-height: 0.98;
    letter-spacing: -0.042em;
    max-width: 14ch;
  }

`

/**
 * Andre linje i tittelen.
 *
 * Den dype indigoen, ikke flatefargen. Flatefargen er laget for å ha hvit
 * tekst oppå seg, ikke for å være tekst selv – som overskrift på lerretet
 * ville den ligget for nær grensen til å være et trygt valg.
 */
const Uthevet = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.accent};
`

const Sidelinje = styled.p`
  max-width: 46ch;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

/**
 * De fire løftene, som et bånd under kalkulatoren.
 *
 * De gjør to jobber: tvilen møtes i samme øyekast som prisen, og båndet gir
 * helten en tydelig underkant i stedet for å tone ut i tomrom.
 */
const Loftene = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 2rem;
  margin: clamp(1.5rem, 3vh, 2.25rem) 0 0;
  padding: 0.95rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 550;
    letter-spacing: -0.01em;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0.55rem 1.25rem;
    padding: 0.9rem 1.15rem;
    border-radius: ${({ theme }) => theme.borderRadius.large};

    li {
      font-size: 0.8125rem;
    }
  }
`

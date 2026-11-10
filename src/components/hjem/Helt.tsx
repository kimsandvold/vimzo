import styled from 'styled-components'
import Icon from '../shared/Icon'
import { trygghet } from '../../data/inkludert'
import { Wrap } from '../../ui'
import Kalkulator from './kalkulator/Kalkulator'

/**
 * Forsidens åpning.
 *
 * Først hva Vimzo er – nettsider for små bedrifter – og så kalkulatoren.
 * Overskriften sa en stund bare «se hva det koster», og da var det ingenting
 * på forsiden som fortalte hva «det» var. Nå står både fagområdet og
 * målgruppen der før noe annet, også for søkemotorene.
 *
 * Flaten er lys. Den var mørk før, med et vinterfoto under, og det så
 * håndlaget ut – men det så også ut som noe som ble laget i 2015. Et skjema
 * man skal fylle ut leser dessuten lettere på lyst. Den eneste mørke flaten
 * her er estimatkortet, og det er med vilje: det er det du skal se på.
 */
export default function Helt() {
  return (
    <Flate>
      <Innhold>
        <Topp>
          <h1>
            Nettsider for små bedrifter.
            <Uthevet>Med åpne priser.</Uthevet>
          </h1>
          <Sidelinje>
            Vi lager hele nettsiden for deg – tekst, bilder, design og drift. Noen raske valg, så ser
            du hva din koster.
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
  /* Ingen overflow: hidden. Den holdt glødene inne før, men den gjorde også
     helten til en egen rulleflate – og da sluttet kalkulatorens knapperad å
     lime seg til bunnen av skjermen. */
  position: relative;
  margin-top: calc(-1 * var(--nav-hoyde));
  padding: calc(clamp(2.5rem, 6vh, 4.5rem) + var(--nav-hoyde)) 0 clamp(3rem, 6vh, 5rem);
  /*
   * Her lå et rutenett en kort stund. Det ble fjernet: et flatt rutenett er
   * standardbakteppet på enhver SaaS-side, og et med perspektiv ville vært
   * verre – det daterer seg raskere enn noe annet på siden.
   *
   * Gløden som erstattet det, er også borte. Flaten er ren hvit: tallet i
   * estimatkortet er det eneste som skal ha farge, og alt rundt det som
   * prøver å se pent ut, trekker øyet bort fra det.
   */
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: calc(2rem + var(--nav-hoyde)) 0 2.5rem;
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
    font-size: var(--fs-display);
    font-weight: 600;
    line-height: 1;
    letter-spacing: var(--ls-display);
    /* Bredt nok til at «Nettsider for små bedrifter.» står på én linje på
       en vanlig skjerm – to linjer totalt, så kalkulatoren holder seg oppe. */
    max-width: 20ch;
  }

`

/**
 * Andre linje i tittelen, i grått.
 *
 * Den sto i mettet indigo før, og to linjer i full styrke ved siden av
 * hverandre var det hardeste på hele siden. To toner av samme grafitt gir
 * samme rytme – påstand og løfte – uten at noe roper.
 */
const Uthevet = styled.span`
  display: block;
  /* #86868B er 3.6:1 mot hvitt – over kravet på 3:1 for så stor tekst,
     og lyst nok til at linja trer tilbake. */
  color: #86868b;
`

const Sidelinje = styled.p`
  max-width: 46ch;
  margin: 0;
  font-size: var(--fs-lead);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

/**
 * De fire løftene, som en stille rad under kalkulatoren.
 *
 * De lå i en hvit pille med kant før – én boks til på en side som allerede
 * hadde mange. Nå er det bare tekst over en hårstrek. Tvilen møtes i samme
 * øyekast som prisen, uten at raden konkurrerer med den.
 */
const Loftene = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 2.25rem;
  margin: clamp(2rem, 4vh, 3rem) 0 0;
  padding: 1.5rem 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--fs-small);
    font-weight: 500;
    letter-spacing: var(--ls-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.ink};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }
`

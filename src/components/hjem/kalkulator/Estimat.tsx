import styled from 'styled-components'
import Belop from '../../shared/Belop'
import Icon from '../../shared/Icon'
import { ANTALL_AVDRAG } from '../../../data/pakker'
import { foreslaDomene, type Estimat as EstimatData, type Svar } from '../../../data/kalkulator'

/**
 * Estimatet ved siden av kalkulatoren.
 *
 * Dette er hele løftet på forsiden: du skal se hva det koster og hva du får,
 * før du snakker med noen. Derfor står tallet størst, og derfor står lista
 * over hva som inngår rett under det – ikke på en annen side.
 *
 * To ting er bevisst holdt fra hverandre. Avdraget er det du betaler for å få
 * siden laget, og driften er det den koster å ha. Slår man dem sammen får man
 * et penere tall og en kunde som føler seg lurt i måned tretten.
 *
 * Flaten er den eneste mørke på forsiden. Den skal lese som en kvittering som
 * ligger over siden, ikke som enda en seksjon.
 */
export default function Estimat({
  estimat,
  svar,
  onSend,
}: {
  estimat: EstimatData
  svar: Svar
  onSend: () => void
}) {
  const betalte = estimat.tillegg.filter((t) => !t.dekket)
  const adresse = svar.domene.trim() || foreslaDomene(svar.navn) || 'hansen-ror.no'

  return (
    <Flate aria-live="polite">
      {/*
        Adresselinja gjør at kortet leser som en nettside.
        Uten den kunne hele helten vært en lånekalkulator – ingenting sa at
        dette handler om nettsider i det hele tatt. En URL er det mest
        gjenkjennelige bildet av en nettside som finnes, og vi spør allerede
        om domenet to felt lenger opp. Den skriver seg selv mens kunden
        fyller ut.
      */}
      <Adresselinje aria-hidden="true">
        <Prikker>
          <i />
          <i />
          <i />
        </Prikker>
        <Felt>
          <Icon navn="skjold" storrelse={11} tykkelse={2.4} />
          {adresse}
        </Felt>
      </Adresselinje>

      <Topp>
        <Stikkord>{svar.navn.trim() ? `Estimat for ${svar.navn.trim()}` : 'Ditt estimat'}</Stikkord>
        <Merke>{estimat.pakke.navn}</Merke>
      </Topp>

      {estimat.etterAvtale ? (
        <>
          <Avtale>Etter avtale</Avtale>
          <Under>Dette er for stort til en prisliste – vi tar en prat først.</Under>
        </>
      ) : (
        <>
          <Tall>
            {estimat.fraPris && <Fra>fra</Fra>}
            <strong>
              <Belop verdi={estimat.manedlig as number} animert />
            </strong>
            <span>kr/mnd</span>
          </Tall>
          <Under>i {ANTALL_AVDRAG} måneder · 0 kr i oppstart</Under>
        </>
      )}

      {/* Den viktigste linja på hele kortet. Avdraget stopper etter tolv
          måneder, og da er dette alt siden koster – lavere enn noe
          nettside-abonnement i Norge. Sto den nederst, leste den som en
          ekstra regning i stedet for som poenget. */}
      <Deretter>
        <Icon navn="pilNed" storrelse={14} tykkelse={2.5} />
        {estimat.etterAvtale ? 'Drift ' : 'Deretter '}
        <strong>
          <Belop verdi={estimat.drift.pris} /> kr/mnd
        </strong>
      </Deretter>

      {!estimat.etterAvtale && (
        <Under>
          eller {estimat.fraPris && 'fra '}
          <Belop verdi={estimat.engangs as number} animert /> kr betalt på én gang
        </Under>
      )}

      <Fakta>
        <li>
          <Icon navn="dokument" storrelse={14} tykkelse={2} />
          {estimat.omfang}
        </li>
        <li>
          <Icon navn="lyn" storrelse={14} tykkelse={2} />
          Rask levering
        </li>
        {/* Står her og ikke i punktlista, fordi Bedrift og Vekst viser «Alt i
            Start» i stedet for å gjenta den – og da ville løftet om mobil
            forsvunnet for de to pakkene folk flest havner i. */}
        <li>
          <Icon navn="enheter" storrelse={14} tykkelse={2} />
          Mobil, nettbrett og PC
        </li>
      </Fakta>

      <Avklaring>
        Når siden står ferdig, avtaler vi når vi har snakket sammen. Det kommer an på omfanget, om vi skal ut
        og ta bilder, og hvor fort vi får vite det vi trenger om bedriften din.
      </Avklaring>

      <Bolk>
        <Tittel>Dette inngår</Tittel>
        <Liste>
          {estimat.inkludert.map((punkt) => (
            <li key={punkt}>
              <Icon navn="sjekk" storrelse={13} tykkelse={3} />
              {punkt}
            </li>
          ))}
        </Liste>
      </Bolk>

      {estimat.tillegg.length > 0 && (
        <Bolk>
          <Tittel>Du har lagt til</Tittel>
          <Tilleggsliste>
            {estimat.tillegg.map((t) => (
              <li key={t.navn}>
                <span>{t.navn}</span>
                {t.dekket ? (
                  <Dekket>inngår</Dekket>
                ) : (
                  <Pris>
                    {t.fraPris && <Fradel>fra </Fradel>}
                    <Belop verdi={t.pris} /> kr
                  </Pris>
                )}
              </li>
            ))}
          </Tilleggsliste>
        </Bolk>
      )}

      {/* Totalen over tre år. Det eneste tallet som kan måles mot et
          abonnement, og det er her vi vinner. */}
      {estimat.treAr !== null && (
        <Drift>
          <span>Å eie siden i tre år</span>
          <strong>
            {estimat.fraPris && <Fradel>fra </Fradel>}
            <Belop verdi={estimat.treAr} animert /> kr
          </strong>
        </Drift>
      )}

      <Send type="button" onClick={onSend}>
        Få dette som fast pris
        <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
      </Send>

      <Note>
        {estimat.etterAvtale
          ? 'Jobber av denne størrelsen avtaler vi én og én, så du får et skriftlig tilbud med fast pris i stedet for et anslag herfra.'
          : estimat.fraPris
          ? 'Verktøy skreddersys, så både engangssummen og månedsprisen er fra-beløp. Det nøyaktige tallet avtaler vi når vi vet hva du trenger – og da står det skriftlig.'
          : betalte.length > 0
            ? 'Estimat, ikke tilbud. Du får prisen skriftlig før vi begynner, og da står den.'
            : 'Du får prisen skriftlig før vi begynner, og den står selv om jobben tar lengre tid.'}{' '}
        Alle beløp er eks. mva.
      </Note>
    </Flate>
  )
}

/**
 * Estimatet.
 *
 * Dette er nå den eneste flaten på forsiden som er et kort i det hele tatt.
 * Skjemaet mistet sitt, og det er hele poenget: når bare én av de to er et
 * objekt, slutter de å konkurrere, og øyet går dit det skal uten at vi må
 * gjøre spalten bredere.
 *
 * Større radius og en lang skygge, ikke fordi det er pent i seg selv, men
 * fordi kortet skal lese som noe som ligger OVER siden – en kvittering på
 * bordet – og ikke som enda en seksjon i flyten.
 */
const Flate = styled.aside`
  display: flex;
  flex-direction: column;
  padding: clamp(1.5rem, 2vw, 1.9rem);
  border-radius: ${({ theme }) => theme.borderRadius.xxl};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  /* Kantlys langs øvre kant. Ett piksel lys der flaten vender opp er det
     som skiller et objekt fra et hull – uten det leser kortet flatt. */
  box-shadow:
    ${({ theme }) => theme.shadows.svev},
    inset 0 1px 0 rgba(182, 169, 255, 0.22);

  /* Følger med når man blar gjennom stegene på en høy skjerm – tallet er det
     man ser etter, og det skal ikke rulle vekk. */
  position: sticky;
  top: calc(var(--nav-hoyde) + 1rem);

  @media (max-width: 1040px) {
    position: static;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.25rem;
  }
`

/**
 * Nettleserlinja på toppen av kortet.
 *
 * Holdt bevisst nøktern: tre prikker og et adressefelt, ingen knapper,
 * faner eller skygger. Den skal gi gjenkjennelse på et halvt sekund og så
 * komme seg ut av veien – det er tallet under som er innholdet.
 */
const Adresselinje = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: calc(-1 * clamp(1.5rem, 2vw, 1.9rem)) calc(-1 * clamp(1.5rem, 2vw, 1.9rem)) clamp(1.3rem, 2vw, 1.7rem);
  padding: 0.75rem clamp(1.5rem, 2vw, 1.9rem);
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderInverted};
  border-radius: ${({ theme }) => theme.borderRadius.xxl} ${({ theme }) => theme.borderRadius.xxl} 0 0;
  background: rgba(252, 252, 250, 0.045);
`

const Prikker = styled.span`
  display: inline-flex;
  gap: 0.3rem;
  flex-shrink: 0;

  i {
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.borderRadius.round};
    background: rgba(252, 252, 250, 0.18);
  }
`

/** Selve adressefeltet. Mono, fordi et domene er en adresse og ikke en tittel. */
const Felt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.3rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: rgba(252, 252, 250, 0.07);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(252, 252, 250, 0.62);

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accentLight};
    opacity: 0.8;
  }
`

const Topp = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
`

const Stikkord = styled.p`
  margin: 0;
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Merke = styled.span`
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: -0.01em;
`

/**
 * Beløpet. Settes i mono med stram sperring, fordi det er tallet hele siden
 * handler om – og fordi tabellsifre ikke hopper i bredden når det endrer seg
 * mens man klikker.
 */
const Tall = styled.p`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0;

  > strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(2.7rem, 5vw, 3.8rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.045em;
    color: ${({ theme }) => theme.colors.accentLight};
  }

  /* Direkte barn: ellers treffer regelen også spans inne i <Belop>, og
     beløpet arver småskriften i stedet for sin egen grad. */
  > span {
    font-size: 0.9375rem;
    font-weight: 550;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }
`

/**
 * «fra» foran beløpet.
 *
 * Det står inntil tallet og i samme grunnlinje, ikke som en fotnote – et
 * forbehold man må lete etter er ikke et forbehold.
 */
const Fra = styled.span`
  font-size: 1.1rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Fradel = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

/** Tallets plass når det ikke finnes et tall. Samme grad, så kortet ikke hopper. */
const Avtale = styled.p`
  margin: 0;
  font-size: clamp(2rem, 3.4vw, 2.6rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.accentLight};
`

const Under = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

/** Driften, løftet opp til tallet. Aksentfarget fordi den er gode nyheter. */
const Deretter = styled.p`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.7rem 0 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accentLight};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  svg {
    opacity: 0.75;
  }
`

const Fakta = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
  margin: 1.1rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(252, 252, 250, 0.82);
  }

  svg {
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

/**
 * Forbeholdet om tid.
 *
 * Det står her, like under «rask levering», og ikke med liten skrift nederst.
 * En side som selger fast pris har ikke råd til å gjemme det ene stedet den
 * faktisk tar forbehold – da mister resten av kortet troverdighet.
 */
const Avklaring = styled.p`
  margin: 0.8rem 0 0;
  /* Hele setninger – de følger prosagulvet på 14px, ikke etikettgulvet. */
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(252, 252, 250, 0.62);
`

const Bolk = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};
`

const Tittel = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Liste = styled.ul`
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.875rem;
    line-height: 1.45;
    color: rgba(252, 252, 250, 0.88);
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.3rem;
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const Tilleggsliste = styled.ul`
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.875rem;
    color: rgba(252, 252, 250, 0.88);
  }
`

const Pris = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem;
  font-weight: 550;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.inkInverted};
`

/** «inngår» skal lese som en god nyhet, ikke som en tom celle. */
const Dekket = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.colors.accentLight};
`

/**
 * Driften står for seg, med egen flate.
 *
 * Den er det eneste beløpet på kortet som fortsetter etter at de tolv
 * avdragene er betalt, og den forskjellen er verdt en strek.
 */
const Drift = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 0.8rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: rgba(252, 252, 250, 0.06);

  /* Direkte barn, av samme grunn som i <Tall>. */
  > span {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  > strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
`

const Send = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 50px;
  margin-top: 1.1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentVivid};
  color: ${({ theme }) => theme.colors.accentOn};
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:active {
    transform: scale(0.985);
  }
`

const Note = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(252, 252, 250, 0.52);
`

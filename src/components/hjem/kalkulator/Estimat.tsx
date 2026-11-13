import styled from 'styled-components'
import Belop, { Ramme } from '../../shared/Belop'
import Icon from '../../shared/Icon'
import { ANTALL_AVDRAG } from '../../../data/pakker'
import { foreslaDomene, type Estimat as EstimatData, type Svar } from '../../../data/kalkulator'
import Eksempelside from './Eksempelside'
import { eksempelnavn } from '../../../data/eksempelsider'

/**
 * Estimatet ved siden av kalkulatoren.
 *
 * Et ærlig anslag før du snakker med noen – ikke en prisliste. Spennet er der
 * de fleste i samme situasjon lander; den endelige prisen setter vi etter en
 * prat, og da står den skriftlig. Kortet sier det rett ut, så ingen tror de
 * har bestilt noe ferdig med fire klikk.
 *
 * Bygget og driften holdes fra hverandre. Slår man dem sammen får man et
 * penere tall og en kunde som føler seg lurt i måned tretten.
 *
 * Flaten var mørk før – en svart kvittering midt på en hvit side. Det trakk
 * blikket, men det var også det hardeste på hele forsiden. Nå er den en lys
 * grå flate, og det er tallet selv, stort og tydelig, som bærer vekten.
 */
export default function Estimat({
  estimat,
  svar,
  onSend,
  onVelgOmfang,
}: {
  estimat: EstimatData
  svar: Svar
  onSend: () => void
  /** Hopp til omfangssteget – kortet peker dit før det har et tall å vise. */
  onVelgOmfang: () => void
}) {
  const adresse =
    svar.domene.trim() || foreslaDomene(svar.navn) || foreslaDomene(eksempelnavn(svar.bransje.id)) || 'hansen-ror.no'

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
        <Felt>
          <Icon navn="skjold" storrelse={11} tykkelse={2.4} />
          {adresse}
        </Felt>
      </Adresselinje>

      <Topp>
        <Stikkord>{svar.navn.trim() ? `Anslag for ${svar.navn.trim()}` : 'Ditt anslag'}</Stikkord>
        {estimat.klar && <Merke>Ligner på {estimat.pakke.navn}</Merke>}
      </Topp>

      {/*
        Ingen tall før kunden har valgt omfang. Med et forhåndsvalg møtte alle
        det mellomste spennet før de hadde svart på noe – det leste som en
        prislapp, ikke som et anslag. Nå kommer tallet når det er hans eget.
      */}
      {estimat.klar ? (
        <>
          <Tall>
            <strong>
              <Ramme verdi={estimat.ramme} animert />
            </strong>
            <span>kr</span>
          </Tall>
          {estimat.kortvarig ? (
            <Under>med {estimat.pakke.driftInkludertMnd} måneders drift inkludert · klar på 1–2 uker</Under>
          ) : (
            <Under>
              eller ca. <Ramme verdi={estimat.avdrag} /> kr/mnd over {ANTALL_AVDRAG} måneder
            </Under>
          )}
        </>
      ) : (
        <>
          {/* Før prisen: en eksempelside for bransjen, i stedet for en tom rute. */}
          <Eksempelside bransje={svar.bransje.id} navn={svar.navn} />
          <Kontekst>Velg hvor mye som skal fram på siden, så kommer prisen.</Kontekst>
          <Velg type="button" onClick={onVelgOmfang}>
            Velg omfang
            <Icon navn="pilHoyre" storrelse={15} tykkelse={2} />
          </Velg>
        </>
      )}

      {!estimat.kortvarig && (
        <Deretter>
          <Icon navn="pilNed" storrelse={14} tykkelse={2.5} />
          Drift etterpå{' '}
          <strong>
            <Belop verdi={estimat.drift.pris} /> kr/mnd
          </strong>
        </Deretter>
      )}



      <Bolk>
        <Tittel>{estimat.klar ? 'Dette pleier å inngå' : 'Dette er alltid med'}</Tittel>
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

      {estimat.klar && (
        <>
          <Send type="button" onClick={onSend}>
            Ta en prat om dette
            <Icon navn="pilHoyre" storrelse={16} tykkelse={2} />
          </Send>
        </>
      )}

      {/* Det eneste forbeholdet, sagt én gang og kort: tallet er et
          utgangspunkt. Fast pris kommer skriftlig etter en prat. */}
      <Note>Anslag eks. mva. Fast pris får du skriftlig etter en prat.</Note>
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
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  /* Kantlys langs øvre kant. Ett piksel lys der flaten vender opp er det
     som skiller et objekt fra et hull – uten det leser kortet flatt. */
  /* Ingen skygge. Kortet skiller seg fra papiret med en tone, ikke med et
     svev – det er nok, og det er roligere. */

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
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl} ${({ theme }) => theme.borderRadius.xl} 0 0;
  background: transparent;
`

/** Selve adressefeltet. Mono, fordi et domene er en adresse og ikke en tittel. */
const Felt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.3rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.colors.inkMuted};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
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
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Merke = styled.span`
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  /* Nøytral – en merkelapp, ikke en knapp. */
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: var(--ls-micro);
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
    /* Mindre enn da det sto ett tall her: et spenn er dobbelt så langt, og
       skal fortsatt holde seg på én linje i spalten. */
    font-size: var(--fs-heading);
    font-weight: 600;
    line-height: 1;
    letter-spacing: var(--ls-heading);
    color: ${({ theme }) => theme.colors.ink};
  }

  /* Direkte barn: ellers treffer regelen også spans inne i <Belop>, og
     beløpet arver småskriften i stedet for sin egen grad. */
  > span {
    font-size: var(--fs-body);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`


const Fradel = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};
`


const Under = styled.p`
  margin: 0.5rem 0 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.inkMuted};
`

/** Driften, løftet opp til tallet. Aksentfarget fordi den er gode nyheter. */
const Deretter = styled.p`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.7rem 0 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.ink};

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: var(--fs-body);
    font-weight: 600;
    letter-spacing: var(--ls-body);
  }

  svg {
    opacity: 0.75;
  }
`

const Bolk = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Tittel = styled.p`
  margin: 0 0 0.6rem;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkMuted};
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
    font-size: var(--fs-small);
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.ink};
  }

  svg {
    flex-shrink: 0;
    margin-top: 0.3rem;
    color: ${({ theme }) => theme.colors.accent};
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
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Pris = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: var(--fs-small);
  font-weight: 500;
  letter-spacing: var(--ls-small);
  color: ${({ theme }) => theme.colors.ink};
`

/** «inngår» skal lese som en god nyhet, ikke som en tom celle. */
const Dekket = styled.span`
  flex-shrink: 0;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: var(--ls-micro);
  color: ${({ theme }) => theme.colors.ink};
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
  font-size: var(--fs-body);
  font-weight: 600;
  letter-spacing: var(--ls-body);
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
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

/** Linja under tallet: hva pengene går til, i samme øyeblikk som de vises. */
const Kontekst = styled.p`
  margin: 0.75rem 0 0;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Velg = styled.button`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.45rem;
  margin-top: 1rem;
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.accent};
  font-family: inherit;
  font-size: var(--fs-small);
  font-weight: 600;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentSoft};
  }
`

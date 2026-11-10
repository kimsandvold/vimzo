import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import Icon from '../../shared/Icon'
import type { User } from 'firebase/auth'
import { VILKAR } from '../../../lib/logobestillinger'
import { PRODUKTER, formaterKr, startKjop, type ProduktId } from './kjop'
import { NETTSIDE } from './lagring'
import type { Design, Innhold } from './motor'

/**
 * Bestillingen: velg produkt, logg inn, send.
 *
 * To valg side om side, ikke en prisliste. Pakken med profil er markert som
 * anbefalt fordi det er den som faktisk gjør logoen brukbar – en logo uten
 * farger og regler blir brukt litt forskjellig hver gang.
 *
 * Kunden er alltid logget inn her – verktøyet krever det – så skjemaet spør
 * bare etter det vi ikke vet: navn, telefon og hvor fakturaen skal.
 */
export default function Bestilling({
  design,
  innhold,
  bruker,
  start = 'profil',
  bestilt,
  onBestilt,
  autoLastNed = false,
  designId = null,
}: {
  design: Design
  innhold: Innhold
  bruker: User
  start?: ProduktId
  /** Finnes det alt en bestilling av akkurat dette designet, vises kvitteringen. */
  bestilt?: { id: string; produkt: ProduktId } | null
  onBestilt: (b: { id: string; produkt: ProduktId }) => void
  /** Fra Min side («Last ned igjen»): start nedlastingen med en gang. */
  autoLastNed?: boolean
  /** Designet på Min side – gir lenken til signatur og SoMe etter kjøp av profilen. */
  designId?: string | null
}) {
  const [valgt, setValgt] = useState<ProduktId>(start)
  const [status, setStatus] = useState<'klar' | 'sender' | 'lager' | 'feil'>('klar')
  const [feil, setFeil] = useState('')
  const [godtatt, setGodtatt] = useState(false)
  const [privat, setPrivat] = useState(false)
  // Beskjedfeltet er valgfritt og sjelden brukt – bak en lenke, så skjemaet står på én skjerm.
  const [beskjed, setBeskjed] = useState(false)

  /**
   * Strengt i denne rekkefølgen: først lagres bestillingen, og bare hvis det
   * går, lages og lastes filene ned. Feiler lagringen, får kunden ingenting –
   * og en feilmelding som sier hvorfor.
   */
  async function bestill(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!godtatt) return
    const d = new FormData(e.currentTarget)
    const felt = (n: string) => String(d.get(n) ?? '')
    setStatus('sender')
    setFeil('')
    let id: string
    try {
      id = await startKjop({
        produkt: valgt,
        bedrift: felt('bedrift'),
        orgnr: privat ? '' : felt('orgnr'),
        adresse: felt('adresse'),
        postnr: felt('postnr'),
        poststed: felt('poststed'),
        kontaktnavn: felt('navn'),
        telefon: felt('telefon'),
        merknad: felt('merknad'),
        design,
        innhold,
      })
    } catch (err) {
      console.error(err)
      setFeil(err instanceof Error && err.message ? err.message : 'Det gikk ikke å sende. Prøv igjen om litt.')
      setStatus('feil')
      return
    }
    onBestilt({ id, produkt: valgt })
    await lagFiler(id, valgt)
  }

  async function lagFiler(id: string, produkt: ProduktId) {
    setStatus('lager')
    try {
      const { lastNedPakke } = await import('./eksport')
      await lastNedPakke(design, innhold, produkt, id)
    } catch (err) {
      console.error(err)
      setFeil(
        id === NETTSIDE
          ? 'Filene kunne ikke lages akkurat nå. Prøv igjen om litt.'
          : 'Bestillingen er lagret, men filene kunne ikke lages akkurat nå. Prøv «Last ned igjen».',
      )
    } finally {
      setStatus('klar')
    }
  }

  const startet = useRef(false)
  useEffect(() => {
    if (!autoLastNed || !bestilt || startet.current) return
    startet.current = true
    void lagFiler(bestilt.id, bestilt.produkt)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- én gang, når kjøpet er lastet
  }, [autoLastNed, bestilt])

  // Profilen er kjøpt: neste steg er å ta den i bruk – signatur og SoMe.
  const studio =
    bestilt?.produkt === 'profil' && designId ? (
      <Studiolenke to={`/min-side/studio/${designId}`}>
        Lag e-postsignatur og bilder til sosiale medier <span aria-hidden="true">→</span>
      </Studiolenke>
    ) : null

  // Frigitt med nettsiden: ingen produktkort, ikke noe skjema, ingen vilkår –
  // bare filene. Fakturaen kommer med nettsiden.
  if (bestilt?.id === NETTSIDE) {
    return (
      <Kvittering role="status">
        <Hake aria-hidden="true">
          <Icon navn="sjekk" storrelse={22} tykkelse={2.6} />
        </Hake>
        <h2>Inngår i nettsiden din – filene er dine</h2>
        <p>Logo, profilbok og alle formater, uten vannmerke.</p>
        <Send type="button" disabled={status === 'lager'} onClick={() => lagFiler(bestilt.id, bestilt.produkt)}>
          {status === 'lager' ? 'Lager filene …' : 'Last ned filene'}
        </Send>
        {studio}
        {feil && <Feil role="alert">{feil}</Feil>}
      </Kvittering>
    )
  }

  if (bestilt) {
    return (
      <Kvittering role="status">
        <Hake aria-hidden="true">
          <Icon navn="sjekk" storrelse={22} tykkelse={2.6} />
        </Hake>
        <h2>Takk! Filene er dine.</h2>
        <p>{status === 'lager' ? 'Lager filene …' : 'Nedlastingen startet. Finner du den ikke, last ned igjen.'}</p>
        <Send type="button" disabled={status === 'lager'} onClick={() => lagFiler(bestilt.id, bestilt.produkt)}>
          {status === 'lager' ? 'Lager filene …' : 'Last ned igjen'}
        </Send>
        {studio}
        <Info>
          Faktura sendes til {bruker.email} innen én virkedag. Bestilling {bestilt.id}.
        </Info>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Kvittering>
    )
  }

  const pris = PRODUKTER[valgt].pris
  const inklMva = Math.round(pris * 1.25)

  return (
    <Ramme>
      <Produkter role="radiogroup" aria-label="Velg hva du vil bestille">
        {(Object.keys(PRODUKTER) as ProduktId[]).map((id) => {
          const p = PRODUKTER[id]
          const anbefalt = id === 'profil'
          return (
            <Produkt
              key={id}
              type="button"
              role="radio"
              aria-checked={valgt === id}
              $valgt={valgt === id}
              onClick={() => setValgt(id)}
            >
              {anbefalt && <Anbefalt>Anbefalt</Anbefalt>}
              <strong>{p.navn}</strong>
              <Pris>
                {formaterKr(p.pris)} <small>eks. mva.</small>
              </Pris>
              <ul>
                {p.innhold.map((x) => (
                  <li key={x}>
                    <Icon navn="sjekk" storrelse={13} tykkelse={2.8} />
                    {x}
                  </li>
                ))}
              </ul>
            </Produkt>
          )
        })}
      </Produkter>

      <Skjema onSubmit={bestill}>
        <Rad>
          <label>
            Bedrift
            <input name="bedrift" defaultValue={innhold.navn} autoComplete="organization" required />
          </label>
          <label>
            Org.nr <small>9 siffer</small>
            <input
              name="orgnr"
              inputMode="numeric"
              pattern="\s*(\d\s*){9}"
              autoComplete="off"
              disabled={privat}
              required={!privat}
            />
          </label>
        </Rad>
        <Avkryss>
          <input type="checkbox" checked={privat} onChange={(e) => setPrivat(e.target.checked)} />
          <span>Jeg bestiller som privatperson</span>
        </Avkryss>
        <Rad $adresse>
          <label>
            Fakturaadresse
            <input name="adresse" autoComplete="street-address" required />
          </label>
          <label>
            Postnr
            <input
              name="postnr"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              autoComplete="postal-code"
              required
            />
          </label>
          <label>
            Poststed
            <input name="poststed" autoComplete="address-level2" required />
          </label>
        </Rad>
        <Rad>
          <label>
            Kontaktperson
            <input name="navn" defaultValue={bruker.displayName ?? ''} autoComplete="name" required />
          </label>
          <label>
            Telefon <small>valgfritt</small>
            <input name="telefon" type="tel" autoComplete="tel" />
          </label>
        </Rad>
        {beskjed ? (
          <Rad $en>
            <label>
              Ønsker eller beskjed <small>valgfritt</small>
              <textarea name="merknad" rows={3} maxLength={2000} autoFocus />
            </label>
          </Rad>
        ) : (
          <Lenkeknapp type="button" onClick={() => setBeskjed(true)}>
            + Legg til et ønske eller en beskjed
          </Lenkeknapp>
        )}
        <Avkryss>
          <input
            type="checkbox"
            name="vilkar"
            required
            checked={godtatt}
            onChange={(e) => setGodtatt(e.target.checked)}
          />
          <span>
            {VILKAR}{' '}
            <a href="/vilkar/logo" target="_blank" rel="noopener noreferrer">
              Les kjøpsvilkårene
            </a>
          </span>
        </Avkryss>
        <Info>
          Du blir fakturert {formaterKr(pris)} eks. mva ({formaterKr(inklMva)} inkl. mva) med 14 dagers forfall.
        </Info>
        <Send type="submit" disabled={!godtatt || status === 'sender' || status === 'lager'}>
          {status === 'sender'
            ? 'Sender bestillingen …'
            : status === 'lager'
              ? 'Lager filene …'
              : 'Bestill og last ned'}
        </Send>
        {feil && <Feil role="alert">{feil}</Feil>}
      </Skjema>
    </Ramme>
  )
}

/* ------------------------------------------------------------------- stiler */

/** Produktene til venstre, skjemaet til høyre på stor skjerm; under hverandre ellers. */
const Ramme = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (min-width: 961px) {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: clamp(1.5rem, 3vw, 3rem);
    align-items: start;
  }
`

const Produkter = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (min-width: 961px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

const Produkt = styled.button<{ $valgt: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.25rem 1.25rem 1.4rem;
  border: 1.5px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentSoft : '#fff')};
  font-family: inherit;
  text-align: left;
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  @media (hover: hover) {
    &:hover {
      border-color: ${({ $valgt, theme }) => ($valgt ? theme.colors.accentVivid : theme.colors.borderStrong)};
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }

  > strong {
    font-size: var(--fs-lead);
    font-weight: 600;
    letter-spacing: var(--ls-lead);
  }

  ul {
    display: grid;
    gap: 0.35rem;
    margin: 0.6rem 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Anbefalt = styled.span`
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: #fff;
  font-size: var(--fs-micro);
  font-weight: 600;
`

const Pris = styled.span`
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: var(--ls-title);
  font-variant-numeric: tabular-nums;

  small {
    font-size: var(--fs-small);
    font-weight: 400;
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Skjema = styled.form`
  display: grid;
  gap: 0.85rem;
`

const Rad = styled.div<{ $en?: boolean; $adresse?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $en, $adresse }) =>
    $en ? '1fr' : $adresse ? 'minmax(0, 1.6fr) 5.5rem minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))'};
  gap: 0.75rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: ${({ $adresse }) => ($adresse ? '5.5rem minmax(0, 1fr)' : '1fr')};

    > label:first-child {
      grid-column: 1 / -1;
    }
  }

  /* Blokk, ikke grid: da står «valgfritt» og «9 siffer» på samme linje som
     etiketten, og feltene i en rad starter i samme høyde. */
  label {
    display: block;
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.ink};
  }

  small {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  input,
  textarea {
    display: block;
    width: 100%;
    margin-top: 0.4rem;
    min-height: 48px;
    padding: 0.75rem 0.9rem;
    border: 1.5px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.sunken};
    font: inherit;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.ink};
    resize: vertical;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accentVivid};
      background: #fff;
      box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accentSoft};
    }
  }
`

const knapp = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0 1.4rem;
  border-radius: 999px;
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Send = styled.button`
  ${knapp}
  border: 0;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: #fff;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Lenkeknapp = styled.button`
  justify-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-small);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    border-radius: 6px;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Avkryss = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  a {
    color: ${({ theme }) => theme.colors.accent};
  }

  input {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    accent-color: ${({ theme }) => theme.colors.accentVivid};
  }
`

const Info = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Feil = styled.p`
  margin: 0;
  font-size: var(--fs-small);
  color: ${({ theme }) => theme.colors.error};
`

const Kvittering = styled.div`
  display: grid;
  justify-items: start;
  gap: 0.75rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.sunken};

  h2 {
    margin: 0;
    font-size: var(--fs-title);
    letter-spacing: var(--ls-title);
  }

  p {
    margin: 0;
    font-size: var(--fs-body);
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Studiolenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  font-size: var(--fs-body);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accentHover};
  }
`

const Hake = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentVivid};
  color: #fff;
`

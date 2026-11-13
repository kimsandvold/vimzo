import { useId, useState, type FormEvent, type ReactNode } from 'react'
import styled from 'styled-components'
import { forslag, slaOpp, rensOrgnr } from '../../../lib/brreg'
import {
  TOM_BEDRIFT,
  TOM_PERSON,
  formaterKontonummer,
  formaterOrgnr,
  gyldigEpost,
  gyldigKontonummer,
  type Bedrift,
  type Fristvalg,
  type Person,
  type Profil,
} from '../../../lib/profil'
import type { Mvatermin } from '../../../lib/frister'
import { Knapp } from '../../../ui'
import { Etikett, Flate, Tekstknapp } from './stil'

/**
 * «Profilen din» på Min side: deg, og bedriften hvis du har en.
 *
 * To tilstander. I ro er det to rolige kort som viser det vi vet – slik det
 * vil stå i en signatur eller på et tilbud. «Endre» bytter til ett skjema
 * for alt, der orgnummeret fyller ut resten fra Enhetsregisteret.
 *
 * Komponenten lagrer ikke selv; den kaller `vedLagre`. Da kan den vises med
 * eksempeldata uten innlogging.
 */

export interface ProfilInn {
  person: Person
  bedrift: Bedrift | null
  frister: Fristvalg | null
}

const FORMNAVN: Record<string, string> = {
  ENK: 'Enkeltpersonforetak',
  AS: 'Aksjeselskap',
  ASA: 'Allmennaksjeselskap',
  ANS: 'Ansvarlig selskap',
  DA: 'Selskap med delt ansvar',
  NUF: 'Norskregistrert utenlandsk foretak',
  SA: 'Samvirkeforetak',
  FLI: 'Forening/lag/innretning',
}

export default function ProfilSeksjon({
  profil,
  forslagPerson,
  vedLagre,
  apen = false,
}: {
  profil: Profil | null
  /** Navn og e-post fra innloggingen – brukt når profilen er tom. */
  forslagPerson: Partial<Person>
  vedLagre: (inn: ProfilInn) => Promise<void>
  /** Start i redigering (tom profil, eller «Fyll inn» fra en annen seksjon). */
  apen?: boolean
}) {
  const [redigerer, settRedigerer] = useState(apen || !profil?.fullfort)

  if (redigerer)
    return (
      <Skjema
        start={profil}
        forslagPerson={forslagPerson}
        vedAvbryt={profil?.fullfort ? () => settRedigerer(false) : undefined}
        vedLagre={async (inn) => {
          await vedLagre(inn)
          settRedigerer(false)
        }}
      />
    )

  const { person, bedrift } = profil!
  return (
    <>
      <Kortrad>
        <Flate>
          <Korthode>
            <Etikett>Deg</Etikett>
            <Tekstknapp onClick={() => settRedigerer(true)}>Endre</Tekstknapp>
          </Korthode>
          <Visning>
            <strong>{person.navn || 'Navn mangler'}</strong>
            {person.tittel && <span>{person.tittel}</span>}
            <Kontakt>
              {person.telefon && <a href={`tel:${person.telefon.replace(/\s/g, '')}`}>{person.telefon}</a>}
              {person.epost && <a href={`mailto:${person.epost}`}>{person.epost}</a>}
            </Kontakt>
          </Visning>
        </Flate>
        <Flate>
          <Korthode>
            <Etikett>Bedriften</Etikett>
            <Tekstknapp onClick={() => settRedigerer(true)}>Endre</Tekstknapp>
          </Korthode>
          {bedrift ? (
            <Visning>
              <strong>{bedrift.navn}</strong>
              <span>
                {[FORMNAVN[bedrift.formkode] ?? bedrift.formkode, bedrift.orgnr && `Org.nr. ${formaterOrgnr(bedrift.orgnr)}`]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {(bedrift.adresse || bedrift.poststed) && (
                <span>{[bedrift.adresse, [bedrift.postnr, bedrift.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span>
              )}
              <Kontakt>
                {bedrift.telefon && <a href={`tel:${bedrift.telefon.replace(/\s/g, '')}`}>{bedrift.telefon}</a>}
                {bedrift.epost && <a href={`mailto:${bedrift.epost}`}>{bedrift.epost}</a>}
                {bedrift.nettside && (
                  <a href={bedrift.nettside.startsWith('http') ? bedrift.nettside : `https://${bedrift.nettside}`} target="_blank" rel="noopener noreferrer">
                    {bedrift.nettside.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </Kontakt>
              {bedrift.kontonummer && <span>Konto {formaterKontonummer(bedrift.kontonummer)}</span>}
            </Visning>
          ) : (
            <Tom>
              <p>Ingen bedrift lagt inn. Har du startet en, fyller orgnummeret ut resten.</p>
              <Tekstknapp onClick={() => settRedigerer(true)}>Legg til bedrift</Tekstknapp>
            </Tom>
          )}
        </Flate>
      </Kortrad>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Skjemaet                                                            */
/* ------------------------------------------------------------------ */

function Skjema({
  start,
  forslagPerson,
  vedAvbryt,
  vedLagre,
}: {
  start: Profil | null
  forslagPerson: Partial<Person>
  vedAvbryt?: () => void
  vedLagre: (inn: ProfilInn) => Promise<void>
}) {
  const [person, settPerson] = useState<Person>(start?.person ?? { ...TOM_PERSON, ...forslagPerson })
  const [harBedrift, settHarBedrift] = useState(start?.fullfort ? start.bedrift !== null : true)
  const [bedrift, settBedrift] = useState<Bedrift>(start?.bedrift ?? TOM_BEDRIFT)
  const [frister, settFrister] = useState<Fristvalg>(start?.frister ?? { mva: 'tomaaned', lonn: false, lonningsdag: 20 })
  const [henter, settHenter] = useState(false)
  const [oppslag, settOppslag] = useState<string | null>(null)
  const [lagrer, settLagrer] = useState(false)
  const [feil, settFeil] = useState<string | null>(null)

  const p = (felt: keyof Person) => (v: string) => settPerson({ ...person, [felt]: v })
  const b = (felt: keyof Bedrift) => (v: string) => settBedrift({ ...bedrift, [felt]: v })

  async function hent() {
    settHenter(true)
    settOppslag(null)
    const svar = await slaOpp(bedrift.orgnr)
    settHenter(false)
    if (!svar.ok) {
      settOppslag(
        svar.grunn === 'ugyldig'
          ? 'Sjekk nummeret – et orgnummer har ni siffer.'
          : svar.grunn === 'nett'
            ? 'Fikk ikke svar fra Brønnøysund. Fyll inn selv, eller prøv igjen.'
            : 'Fant ingen aktiv bedrift med det nummeret.',
      )
      return
    }
    const e = svar.enhet
    // Registeret fyller tomme felt og retter navn og adresse; det brukeren
    // selv har skrevet i telefon, e-post og konto, får stå.
    settBedrift({
      ...bedrift,
      orgnr: e.orgnr,
      navn: e.navn,
      formkode: e.formkode,
      adresse: e.adresse,
      postnr: e.postnr,
      poststed: e.poststed,
      telefon: bedrift.telefon || e.telefon,
      epost: bedrift.epost || e.epost,
      nettside: bedrift.nettside || e.nettside,
    })
    const f = forslag(e)
    settFrister({ ...frister, mva: f.mva, lonn: f.lonn })
    settOppslag(`Hentet fra Enhetsregisteret: ${e.navn}.`)
  }

  const kontoFeil = harBedrift && bedrift.kontonummer !== '' && !gyldigKontonummer(bedrift.kontonummer)
  const orgFeil = harBedrift && bedrift.orgnr !== '' && !rensOrgnr(bedrift.orgnr)
  const epostFeil = !gyldigEpost(person.epost) || (harBedrift && !gyldigEpost(bedrift.epost))

  async function send(e: FormEvent) {
    e.preventDefault()
    settFeil(null)
    if (!person.navn.trim()) return settFeil('Skriv inn navnet ditt.')
    if (harBedrift && !bedrift.navn.trim()) return settFeil('Bedriften trenger et navn – eller velg «Ikke ennå».')
    if (orgFeil || kontoFeil || epostFeil) return settFeil('Rett feltene som er merket.')
    settLagrer(true)
    try {
      await vedLagre({ person, bedrift: harBedrift ? bedrift : null, frister: harBedrift ? frister : null })
    } catch (err) {
      console.error(err)
      settFeil('Fikk ikke lagret akkurat nå. Prøv igjen om litt.')
    } finally {
      settLagrer(false)
    }
  }

  return (
    <SkjemaFlate as="form" onSubmit={send} noValidate>
      <Del>
        <Etikett>Deg</Etikett>
        <Rutenett>
          <Felt navn="Navn" verdi={person.navn} vedEndre={p('navn')} autoComplete="name" />
          <Felt navn="Tittel" verdi={person.tittel} vedEndre={p('tittel')} hint="F.eks. daglig leder" autoComplete="organization-title" />
          <Felt navn="Telefon" verdi={person.telefon} vedEndre={p('telefon')} type="tel" autoComplete="tel" />
          <Felt
            navn="E-post"
            verdi={person.epost}
            vedEndre={p('epost')}
            type="email"
            autoComplete="email"
            feil={!gyldigEpost(person.epost) ? 'Sjekk e-postadressen.' : undefined}
          />
        </Rutenett>
      </Del>

      <Del>
        <Etikett>Bedriften</Etikett>
        <Bryter role="group" aria-label="Har du bedrift?">
          <button type="button" aria-pressed={harBedrift} onClick={() => settHarBedrift(true)}>
            Jeg har bedrift
          </button>
          <button type="button" aria-pressed={!harBedrift} onClick={() => settHarBedrift(false)}>
            Ikke ennå
          </button>
        </Bryter>

        {harBedrift ? (
          <>
            <Oppslag>
              <Felt
                navn="Organisasjonsnummer"
                verdi={bedrift.orgnr}
                vedEndre={b('orgnr')}
                inputMode="numeric"
                plassholder="123 456 789"
                feil={orgFeil ? 'Ugyldig orgnummer.' : undefined}
              />
              <Knapp variant="myk" onClick={hent} disabled={henter || !bedrift.orgnr}>
                {henter ? 'Henter …' : 'Hent fra registeret'}
              </Knapp>
            </Oppslag>
            {oppslag && <Notis role="status">{oppslag}</Notis>}

            <Rutenett>
              <Felt navn="Bedriftsnavn" verdi={bedrift.navn} vedEndre={b('navn')} autoComplete="organization" bred />
              <Felt navn="Adresse" verdi={bedrift.adresse} vedEndre={b('adresse')} autoComplete="street-address" bred />
              <Felt navn="Postnummer" verdi={bedrift.postnr} vedEndre={b('postnr')} inputMode="numeric" autoComplete="postal-code" />
              <Felt navn="Poststed" verdi={bedrift.poststed} vedEndre={b('poststed')} autoComplete="address-level2" />
              <Felt navn="Telefon" verdi={bedrift.telefon} vedEndre={b('telefon')} type="tel" />
              <Felt
                navn="E-post"
                verdi={bedrift.epost}
                vedEndre={b('epost')}
                type="email"
                hint="Den kundene skal skrive til"
                feil={!gyldigEpost(bedrift.epost) ? 'Sjekk e-postadressen.' : undefined}
              />
              <Felt navn="Nettside" verdi={bedrift.nettside} vedEndre={b('nettside')} type="url" plassholder="dittfirma.no" />
              <Felt
                navn="Kontonummer"
                verdi={bedrift.kontonummer}
                vedEndre={b('kontonummer')}
                inputMode="numeric"
                plassholder="1234.56.78903"
                hint="Til tilbud og fakturaer"
                feil={kontoFeil ? 'Kontonummeret stemmer ikke – sjekk sifrene.' : undefined}
              />
            </Rutenett>

            <Underdel>
              <h3>For fristkalenderen</h3>
              <Valgrad role="group" aria-label="Mva-melding">
                <span>Mva-melding</span>
                {([
                  ['tomaaned', 'Annenhver måned'],
                  ['aar', 'Én gang i året'],
                  ['ingen', 'Ikke registrert'],
                ] as Array<[Mvatermin, string]>).map(([v, navn]) => (
                  <Brikke key={v} type="button" aria-pressed={frister.mva === v} onClick={() => settFrister({ ...frister, mva: v })}>
                    {navn}
                  </Brikke>
                ))}
              </Valgrad>
              <Valgrad role="group" aria-label="Lønn">
                <span>Betaler lønn</span>
                <Brikke type="button" aria-pressed={frister.lonn} onClick={() => settFrister({ ...frister, lonn: true })}>
                  Ja
                </Brikke>
                <Brikke type="button" aria-pressed={!frister.lonn} onClick={() => settFrister({ ...frister, lonn: false })}>
                  Nei
                </Brikke>
                {frister.lonn && (
                  <Dagvalg
                    aria-label="Lønningsdag"
                    value={frister.lonningsdag}
                    onChange={(e) => settFrister({ ...frister, lonningsdag: Number(e.target.value) })}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        lønn den {d}.
                      </option>
                    ))}
                  </Dagvalg>
                )}
              </Valgrad>
            </Underdel>
          </>
        ) : (
          <Notis>Helt greit. Legg den til når du har registrert foretaket – da kommer fristene også.</Notis>
        )}
      </Del>

      <Bunn>
        {feil && <Feilmelding role="alert">{feil}</Feilmelding>}
        <Knapper>
          {vedAvbryt && (
            <Knapp variant="myk" onClick={vedAvbryt}>
              Avbryt
            </Knapp>
          )}
          <Knapp type="submit" disabled={lagrer}>
            {lagrer ? 'Lagrer …' : 'Lagre profilen'}
          </Knapp>
        </Knapper>
      </Bunn>
    </SkjemaFlate>
  )
}

function Felt({
  navn,
  verdi,
  vedEndre,
  hint,
  feil,
  plassholder,
  bred,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  navn: string
  verdi: string
  vedEndre: (v: string) => void
  hint?: string
  feil?: string
  plassholder?: string
  bred?: boolean
  type?: string
  inputMode?: 'numeric' | 'text'
  autoComplete?: string
}) {
  const id = useId()
  const under: ReactNode = feil ?? hint
  return (
    <FeltRad $bred={bred}>
      <label htmlFor={id}>{navn}</label>
      <input
        id={id}
        type={type}
        value={verdi}
        placeholder={plassholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={feil ? true : undefined}
        aria-describedby={under ? `${id}-under` : undefined}
        onChange={(e) => vedEndre(e.target.value)}
      />
      {under && (
        <small id={`${id}-under`} data-feil={feil ? '' : undefined}>
          {under}
        </small>
      )}
    </FeltRad>
  )
}

/* ------------------------------------------------------------------ */
/* Stil                                                                */
/* ------------------------------------------------------------------ */

const Korthode = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  ${Etikett} {
    margin-bottom: 0.5rem;
  }

  ${Tekstknapp} {
    padding: 0;
  }
`

const Kortrad = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 0.75rem;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Visning = styled.div`
  display: grid;
  gap: 0.25rem;

  strong {
    font-size: var(--fs-lead);
    font-weight: 600;
    letter-spacing: var(--ls-lead);
  }

  > span {
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
  }
`

const Kontakt = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 0.5rem;

  a {
    color: ${({ theme }) => theme.colors.ink};
    font-size: var(--fs-small);
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Tom = styled.div`
  p {
    margin: 0 0 0.25rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
    line-height: 1.55;
  }
`

const SkjemaFlate = styled(Flate)`
  display: grid;
  gap: 2rem;
`

const Del = styled.div``

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const FeltRad = styled.div<{ $bred?: boolean }>`
  display: grid;
  align-content: start;
  gap: 0.3rem;
  grid-column: ${({ $bred }) => ($bred ? '1 / -1' : 'auto')};

  label {
    font-size: var(--fs-small);
    font-weight: 500;
  }

  input {
    min-height: 46px;
    padding: 0 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-size: var(--fs-body);

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accent};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
    }

    &[aria-invalid='true'] {
      border-color: ${({ theme }) => theme.colors.error};
    }
  }

  small {
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-size: var(--fs-micro);
  }

  small[data-feil] {
    color: ${({ theme }) => theme.colors.error};
  }
`

const Bryter = styled.div`
  display: inline-flex;
  margin-bottom: 1.25rem;
  padding: 3px;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.sunken};

  button {
    min-height: 38px;
    padding: 0 1rem;
    border: 0;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: none;
    color: ${({ theme }) => theme.colors.inkMuted};
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    cursor: pointer;
  }

  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`

const Oppslag = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;
  max-width: 34rem;
  margin-bottom: 1rem;

  > :last-child {
    margin-top: 1.55rem;
  }

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);

    > :last-child {
      margin-top: 0;
    }
  }
`

const Notis = styled.p`
  margin: 0 0 1.25rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: var(--fs-small);
`

const Underdel = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  h3 {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }
`

const Valgrad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;

  > span {
    min-width: 8rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: var(--fs-small);
  }
`

const Brikke = styled.button`
  min-height: 38px;
  padding: 0 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font: inherit;
  font-size: var(--fs-small);
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
    font-weight: 500;
  }
`

const Dagvalg = styled.select`
  min-height: 38px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: var(--fs-small);
`

const Bunn = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Knapper = styled.div`
  display: flex;
  gap: 0.6rem;
`

const Feilmelding = styled.p`
  margin: 0 auto 0 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: var(--fs-small);
`

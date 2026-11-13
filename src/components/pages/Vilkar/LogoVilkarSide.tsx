import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import { firma } from '../../../data/firma'
import { OPPGRADERING, PRODUKTER, VILKAR_VERSJON } from '../../../lib/logobestillinger'

const MVA = 0.25
const kr = (n: number) => `${n.toLocaleString('nb-NO', { minimumFractionDigits: n % 1 ? 2 : 0 })} kr`

/**
 * Kjøpsvilkår for logoverktøyet.
 *
 * Kunden krysser av for disse før bestillingen går, og versjonen lagres på
 * ordrelinjen – så det alltid er klart hvilke vilkår et kjøp ble gjort på.
 * Endres vilkårene, endres VILKAR_VERSJON i lib/logobestillinger.ts også.
 *
 * Kort først, så det fulle. De fleste leser bare de fem linjene øverst, og
 * de skal være nok til å forstå at man blir fakturert.
 */
export default function LogoVilkarSide() {
  useSEO({
    title: 'Kjøpsvilkår for logoverktøyet – Vimzo',
    description:
      'Vilkårene for kjøp av logo og visuell profil i Vimzos logoverktøy: pris, faktura, levering, ' +
      'angrerett og rettigheter.',
    jsonLd: [brodsmuler([{ navn: 'Kjøpsvilkår for logoverktøyet', sti: '/vilkar/logo' }])],
  })

  const selger = firma.juridiskNavn || firma.merke
  const logo = PRODUKTER.logo
  const profil = PRODUKTER.profil

  return (
    <>
      <Sidehode
        motiv="guide"
        smuler={[{ navn: 'Kjøpsvilkår for logoverktøyet' }]}
        stikkord="Kjøpsvilkår"
        tittel="Kjøpsvilkår for logoverktøyet"
        ingress="Det du godtar når du bestiller en logo eller en visuell profil fra Vimzo."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Tekst>
            <Kort aria-label="Kort fortalt">
              <h2>Kort fortalt</h2>
              <ul>
                <li>
                  Du betaler for filene, ikke for å designe. Å lage og se på logoer koster ingenting.
                </li>
                <li>
                  Når du trykker «Bestill», er kjøpet bindende. Du får filene med en gang, og{' '}
                  <strong>vi sender faktura etterpå</strong>, med 14 dagers forfall.
                </li>
                <li>
                  {logo.navn} koster {kr(logo.pris)}, {profil.navn.toLowerCase()} koster {kr(profil.pris)}{' '}
                  – eks. mva. Har du kjøpt logoen, kan du oppgradere til profilen for {kr(OPPGRADERING.pris)}.
                </li>
                <li>Fordi filene leveres med en gang, har du ikke angrerett når nedlastingen har startet.</li>
                <li>Du får bruke logoen fritt i bedriften din, uten tidsbegrensning.</li>
              </ul>
            </Kort>

            <h2>1. Hvem du handler med</h2>
            <p>
              Selger er {selger}
              {firma.orgNr && `, org.nr ${firma.orgNr}`}, {firma.poststed}. Spørsmål om kjøpet sendes via{' '}
              <Link to="/kontakt">kontaktskjemaet</Link>.
            </p>

            <h2>2. Hva du kjøper</h2>
            <ul>
              <li>
                <strong>{logo.navn}</strong> – logoen du har laget, i SVG og PNG, i flere varianter (liggende,
                stående, ikon, negativ og sort/hvit).
              </li>
              <li>
                <strong>{profil.navn}</strong> – alt i «{logo.navn}», pluss en visuell profil som PDF:
                farger med koder, skrifttyper, bruk av logoen og eksempler på bruk, e-postsignatur og bilder
                til sosiale medier.
              </li>
              <li>
                <strong>{OPPGRADERING.navn}</strong> – for deg som har kjøpt «{logo.navn}»: det profilen har i
                tillegg, for mellomlegget. Fakturaen går til samme firma og adresse som logoen.
              </li>
            </ul>
            <p>
              Filene lages automatisk av designet du har satt sammen i verktøyet. Det er ikke en logo tegnet
              for hånd av en designer – vil du ha det, er det et eget{' '}
              <Link to="/tjenester">tillegg til nettsiden</Link>.
            </p>

            <h2>3. Pris</h2>
            <Tabell>
              <thead>
                <tr>
                  <th scope="col">Produkt</th>
                  <th scope="col">Eks. mva</th>
                  <th scope="col">Inkl. 25 % mva</th>
                </tr>
              </thead>
              <tbody>
                {[logo, profil, OPPGRADERING].map((p) => (
                  <tr key={p.navn}>
                    <th scope="row">{p.navn}</th>
                    <td>{kr(p.pris)}</td>
                    <td>{kr(p.pris * (1 + MVA))}</td>
                  </tr>
                ))}
              </tbody>
            </Tabell>
            <p>Prisen som står i verktøyet når du bestiller, er prisen du betaler. Det kommer ingen gebyrer i tillegg.</p>

            <h2>4. Bestilling og innlogging</h2>
            <p>
              Du må være innlogget for å bruke verktøyet. Når du bestiller, oppgir du firmanavn og
              fakturaadresse, og krysser av for at du har lest disse vilkårene. Kjøpet er inngått i det du
              trykker «Bestill». Du får en bekreftelse på e-post, og bestillingen ligger på kontoen din.
            </p>

            <h2>5. Levering</h2>
            <p>
              Filene lastes ned som en ZIP-fil i nettleseren rett etter bestillingen. Du kan laste dem ned
              igjen fra kontoen din. Klarer du ikke å laste ned, si fra, så sender vi filene på e-post.
            </p>

            <h2>6. Betaling</h2>
            <p>
              Du betaler mot faktura, som sendes til e-postadressen på kontoen din innen én virkedag.
              Forfall er 14 dager. Betales ikke fakturaen i tide, kan vi kreve forsinkelsesrente etter
              forsinkelsesrenteloven og purregebyr etter inkassoloven, og kravet kan til slutt sendes til
              inkasso.
            </p>

            <h2>7. Angrerett</h2>
            <p>
              Kjøper du som forbruker, har du normalt 14 dagers angrerett etter angrerettloven. For digitalt
              innhold som leveres med en gang, faller angreretten bort når leveringen har startet – hvis du
              på forhånd har samtykket til det og bekreftet at du vet at angreretten da går tapt
              (angrerettloven § 22 bokstav n). Det er dette du samtykker til når du krysser av før du
              bestiller.
            </p>
            <p>Kjøper du på vegne av en bedrift, gjelder ikke angrerettloven.</p>

            <h2>8. Rettigheter til logoen</h2>
            <ul>
              <li>
                Du får en tidsubegrenset rett til å bruke logoen og profilen i bedriften din, på alt fra
                nettside og visittkort til bil, skilt og klær, og til å endre filene.
              </li>
              <li>
                Symbolene i verktøyet kommer fra åpne ikonbiblioteker, og skriftene har åpne lisenser som
                tillater bruk i logoer. Det betyr at andre kan bruke det samme symbolet eller den samme
                skriften. Du får derfor ikke enerett til selve symbolet eller skriften, men til
                kombinasjonen – logoen din slik den er satt sammen.
              </li>
              <li>
                Symboler laget med KI-funksjonen i verktøyet er generert av en ekstern tjeneste, og vi kan
                ikke garantere at de er unike.
              </li>
              <li>
                Vi sjekker ikke om logoen ligner et registrert varemerke. Skal du registrere den som
                varemerke, bør du søke i Patentstyrets register først.
              </li>
            </ul>

            <h2>9. Feil i filene</h2>
            <p>
              Er en fil skadet, mangler noe, eller ser den annerledes ut enn designet du bestilte, retter vi
              det kostnadsfritt. Si fra innen rimelig tid etter at du oppdaget feilen.
            </p>

            <h2>10. Personopplysninger</h2>
            <p>
              Vi lagrer det du oppgir i bestillingen, og designet ditt, for å kunne levere og fakturere – og
              så lenge regnskapsloven krever. Les mer i <Link to="/personvern">personvernerklæringen</Link>.
            </p>

            <h2>11. Uenighet</h2>
            <p>
              Norsk lov gjelder. Blir vi ikke enige, kan du som forbruker klage til Forbrukertilsynet og få
              saken behandlet i Forbrukerklageutvalget.
            </p>

            <Oppdatert>Versjon {VILKAR_VERSJON}.</Oppdatert>
          </Tekst>
        </Wrap>
      </Seksjon>
    </>
  )
}

const Tekst = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};

  h2 {
    font-size: var(--fs-title);
    letter-spacing: var(--ls-title);
    margin-bottom: 0.9rem;
  }

  h2:not(:first-child) {
    margin-top: 2.5rem;
  }

  p {
    font-size: var(--fs-body);
    line-height: 1.75;
    margin-bottom: 1.1rem;
  }

  ul {
    margin: 0 0 1.1rem 1.1rem;
  }

  li {
    font-size: var(--fs-body);
    line-height: 1.7;
    margin-bottom: 0.5rem;
    padding-left: 0.35rem;
  }

  li::marker {
    color: ${({ theme }) => theme.colors.accent};
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
  }

  strong {
    font-weight: 600;
  }
`

/** «Kort fortalt» – det man trenger å vite, i en rolig flate øverst. */
const Kort = styled.section`
  margin-bottom: 3rem;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};

  h2 {
    font-size: var(--fs-lead);
    letter-spacing: var(--ls-lead);
  }

  ul {
    margin-bottom: 0;
  }

  li:last-child {
    margin-bottom: 0;
  }
`

const Tabell = styled.table`
  width: 100%;
  margin-bottom: 1.1rem;
  border-collapse: collapse;
  font-size: var(--fs-body);

  th,
  td {
    padding: 0.75rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
    font-variant-numeric: tabular-nums;
  }

  thead th {
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  tbody th {
    font-weight: 500;
  }

  td {
    text-align: right;
  }

  thead th:not(:first-child) {
    text-align: right;
  }
`

const Oppdatert = styled.p`
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: var(--fs-small) !important;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

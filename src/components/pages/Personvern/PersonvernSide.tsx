import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import { firma } from '../../../data/firma'
import { emailjsKlar } from '../../../lib/emailjs'

/**
 * Personvernerklæring.
 *
 * Den er kort fordi nettstedet faktisk samler inn lite: ingen analyseverktøy,
 * ingen informasjonskapsler og ingen tredjeparts-script. Skulle det endre seg,
 * er det denne siden som må endres først — ikke etterpå.
 */
export default function PersonvernSide() {
  useSEO({
    title: 'Personvern – Vimzo',
    description:
      'Hvilke opplysninger vimzo.no samler inn, hvorfor, hvor lenge de lagres og hvilke ' +
      'rettigheter du har. Nettstedet bruker ingen informasjonskapsler og ingen analyseverktøy.',
    jsonLd: [brodsmuler([{ navn: 'Personvern', sti: '/personvern' }])],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Personvern' }]}
        stikkord="Personvern"
        tittel="Hva vi samler inn, og hva vi ikke gjør"
        ingress="Kort versjon: nettstedet bruker ingen informasjonskapsler og ingen analyseverktøy. Det eneste vi får fra deg, er det du selv skriver i kontaktskjemaet."
      />

      <Seksjon $flate="surface" $tett>
        <Wrap>
          <Tekst>
            <h2>Behandlingsansvarlig</h2>
            <p>
              {firma.juridiskNavn || firma.merke}
              {firma.orgNr && ` (org.nr ${firma.orgNr})`} i {firma.poststed} er ansvarlig for
              behandlingen av personopplysninger på vimzo.no. Spørsmål sendes via{' '}
              <Link to="/kontakt">kontaktskjemaet</Link>.
            </p>

            <h2>Informasjonskapsler</h2>
            <p>
              Nettstedet setter ingen informasjonskapsler, og laster ingen script fra
              tredjeparter. Det er derfor du ikke møter noen samtykkeboks her. Skulle vi senere ta
              i bruk besøksstatistikk, vil det stå på denne siden før det tas i bruk — og vi vil
              velge en løsning som ikke krever samtykke.
            </p>

            <h2>Opplysninger du selv sender inn</h2>
            <p>
              Sender du inn kontaktskjemaet, behandler vi navn, e-postadresse, eventuelt
              telefonnummer og bedriftsnavn, samt det du skriver i meldingen. Grunnlaget for
              behandlingen er at du har bedt om et tilbud, altså at vi skal kunne svare deg
              (personvernforordningen artikkel 6 nr. 1 bokstav b).
            </p>
            <p>
              Opplysningene brukes bare til å svare på henvendelsen og eventuelt gjennomføre et
              oppdrag. De selges ikke, og brukes ikke til nyhetsbrev eller markedsføring.
            </p>
            {/* TODO: fyll inn hvor EmailJS lagrer og behandler data, og
                overføringsgrunnlaget hvis det er utenfor EØS (art. 13 nr. 1 f). */}
            {emailjsKlar && (
              <p>
                Kontaktskjemaet og oppsummeringen fra kalkulatoren sendes via EmailJS, en
                tjeneste som videresender meldingen som e-post til oss. EmailJS er databehandler
                for oss og får bare innholdet du sender, i det øyeblikket du trykker send.
                Nettstedet laster ingen kode fra EmailJS.
              </p>
            )}

            <h2>Lagringstid</h2>
            <p>
              Henvendelser som ikke fører til et oppdrag, slettes innen tolv måneder. Blir det et
              oppdrag, oppbevarer vi det som trengs for avtalen og for å oppfylle
              bokføringsloven — det vil si fem år etter regnskapsårets slutt.
            </p>

            <h2>Serverlogger</h2>
            <p>
              Nettstedet ligger hos en leverandør som fører driftslogger. Disse kan inneholde
              IP-adresse, tidspunkt og hvilken side som ble hentet. Loggene brukes kun til drift og
              feilsøking, og slettes etter leverandørens rutiner. Vi bruker dem ikke til å følge
              enkeltbesøkende.
            </p>

            <h2>Dine rettigheter</h2>
            <ul>
              <li>Du kan be om innsyn i opplysningene vi har om deg.</li>
              <li>Du kan be om at feil rettes, eller at opplysningene slettes.</li>
              <li>Du kan be om at behandlingen begrenses, og protestere mot den.</li>
              <li>Du kan klage til Datatilsynet dersom du mener vi behandler opplysninger feil.</li>
            </ul>
            <p>
              Send en melding via <Link to="/kontakt">kontaktskjemaet</Link>, så svarer vi innen
              30 dager.
            </p>

            <h2>Nettsteder vi bygger for andre</h2>
            <p>
              Denne erklæringen gjelder vimzo.no. For nettsteder vi utvikler på oppdrag er det
              kunden som er behandlingsansvarlig; vi opptrer som databehandler, og
              databehandleravtale inngås før vi får tilgang til personopplysninger.
            </p>

            <Oppdatert>Sist oppdatert: november 2026.</Oppdatert>
          </Tekst>
        </Wrap>
      </Seksjon>
    </>
  )
}

const Tekst = styled.div`
  max-width: ${({ theme }) => theme.spacing.proseMax};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: 0.9rem;
  }

  h2:not(:first-child) {
    margin-top: 2.5rem;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.75;
    margin-bottom: 1.1rem;
  }

  ul {
    margin: 0 0 1.1rem 1.1rem;
  }

  li {
    font-size: ${({ theme }) => theme.fontSizes.md};
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
`

const Oppdatert = styled.p`
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem !important;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

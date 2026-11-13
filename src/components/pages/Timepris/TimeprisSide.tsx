import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, timeprisHowToLd, timeprisLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import Kalkulator from './Kalkulator'
import { Bransjelenke, Bransjeliste, Kortsvar, Prosa } from './felles'
import { STANDARD } from '../../../data/timepris'
import { BRANSJEPROFILER } from '../../../data/timeprisbransjer'

/**
 * /timepris – hovedsiden.
 *
 * Den generelle inngangen. Bransjesidene er der trafikken kommer fra, men
 * denne er den som skal rangere på «hva skal jeg ta i timen» og er stedet
 * lenker fra andre peker.
 */

const SPORSMAL = [
  {
    sporsmal: 'Hva skal jeg ta i timen som selvstendig næringsdrivende?',
    svar:
      'Legg sammen det du vil tjene før skatt og alle faste kostnader for et år, og del på de timene ' +
      'du faktisk kan fakturere. Det gir minste timepris – det du må ha for å gå i null. Legg på ' +
      '10–20 % buffer, så har du prisen du bør ta.',
  },
  {
    sporsmal: 'Hvorfor kan jeg ikke fakturere alle timene jeg jobber?',
    svar:
      'Befaring, tilbudsskriving, innkjøp, kjøring, rydding, regnskap, markedsføring og ' +
      'kundehenvendelser som ikke blir til noe, er arbeid ingen betaler deg for direkte. Hos de ' +
      'fleste selvstendige ligger den fakturerbare andelen mellom 55 og 70 prosent. Jobber du 1 840 ' +
      'timer i året og kan fakturere 65 % av dem, må timeprisen være 54 % høyere enn arbeidstimene ' +
      'alene skulle tilsi.',
  },
  {
    sporsmal: 'Er det forskjell på enkeltpersonforetak og aksjeselskap?',
    svar:
      'Ja, og den er stor. I et enkeltpersonforetak er «det du vil tjene» overskuddet, og skatten ' +
      'betaler du privat. I et aksjeselskap tar du ut lønn, og lønn koster selskapet feriepenger, ' +
      'arbeidsgiveravgift og obligatorisk tjenestepensjon i tillegg. 600 000 kroner i lønn koster ' +
      'selskapet nærmere 780 000. Regner du som om de to var like, bommer du med over hundre kroner ' +
      'i timen.',
  },
  {
    sporsmal: 'Skal timeprisen være med eller uten mva.?',
    svar:
      'Kalkulatoren regner eksklusive merverdiavgift. Er du registrert i Merverdiavgiftsregisteret, ' +
      'legger du mva. på toppen når du fakturerer. Er du under registreringsgrensen, fakturerer du ' +
      'uten mva. – men får heller ikke fradrag for mva. på det du kjøper inn, og da må den ' +
      'kostnaden med i kalkylen.',
  },
  {
    sporsmal: 'Koster kalkulatoren noe?',
    svar:
      'Nei. Den er gratis, krever ingen innlogging, og lagrer ingenting om deg. Tallene dine ligger ' +
      'i adressefeltet, så du kan bokmerke resultatet eller sende det videre.',
  },
]

export default function TimeprisSide() {
  useSEO({
    title: 'Hva skal du ta i timen? Gratis timepriskalkulator | Vimzo',
    description:
      'Regn ut timeprisen du må ta for at lønn, faste kostnader og ubetalt tid går opp. Gratis, uten ' +
      'innlogging, for enkeltpersonforetak og aksjeselskap.',
    ogImage: '/images/og/timepris.png',
    ogImageAlt: 'Hva må du egentlig ta i timen? Gratis timepriskalkulator fra Vimzo.',
    jsonLd: [
      brodsmuler([{ navn: 'Timepriskalkulator', sti: '/timepris' }]),
      timeprisLd(
        '/timepris',
        'Timepriskalkulator',
        'Regn ut timeprisen du må ta som selvstendig næringsdrivende: lønn, faste kostnader, ' +
          'fakturerbare timer og buffer – for enkeltpersonforetak og aksjeselskap.',
      ),
      timeprisHowToLd('Slik regner du ut timeprisen din'),
      faqLd(SPORSMAL),
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Timepriskalkulator' }]}
        stikkord="Gratis verktøy"
        tittel="Hva må du egentlig ta i timen?"
        ingress={
          'Fyll inn hva du vil tjene, hva det koster å drive, og hvor mye du faktisk jobber. ' +
          'Så regner vi ut timeprisen som gjør at året går opp. Ingenting lagres, og du trenger ingen konto.'
        }
      />

      <Seksjon $tett>
        <Wrap>
          <Kortsvar>
            <p>
              <strong>Kort svar:</strong> legg sammen det du vil tjene før skatt og alle faste
              kostnader for et år, og del på timene du faktisk kan fakturere. De fleste selvstendige
              kan fakturere 55–70 % av tiden sin – resten går til befaring, tilbud, innkjøp, kjøring
              og rydding. Det er derfor timeprisen må være vesentlig høyere enn det du vil sitte igjen
              med per time.
            </p>
          </Kortsvar>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Kalkulator standard={STANDARD} />
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>Typiske tall for din bransje</h2>
            <p>
              Kostnadsbildet er ikke det samme i alle fag. En rørlegger har varebil og lager, en
              anleggsgartner har maskiner og en kort sesong, en frisør har salong og produkter. Velg
              bransje, så er kalkulatoren fylt ut med nivåer du kan regne videre fra.
            </p>
          </Prosa>
          <Bransjeliste aria-label="Timepris per bransje">
            {BRANSJEPROFILER.map((b) => (
              <Bransjelenke key={b.slug} to={`/timepris/${b.slug}`}>
                {b.navn}
              </Bransjelenke>
            ))}
          </Bransjeliste>

          <Prosa>
            <h2>Slik regner du</h2>
            <p>
              Fire steg, og det tredje er det folk hopper over:
            </p>
            <ul>
              <li>
                <strong>Hva du vil sitte igjen med.</strong> I et enkeltpersonforetak er dette
                overskuddet før skatt. I et aksjeselskap er det bruttolønnen din – og da koster den
                selskapet feriepenger, arbeidsgiveravgift og pensjon i tillegg.
              </li>
              <li>
                <strong>Alle faste kostnader for et år.</strong> Lokale, forsikring, verktøy, bil,
                regnskap, telefon, markedsføring. Alt som løper uansett om du har oppdrag.
              </li>
              <li>
                <strong>Hvor mange timer du faktisk kan fakturere.</strong> Ikke hvor mange du
                jobber. Forskjellen er som regel en tredjedel.
              </li>
              <li>
                <strong>Del, og legg på buffer.</strong> Lønnskostnad pluss faste kostnader, delt på
                fakturerbare timer. Bufferen oppå dekker dårlige år, sykdom og nytt utstyr.
              </li>
            </ul>

            <h2>Vanlige spørsmål</h2>
            {SPORSMAL.map((s) => (
              <div key={s.sporsmal}>
                <h3>{s.sporsmal}</h3>
                <p>{s.svar}</p>
              </div>
            ))}

            <h2>Andre gratisverktøy</h2>
            <p>Regn videre på det samme tallgrunnlaget.</p>
          </Prosa>
          <Bransjeliste aria-label="Andre verktøy">
            <Bransjelenke to="/hva-ma-du-fakturere">Hvor mye må du fakturere?</Bransjelenke>
            <Bransjelenke to="/hva-koster-en-ansatt">Hva koster en ansatt?</Bransjelenke>
            <Bransjelenke to="/navnesjekk">Er firmanavnet ledig?</Bransjelenke>
          </Bransjeliste>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, fristerLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import { Bransjelenke, Bransjeliste, Kortsvar, Prosa } from '../Timepris/felles'
import Fristkalender from './Fristkalender'

/**
 * /frister – fristkalenderen.
 *
 * Verktøyet ingen leter etter, fordi ingen vet at det kan finnes: skriv inn
 * orgnummeret, og alle fristene som gjelder akkurat din bedrift ligger i
 * telefonens kalender, med varsel tre dager før.
 *
 * Reglene står i `src/lib/frister.ts`. Teksten her skal aldri love mer enn
 * reglene dekker – derfor forbeholdet i FAQ-en.
 */

const SPORSMAL = [
  {
    sporsmal: 'Hvilke frister har et enkeltpersonforetak?',
    svar:
      'Forskuddsskatt fire ganger i året (15. mars, juni, september og desember), skattemelding for ' +
      'næringsdrivende innen 31. mai, og mva-melding annenhver måned hvis du er mva-registrert. Betaler ' +
      'du lønn til ansatte, kommer a-melding, arbeidsgiveravgift og forskuddstrekk i tillegg.',
  },
  {
    sporsmal: 'Hvilke frister har et aksjeselskap?',
    svar:
      'Aksjonærregisteroppgaven innen 31. januar, forskuddsskatt for selskapet 15. februar og 15. april, ' +
      'skattemelding innen 31. mai, generalforsamling innen 30. juni og årsregnskap til Brønnøysund ' +
      'innen 31. juli. I tillegg mva og lønnsfrister – og tar du lønn fra ditt eget AS, gjelder ' +
      'lønnsfristene deg også.',
  },
  {
    sporsmal: 'Hva skjer hvis fristen er en lørdag, søndag eller helligdag?',
    svar:
      'Da flyttes den til neste virkedag. Kalenderen gjør det for deg og sier fra når en frist er ' +
      'flyttet. For årsregnskapet har vi ikke fått bekreftet at fristen flyttes, så der står 31. juli ' +
      'uansett ukedag – bedre én dag for tidlig enn én for sent.',
  },
  {
    sporsmal: 'Når skal forskuddstrekket betales?',
    svar:
      'Fra 2026 skal forskuddstrekket betales senest første virkedag etter at lønnen er utbetalt – ikke ' +
      'annenhver måned som før. Derfor spør vi om lønningsdagen din. Arbeidsgiveravgiften betales ' +
      'fortsatt annenhver måned, den 15.',
  },
  {
    sporsmal: 'Kan jeg stole på datoene?',
    svar:
      'Reglene er sjekket mot Skatteetaten og Brønnøysundregistrene i november 2026, og hver dato er ' +
      'testet. Men det er fristene på skatteetaten.no og i Altinn som gjelder. Har du fått utsatt frist, ' +
      'eller har du særordninger som månedlig mva, ser du det bare der.',
  },
  {
    sporsmal: 'Lagrer dere organisasjonsnummeret?',
    svar:
      'Nei. Nettleseren din spør Enhetsregisteret direkte, og kalenderfila lages på din maskin. Vi ser ' +
      'verken nummeret eller fristene dine.',
  },
]

export default function FristerSide() {
  useSEO({
    title: 'Fristkalender for bedrifter – alle fristene i kalenderen | Vimzo',
    description:
      'Skriv inn organisasjonsnummeret og få mva, a-melding, forskuddsskatt, skattemelding og årsoppgjør ' +
      'for akkurat din bedrift rett i kalenderen. Gratis, uten innlogging.',
    ogImage: '/images/og/frister.png',
    ogImageAlt: 'Alle fristene dine, i kalenderen din. Gratis fristkalender fra Vimzo.',
    jsonLd: [
      brodsmuler([{ navn: 'Fristkalender', sti: '/frister' }]),
      fristerLd(),
      faqLd(SPORSMAL),
    ],
  })

  return (
    <>
      <Sidehode
        motiv="kalender"
        smuler={[{ navn: 'Fristkalender' }]}
        stikkord="Gratis verktøy"
        tittel="Alle fristene dine. I kalenderen din."
        ingress={
          'Skriv inn organisasjonsnummeret, så finner vi hver frist som gjelder akkurat din bedrift ' +
          'det neste året – mva, lønn, skatt og årsoppgjør. Ett trykk, og de ligger i telefonen med varsel.'
        }
      />

      <Seksjon $tett>
        <Wrap>
          <Kortsvar>
            <p>
              <strong>Kort sagt:</strong> fristene står spredt hos Skatteetaten, Altinn og
              Brønnøysund, og ingen av dem viser bare dine. Her slår vi opp bedriften din, du sjekker
              tre svar, og du får en kalender med alt – flyttet riktig rundt helger og helligdager.
            </p>
          </Kortsvar>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Fristkalender />
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>Vanlige spørsmål</h2>
            {SPORSMAL.map((s) => (
              <div key={s.sporsmal}>
                <h3>{s.sporsmal}</h3>
                <p>{s.svar}</p>
              </div>
            ))}

            <h2>Andre gratisverktøy</h2>
            <p>Når fristene er på plass: sjekk at prisen og tallene henger med.</p>
          </Prosa>
          <Bransjeliste aria-label="Andre verktøy">
            <Bransjelenke to="/timepris">Hva skal du ta i timen?</Bransjelenke>
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

import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Seksjon, Wrap } from '../../../ui'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, faqLd, timeprisHowToLd, timeprisLd } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import Kalkulator from './Kalkulator'
import { Bransjelenke, Bransjeliste, Kortsvar, Prosa } from './felles'
import { STANDARD } from '../../../data/timepris'
import { BRANSJEPROFILER, finnBransjeprofil } from '../../../data/timeprisbransjer'

/**
 * /timepris/:bransje – én side per bransje.
 *
 * Dette er sidene som skal rangere. «Hva skal jeg ta i timen» søkes sjelden;
 * «hva skal en snekker ta i timen» søkes hele tiden.
 *
 * Hver side har egne typiske kostnader, egen begrunnelse for den fakturerbare
 * andelen, og egne spørsmål og svar. Det er ikke pynt – uten ekte forskjell er
 * seks slike sider portalsider, og da rangerer ingen av dem.
 *
 * Ukjent bransje sendes til hovedsiden i stedet for til 404. Da får hverken
 * den besøkende eller Google en blindvei for en adresse som ligner på noe
 * riktig.
 */
export default function TimeprisBransjeSide() {
  const { bransje } = useParams()
  const profil = finnBransjeprofil(bransje)

  const standard = useMemo(
    () =>
      profil
        ? {
            ...STANDARD,
            fakturerbarAndel: profil.typisk.fakturerbarAndel,
            arbeidsuker: profil.typisk.arbeidsuker,
            timerPerUke: profil.typisk.timerPerUke,
            fasteKostnader: profil.typisk.fasteKostnader,
          }
        : STANDARD,
    [profil],
  )

  useSEO({
    title: profil ? `${profil.tittel} Gratis kalkulator | Vimzo` : 'Timepriskalkulator | Vimzo',
    description: profil?.ingress ?? '',
    ...(profil
      ? {
          ogImage: `/images/og/timepris-${profil.slug}.png`,
          ogImageAlt: `${profil.tittel} Gratis kalkulator fra Vimzo.`,
        }
      : {}),
    noindex: !profil,
    jsonLd: profil
      ? [
          brodsmuler([
            { navn: 'Timepriskalkulator', sti: '/timepris' },
            { navn: profil.navn, sti: `/timepris/${profil.slug}` },
          ]),
          timeprisLd(`/timepris/${profil.slug}`, `Timepriskalkulator for ${profil.navn.toLowerCase()}`, profil.ingress),
          timeprisHowToLd(profil.tittel),
          faqLd(profil.sporsmal),
        ]
      : undefined,
  })

  if (!profil) return <Navigate to="/timepris" replace />

  const andre = BRANSJEPROFILER.filter((b) => b.slug !== profil.slug)

  return (
    <>
      <Sidehode
        motiv="kalkulator"
        smuler={[{ navn: 'Timepriskalkulator', sti: '/timepris' }, { navn: profil.navn }]}
        stikkord="Gratis verktøy"
        tittel={profil.tittel}
        ingress={
          `Tallene under er typiske nivåer for ${profil.ubestemt} – bytt dem ut med dine egne, ` +
          'så har du svaret på et par minutter. Ingenting lagres, og du trenger ingen konto.'
        }
      />

      <Seksjon $tett>
        <Wrap>
          <Kortsvar>
            <p>
              <strong>Kort svar:</strong> {profil.kortsvar}
            </p>
          </Kortsvar>
        </Wrap>
      </Seksjon>

      <Seksjon $flate="tint" $tett>
        <Wrap>
          <Kalkulator standard={standard} />
        </Wrap>
      </Seksjon>

      <Seksjon $tett>
        <Wrap>
          <Prosa>
            <h2>Kostnadene som er spesielle for {profil.navn.toLowerCase()}</h2>
            <p>{profil.kostnadstekst}</p>

            <h2>Hvor mye av tiden kan du fakturere?</h2>
            <p>{profil.tidstekst}</p>

            <h2>Vanlige spørsmål</h2>
            {profil.sporsmal.map((s) => (
              <div key={s.sporsmal}>
                <h3>{s.sporsmal}</h3>
                <p>{s.svar}</p>
              </div>
            ))}

            <h2>Andre bransjer</h2>
            <p>Kostnadsbildet er ikke det samme i alle fag. Se hva som gjelder i ditt.</p>
          </Prosa>
          <Bransjeliste aria-label="Timepris i andre bransjer">
            {andre.map((b) => (
              <Bransjelenke key={b.slug} to={`/timepris/${b.slug}`}>
                {b.navn}
              </Bransjelenke>
            ))}
            <Bransjelenke to="/timepris">Alle bransjer</Bransjelenke>
          </Bransjeliste>

          <Prosa>
            <h2>Andre gratisverktøy</h2>
            <p>Regn videre på det samme tallgrunnlaget.</p>
          </Prosa>
          <Bransjeliste aria-label="Andre verktøy">
            <Bransjelenke to="/hva-ma-du-fakturere">Hvor mye må du fakturere?</Bransjelenke>
            <Bransjelenke to="/hva-koster-en-ansatt">Hva koster en ansatt?</Bransjelenke>
          </Bransjeliste>
        </Wrap>
      </Seksjon>

      <Avslutt />
    </>
  )
}

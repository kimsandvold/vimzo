import { kronerTilOre, oreTilKroner } from './kroner'
import type { Driftsform, Grunnlag } from './timepris'
import { KOSTNADSFELT } from '../data/timepris'

/**
 * Kalkylen bor i URL-en.
 *
 * Det gir tre ting gratis: den besøkende kan bokmerke resultatet, sende det
 * til regnskapsføreren sin, og komme tilbake til det i morgen – uten at vi
 * lagrer noe om hen. Ingen informasjonskapsel, ingenting å samtykke til.
 *
 * `standard` er utgangspunktet siden åpner med, og det er ikke det samme
 * overalt: /timepris starter blankt, mens /timepris/snekker starter med
 * typiske tall for snekkere. Bare det som avviker fra utgangspunktet havner i
 * adressefeltet, så en delt lenke er kort nok til at noen tør klikke på den.
 *
 * Et ugyldig eller manglende felt er ikke en feil. Da brukes utgangspunktet,
 * stille. Den som har klippet en halv adresse inn i nettleseren skal få en
 * kalkulator som virker.
 */

const PREFIKS = 'k_'

function lesTall(p: URLSearchParams, navn: string, standard: number): number {
  const rå = p.get(navn)
  if (rå === null) return standard
  const n = Number(rå)
  return Number.isFinite(n) && n >= 0 ? n : standard
}

const lesOre = (p: URLSearchParams, navn: string, standard: number): number =>
  kronerTilOre(lesTall(p, navn, oreTilKroner(standard)))

export function lesGrunnlag(p: URLSearchParams, standard: Grunnlag): Grunnlag {
  const drift = p.get('drift')
  const driftsform: Driftsform = drift === 'as' ? 'as' : drift === 'enk' ? 'enk' : standard.driftsform

  const fasteKostnader = { ...standard.fasteKostnader }
  for (const felt of KOSTNADSFELT) {
    fasteKostnader[felt.id] = lesOre(p, PREFIKS + felt.id, standard.fasteKostnader[felt.id])
  }

  const dagens = Number(p.get('dagens'))

  return {
    driftsform,
    onsketInntekt: lesOre(p, 'inntekt', standard.onsketInntekt),
    agaSone: p.get('sone') ?? standard.agaSone,
    fasteKostnader,
    arbeidsuker: lesTall(p, 'uker', standard.arbeidsuker),
    timerPerUke: lesTall(p, 'timer', standard.timerPerUke),
    fakturerbarAndel: lesTall(p, 'fakturerbar', standard.fakturerbarAndel),
    buffer: lesTall(p, 'buffer', standard.buffer),
    dagensTimepris: Number.isFinite(dagens) && dagens > 0 ? kronerTilOre(dagens) : null,
  }
}

export function skrivGrunnlag(g: Grunnlag, standard: Grunnlag): URLSearchParams {
  const p = new URLSearchParams()

  if (g.driftsform !== standard.driftsform) p.set('drift', g.driftsform)
  if (g.driftsform === 'as' && g.agaSone !== standard.agaSone) p.set('sone', g.agaSone)
  if (g.onsketInntekt !== standard.onsketInntekt) p.set('inntekt', String(oreTilKroner(g.onsketInntekt)))
  if (g.arbeidsuker !== standard.arbeidsuker) p.set('uker', String(g.arbeidsuker))
  if (g.timerPerUke !== standard.timerPerUke) p.set('timer', String(g.timerPerUke))
  if (g.fakturerbarAndel !== standard.fakturerbarAndel) p.set('fakturerbar', String(g.fakturerbarAndel))
  if (g.buffer !== standard.buffer) p.set('buffer', String(g.buffer))
  if (g.dagensTimepris !== null) p.set('dagens', String(oreTilKroner(g.dagensTimepris)))

  for (const felt of KOSTNADSFELT) {
    const verdi = g.fasteKostnader[felt.id]
    if (verdi !== standard.fasteKostnader[felt.id]) p.set(PREFIKS + felt.id, String(oreTilKroner(verdi)))
  }

  return p
}

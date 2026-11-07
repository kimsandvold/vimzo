import type { IkonNavn } from '../components/shared/Icon'
import {
  ANTALL_AVDRAG,
  avdragRamme,
  driftsnivaer,
  eieOver,
  formaterPris,
  formaterRamme,
  leggTil,
  pakker,
  tillegg as tilleggPris,
  type Driftsniva,
  type Pakke,
  type Prisramme,
} from './pakker'
import { BRANSJER, type Bransje } from './bransjer'

/**
 * Grunnlaget for kalkulatoren på forsiden.
 *
 * Den gamle veiviseren lot kunden velge farge, logo og mal. Det var feil jobb
 * å gi fra seg: målgruppen er folk som verken har tid eller lyst til å lage
 * nettsiden selv, og da er et fargehjul en oppgave, ikke et salgsargument.
 *
 * Denne stiller i stedet bare spørsmål som faktisk flytter et tall, og viser
 * svaret med én gang – hva det koster, og hva som inngår.
 *
 * Alle beløp utledes fra `pakker.ts`. Ingen pris er skrevet opp to ganger;
 * endrer du en pakke der, endrer forsiden seg med.
 */

/** Nøkkel i sessionStorage. Kontaktsiden leser briefet herfra. */
export const BRIEF_NOKKEL = 'vimzo-brief'

/* ------------------------------------------------------------------- svar */

export type Domenevalg = 'trenger' | 'har'
export type Omfang = 'enkel' | 'tjenestesider' | 'omfattende'
export type Bildevalg = 'har' | 'trenger'
export type Logovalg = 'har' | 'trenger' | 'profil'

export interface Svar {
  navn: string
  sted: string
  /**
   * Om kunden trenger et nytt domene eller allerede har et.
   *
   * Dette skillet er ikke pynt. En snekker som har drevet i ti år eier
   * allerede domenet sitt, og da er jobben en annen: vi skal peke det hit,
   * sette opp videresending fra de gamle adressene, og – viktigst – ikke
   * knekke e-posten som går på det i dag. Det er arbeid som må prises.
   *
   * Uten skillet ville dessuten ledig-sjekken fortalt ham at hans eget
   * domene er «opptatt».
   */
  domenevalg: Domenevalg
  /** Domenet han vil ha, eller det han allerede eier. Tomt er greit. */
  domene: string
  bransje: Bransje
  omfang: Omfang
  bilder: Bildevalg
  logo: Logovalg
  /** Verktøy som skal bygges inn i siden. Id-er fra `VERKTOY`. */
  verktoy: readonly string[]
}

export const STARTSVAR: Svar = {
  navn: '',
  sted: '',
  domenevalg: 'trenger',
  domene: '',
  bransje: BRANSJER[0],
  omfang: 'tjenestesider',
  bilder: 'trenger',
  logo: 'har',
  verktoy: [],
}

/** Tillegg som ikke er verktøy. Slått opp i `pakker.ts`, så prissiden og kalkulatoren aldri er uenige. */
const TILLEGG = {
  foto: tilleggPris('Foto og dronevideo').pris,
  logo: tilleggPris('Logo').pris,
  profil: tilleggPris('Visuell profil').pris,
} as const

/* -------------------------------------------------------------- spørsmål */

export interface Alternativ<T extends string | boolean> {
  verdi: T
  navn: string
  /** Står under navnet. Konsekvensen, sagt rett ut. */
  hint: string
  /**
   * Hva valget koster, når det koster noe.
   *
   * Sto ikke her før, og da valgte kunden «kom og ta bilder» uten å vite hva
   * det koster. Et valg som flytter prisen skal si det der valget
   * tas – ikke først i estimatet ved siden av.
   */
  pris?: number
  fraPris?: boolean
}

export const OMFANG: readonly Alternativ<Omfang>[] = [
  { verdi: 'enkel', navn: 'Én side holder', hint: 'Hvem vi er, hva vi gjør, ta kontakt' },
  { verdi: 'tjenestesider', navn: 'Egen side per tjeneste', hint: 'Hver tjeneste kan treffe i Google for seg' },
  { verdi: 'omfattende', navn: 'Mer enn det', hint: 'Flere steder, produkter eller fagstoff' },
]

export const BILDER: readonly Alternativ<Bildevalg>[] = [
  { verdi: 'har', navn: 'Jeg har bilder', hint: 'Du sender det du har, vi rydder i dem' },
  { verdi: 'trenger', navn: 'Kom og ta dem', hint: 'Lokaler, folk og arbeid – du eier bildene', pris: TILLEGG.foto, fraPris: true },
]

export const LOGO: readonly Alternativ<Logovalg>[] = [
  { verdi: 'har', navn: 'Jeg har logo', hint: 'Vi bruker den du har' },
  { verdi: 'trenger', navn: 'Lag en logo', hint: 'Tre forslag, du velger én', pris: TILLEGG.logo },
  { verdi: 'profil', navn: 'Hele profilen', hint: 'Logo, farger og skrift – til bil og skilt også', pris: TILLEGG.profil },
]

/**
 * Forslag til domene ut fra firmanavnet.
 *
 * Brukes som plassholder, ikke som verdi – kunden skal se hva han ville fått
 * uten at vi fyller ut noe på hans vegne. Æ, ø og å skrives om selv om .no
 * tillater dem: en rørlegger som må stave «rør» i en adresse over telefon,
 * angrer.
 */
export function foreslaDomene(navn: string): string {
  const reint = navn
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return reint ? `${reint}.no` : ''
}

/* ----------------------------------------------------------------- verktøy */

/**
 * Verktøyene vi kan bygge inn i siden.
 *
 * Alle hører hjemme hos en bedrift som selger tid og fagkunnskap, ikke varer.
 * «Enkel varebestilling» sto her en stund og er fjernet: det er en nettbutikk
 * i miniatyr, og vi lager ikke nettbutikker. Halvveis varehandel – uten lager,
 * frakt og betaling – hjelper verken kunden eller oss.
 *
 * Dette er stedet der «hva får jeg» blir konkret. Et tilbudsskjema eller en
 * timebok er lettere å kjenne igjen enn «8 sider», og hvert valg flytter
 * tallet med én gang – det er hele poenget med kalkulatoren.
 *
 * Alt bygges inn i kundens egen side, så det påløper ingen månedsavgift til
 * en tredjepart. Verktøy som tar imot opplysninger lagrer dem i Europa –
 * ikke «ingen steder», og ikke «bare i Norge». Se `lagrerData` nedenfor.
 *
 * Ankeret er «Regneverktøy eller kalkulator» i `pakker.ts`. De enkle,
 * like-hver-gang-verktøyene (omtaler, døgnvakt) har fast pris under det.
 */
export interface Verktoy {
  id: string
  navn: string
  ikon: IkonNavn
  /** Én linje: hva kunden din faktisk kan gjøre. */
  hint: string
  pris: number
  /**
   * Sant når prisen avhenger av omfang.
   *
   * Det gjelder nesten alt her: en priskalkulator for en rørlegger er en
   * annen jobb enn en for en anleggsgartner, og en timebok for én ansatt er
   * ikke den samme som for seks. Da skal det stå «fra», ikke
   * et tall som ser endelig ut. De to som faktisk er like hver gang –
   * omtaler og døgnvakt – har fast pris.
   */
  fraPris?: boolean
  /**
   * Sant når verktøyet tar imot og lagrer data fra kundens kunder.
   *
   * Flytter ikke lenger prisen – driften er én pris uansett – men sier hvilke
   * verktøy som trenger database og databehandleransvar bak seg.
   */
  lagrerData?: boolean
}

export const VERKTOY: readonly Verktoy[] = [
  { id: 'befaring', navn: 'Bestill befaring', ikon: 'kamera', hint: 'Kunden sender bilde av problemet og får et anslag', pris: tilleggPris('Regneverktøy eller kalkulator').pris, fraPris: true, lagrerData: true },
  { id: 'timebestilling', navn: 'Timebestilling', ikon: 'klokke', hint: 'Kunden booker ledig tid, begge får bekreftelse', pris: tilleggPris('Regneverktøy eller kalkulator').pris, fraPris: true, lagrerData: true },
  { id: 'kalkulator', navn: 'Priskalkulator', ikon: 'graf', hint: 'Kunden regner ut prisen sin selv, før han ringer', pris: tilleggPris('Regneverktøy eller kalkulator').pris, fraPris: true },
  { id: 'omtaler', navn: 'Google-omtaler', ikon: 'gnist', hint: 'Stjernene hentes inn og bakes rett i siden', pris: 3900 },
  { id: 'stillinger', navn: 'Ledige stillinger', ikon: 'samtale', hint: 'Jobbsøkere søker på siden, med CV vedlagt', pris: tilleggPris('Regneverktøy eller kalkulator').pris, fraPris: true, lagrerData: true },
  { id: 'tredim', navn: '3D-visning av produkt', ikon: 'kode', hint: 'Kunden snur på produktet, velger mål og ser prisen endre seg', pris: tilleggPris('3D-visning og designverktøy').pris, fraPris: true },
  { id: 'dognvakt', navn: 'Døgnvakt og «åpent nå»', ikon: 'lyn', hint: 'Viser om du er på vakt akkurat nå, med riktig nummer', pris: 2900 },
  { id: 'reklamasjon', navn: 'Reklamasjon og klage', ikon: 'skjold', hint: 'Saksnummer og vedlegg, så du har papirene i orden', pris: 6900, fraPris: true, lagrerData: true },
]

/* ---------------------------------------------------------------- utregning */


export interface Linje {
  navn: string
  /** 0 når noe inngår i pakken. */
  pris: number
  /** Sant når pakken allerede dekker det – da skrives «inngår» i stedet for et beløp. */
  dekket: boolean
  /** Sant når beløpet er et fra-beløp og avhenger av omfang. */
  fraPris?: boolean
}

export interface Estimat {
  pakke: Pakke
  /** Det pakken dekker, ordrett fra `pakker.ts`. */
  inkludert: readonly string[]
  /** Tilleggene svarene utløste. Tom liste er et helt gyldig svar. */
  tillegg: readonly Linje[]
  /**
   * Hvor prosjektet sannsynligvis lander: pakkens spenn pluss tilleggene.
   * Et anslag, ikke en pris – den avtales etter en prat.
   */
  ramme: Prisramme
  /** Spennet delt over tolv avdrag. Vises lite – det er ikke hovedtallet. */
  avdrag: Prisramme
  /** Den løpende driften. Kommer i tillegg – aldri slått sammen med bygget. */
  drift: Driftsniva
  /** Bygget pluss tre års drift. Det ærligste tallet for hva siden koster å ha. */
  treAr: Prisramme
  omfang: string
}

/*
 * Merk at estimatet ikke inneholder noen leveringsdato.
 *
 * Det er med vilje. Hvor lang tid en side tar avhenger av omfang, om vi må ut
 * og ta bilder, og – oftest – hvor fort kunden får sagt det vi trenger å vite.
 * Et tall her ville vært gjetting, og en dato man gjetter på er en dato man
 * bryter. Datoen avtales i samtalen, og står i tilbudet.
 */

/**
 * Hvilken pakke svarene lander på.
 *
 * Kunden velger aldri pakke selv. Det er hele poenget – spør du en rørlegger
 * om han trenger «Bedrift» eller «Vekst», har du gitt ham jobben din. Spør du
 * om hver tjeneste skal kunne treffe i Google, kan han svare.
 */
function velgPakke(svar: Svar): Pakke {
  const id = svar.omfang === 'omfattende' ? 'vekst' : svar.omfang === 'tjenestesider' ? 'bedrift' : 'start'
  return pakker.find((p) => p.id === id) ?? pakker[0]
}

/**
 * Sant når pakken svarene lander på allerede dekker fotojobben.
 *
 * Bedrift og Vekst inneholder foto. Velger kunden «kom og ta dem» og havner
 * der, skal valget si «inngår» – ikke «fra 6 900». Ellers ser det ut som vi
 * tar betalt to ganger for det samme.
 */
export function fotoInngar(svar: Svar): boolean {
  return velgPakke(svar).id !== 'start'
}

/**
 * Vekst inneholder «Priskalkulator eller booking» – ordrett, med «eller».
 * Altså dekkes nøyaktig ett av de to, og bare i Vekst. Velger kunden begge,
 * skal det andre koste. Å runde av her ville gjort prissiden til en løgn.
 */
const DEKKET_AV_VEKST = ['kalkulator', 'timebestilling']

/**
 * Regn ut estimatet.
 *
 * Den eneste regelen som betyr noe her: et tillegg koster bare penger når
 * pakken ikke allerede dekker det. Bedrift inneholder en halv dag foto, så
 * svarer kunden «kom og ta bilder» og havner i Bedrift, skal det stå «inngår»
 * – ikke «+ 6 900». Ellers ville forsiden motsagt prissiden, og da er en
 * kalkulator verre enn ingen kalkulator.
 */
export function regnUt(svar: Svar): Estimat {
  const pakke = velgPakke(svar)
  const tillegg: Linje[] = []

  if (svar.bilder === 'trenger') {
    const dekket = pakke.id !== 'start'
    tillegg.push({ navn: dekket ? 'Foto hos deg' : 'Foto hos deg, halv dag', pris: dekket ? 0 : TILLEGG.foto, dekket, fraPris: !dekket })
  }

  if (svar.logo === 'trenger') {
    tillegg.push({ navn: 'Logo, tre forslag', pris: TILLEGG.logo, dekket: false })
  } else if (svar.logo === 'profil') {
    tillegg.push({ navn: 'Visuell profil med logo', pris: TILLEGG.profil, dekket: false })
  }

  let gratisIVekst = pakke.id === 'vekst'
  for (const id of svar.verktoy) {
    const v = VERKTOY.find((x) => x.id === id)
    if (!v) continue
    const dekket = gratisIVekst && DEKKET_AV_VEKST.includes(v.id)
    if (dekket) gratisIVekst = false
    tillegg.push({ navn: v.navn, pris: dekket ? 0 : v.pris, dekket, fraPris: !dekket && v.fraPris })
  }

  const ramme = leggTil(pakke.pris, tillegg.reduce((sum, l) => sum + l.pris, 0))

  /** Én driftspris for alle. Valgene over flytter bygget, ikke månedsprisen. */
  const drift = driftsnivaer[0]

  return {
    pakke,
    inkludert: pakke.punkter,
    tillegg,
    ramme,
    avdrag: avdragRamme(ramme),
    drift,
    treAr: eieOver(ramme),
    omfang: pakke.omfang,
  }
}

/**
 * Oppsummer svarene som lesbar tekst til kontaktskjemaet.
 *
 * Poenget er at første svar fra oss kan være et reelt tilbud i stedet for
 * tjue spørsmål. Derfor står estimatet med i briefet – da vet begge parter
 * hva samtalen handler om.
 */
export function lagBrief(svar: Svar, estimat: Estimat): string {
  const linjer = [
    `Bedrift: ${svar.navn || '(ikke oppgitt)'}${svar.sted ? `, ${svar.sted}` : ''}`,
    `Bransje: ${svar.bransje.navn}`,
    svar.domenevalg === 'har'
      ? `Domene: har allerede ${svar.domene.trim() || '(ikke oppgitt)'} – må pekes hit, sjekk e-post og gamle lenker`
      : `Domene: trenger nytt. Ønske: ${svar.domene.trim() || 'ingen – vi foreslår'}`,
    '',
    `Omfang: ${OMFANG.find((o) => o.verdi === svar.omfang)?.navn}`,
    `Bilder: ${BILDER.find((b) => b.verdi === svar.bilder)?.navn}`,
    `Logo: ${LOGO.find((l) => l.verdi === svar.logo)?.navn}`,
    `Verktøy: ${svar.verktoy.length ? VERKTOY.filter((v) => svar.verktoy.includes(v.id)).map((v) => v.navn).join(', ') : 'Ingen'}`,
    '',
    `Ligner mest på: ${estimat.pakke.navn} (${estimat.omfang}).`,
  ]

  const betalte = estimat.tillegg.filter((t) => !t.dekket)
  if (betalte.length) {
    linjer.push('', 'Tillegg:', ...betalte.map((t) => `  – ${t.navn}: ${t.fraPris ? 'fra ' : ''}${formaterPris(t.pris)} kr`))
  }

  linjer.push(
    '',
    `Anslag: ${formaterRamme(estimat.ramme)} kr, eller ${formaterRamme(estimat.avdrag)} kr/mnd over ${ANTALL_AVDRAG} måneder.`,
    `Drift: ${estimat.drift.pris} kr/mnd.`,
    '',
    'Anslag fra kalkulatoren på forsiden – den endelige prisen avtales etter en prat. Alle beløp er eks. mva.',
  )

  return linjer.join('\n')
}

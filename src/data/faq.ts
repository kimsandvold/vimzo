import { AVDRAGSPASLAG, arrangement, domenepris, drift, formaterPris, formaterRamme, minsteEndring, pakker, tillegg, timepris } from './pakker'

/**
 * Spørsmål og svar. Dette er den enkeltseksjonen som gir mest igjen for
 * AI-synlighet: svarene publiseres både som lesbar tekst og som `FAQPage` i
 * strukturerte data, og de er formulert slik at de kan siteres ordrett.
 *
 * Regler for svarene: ett svar skal stå på egne ben uten spørsmålet, det skal
 * inneholde et konkret tall eller en konkret handling, og det skal være sant.
 */

export interface Sporsmal {
  sporsmal: string
  svar: string
  /** Hvilke sider spørsmålet vises på. 'alle' = forsiden og prissiden. */
  tema: 'pris' | 'prosess' | 'teknisk' | 'synlighet' | 'arrangement'
}

export const faq: readonly Sporsmal[] = [
  {
    tema: 'pris',
    sporsmal: 'Hva koster en nettside hos Vimzo?',
    svar:
      `En liten side på én til tre sider lander typisk på ${formaterRamme(pakker[0].pris)} ` +
      `kroner eks. mva., og en bedriftsside på fire til åtte sider på ${formaterRamme(pakker[1].pris)}. ` +
      `Sider med kalkulator, booking eller andre verktøy starter på ${formaterPris(pakker[2].pris.fra)}. ` +
      'Hver side lages for én bedrift, så den endelige prisen avtaler vi etter en prat – ' +
      'skriftlig, og den endrer seg ikke underveis. Beløpet kan deles over tolv måneder.',
  },
  {
    tema: 'pris',
    sporsmal: 'Kommer det løpende kostnader i tillegg?',
    svar:
      `Drift koster ${drift.pris} kroner i måneden – én pris uansett hva siden gjør. Den dekker ` +
      'webhotell, fornyelse av domenet, sikkerhetskopi hver dag og varsling hvis siden går ' +
      'ned. Endringer på innholdet faktureres for seg. Driften er lav fordi det er lite å drifte: siden er ferdige filer uten database ' +
      'eller tillegg som må oppdateres. Første års domene er inkludert; etter det koster det ' +
      `rundt ${domenepris} kroner i året. Det finnes ingen lisenser å betale for.`,
  },
  {
    tema: 'prosess',
    sporsmal: 'Hvor lang tid tar det å få siden på nett?',
    svar:
      'Typisk to til tre uker for en liten side, og tre til fem uker for en bedriftsside. ' +
      'Den nøyaktige leveringsdatoen står i tilbudet, og tiden regnes fra du har godkjent ' +
      'det. Det som oftest forsinker et prosjekt er bilder og godkjenning av tekst, så vi ' +
      'avtaler frister for begge deler i første møte.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Hvor mye må jeg gjøre selv?',
    svar:
      'Omtrent to timer til sammen. Du tar én prat med oss i starten om hva bedriften gjør, og ' +
      'leser gjennom før vi publiserer. Resten ordner vi: domene, tekst, bilder, design, ' +
      'publisering og Google. Du trenger ikke skrive noe, og du trenger ikke kunne noe teknisk.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Ordner dere domenet, eller må jeg kjøpe det selv?',
    svar:
      'Vi ordner det. Vi finner et ledig domenenavn sammen med deg, kjøper det og registrerer ' +
      'det i ditt navn – ikke i vårt. Første år er inkludert i prisen, og etter det fornyer vi ' +
      'det for deg til omtrent 169 kroner i året. Vi setter også opp e-post på domenet.',
  },
  {
    tema: 'pris',
    sporsmal: 'Kan jeg dele opp betalingen?',
    svar:
      'Ja. Beløpet kan deles over tolv måneder, med 0 kroner i oppstart. Det er ingen renter ' +
      `og ingen kredittsjekk; påslaget er ${Math.round(AVDRAGSPASLAG * 100)} %, og det står i ` +
      'tilbudet, så du ser nøyaktig hva forskjellen er.',
  },
  {
    tema: 'teknisk',
    sporsmal: 'Kan dere lage en priskalkulator eller et bookingskjema?',
    svar:
      `Ja. Vi bygger regneverktøy for det du selger, fra ${formaterPris(tillegg('Regneverktøy eller kalkulator').pris)} ` +
      'kroner – priskalkulator, tilbudsskjema i flere steg, eller booking med bekreftelse ' +
      'på e-post. Verktøyet ligger i din egen side, uten lisens eller abonnement på selve ' +
      'verktøyet. Hva det koster avhenger av hva det skal regne ut, så prisen setter vi ' +
      'etter en prat.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Lager dere nettbutikker?',
    svar:
      'Nei. Vi lager sider for bedrifter som selger tjenester – håndverkere, frisører, ' +
      'fotpleiere, verksteder, renholdere og rådgivere. Skal du selge varer med lager, frakt ' +
      'og betaling på nett, trenger du en ekte nettbutikkløsning, og det sier vi med én gang ' +
      'i stedet for å bygge noe halvveis. Timebestilling, befaring og forespørsler ordner vi ' +
      'gjerne – det er varehandelen vi holder oss unna.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Er dere norske?',
    svar:
      'Ja, helt igjennom. Vimzo drives fra Lillehammer av Kim Sandvold. Det er han som tar ' +
      'praten, skriver tekstene og koder siden – ingenting settes ut til utlandet. All ' +
      'kommunikasjon, alle tekster og all support er på norsk.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Må jeg skrive tekstene selv?',
    svar:
      'Nei. Vi intervjuer deg i omtrent en time om hva bedriften gjør, og skriver sidene ' +
      'ferdig på norsk. Du leser gjennom og godkjenner alt før det publiseres. Vil du ' +
      'skrive selv, trekker vi det fra prisen.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Hva koster det å endre noe etterpå?',
    svar:
      `Endringer faktureres med ${formaterPris(timepris)} kroner timen, per påbegynte halvtime. ` +
      `Et nytt telefonnummer eller nye åpningstider koster altså ${formaterPris(minsteEndring)} ` +
      `kroner. En ny side har fast pris fra ${formaterPris(tillegg('Ekstra side').pris)} kroner, ` +
      `en fagartikkel ${formaterPris(tillegg('Fagartikkel').pris)}. Ved større jobber får du ` +
      'alltid et anslag før vi begynner.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Hvorfor får vi ikke et fullt publiseringssystem som WordPress?',
    svar:
      'Fordi det sjelden gjør siden bedre, og alltid gjør den dyrere. Å skrive innhold som ' +
      'både leser godt og rangerer er et fag, og en nettside eieren skal fylle selv mellom ' +
      'alt annet, forfaller nesten alltid. Derfor skriver og oppdaterer vi innholdet, og du ' +
      'betaler for timene det faktisk tar – i stedet for lisens og vedlikehold hver måned for ' +
      'et system du bruker to ganger i året. Siden blir også raskere og tryggere ' +
      'av å være rene filer uten innlogging.',
  },
  {
    tema: 'teknisk',
    sporsmal: 'Hva betyr det at nettsiden er headless?',
    svar:
      'At innhold og presentasjon er skilt fra hverandre. Selve sidene leveres som ferdig ' +
      'HTML, mens de få feltene du kan endre selv – kontaktinfo, ' +
      'åpningstider, priser – ligger i en database (Firebase). Siden henter dem når den ' +
      'vises, og den forhåndsrendrede HTML-en inneholder alltid siste kjente verdi. Dermed ' +
      'ser både Google og AI-assistenter riktig innhold selv uten å kjøre JavaScript, og du ' +
      'slipper en server som skal holdes i live.',
  },
  {
    tema: 'teknisk',
    sporsmal: 'Hvorfor ikke WordPress?',
    svar:
      'WordPress bygger siden på nytt for hver besøkende og er avhengig av plugins som må ' +
      'oppdateres, koster penger og er den vanligste årsaken til at norske bedriftssider ' +
      'blir hacket. Vi bygger siden ferdig én gang og leverer den som statiske filer. Det ' +
      'gir raskere sider, lavere drift og ingenting å vedlikeholde.',
  },
  {
    tema: 'teknisk',
    sporsmal: 'Hvem eier nettsiden når den er ferdig?',
    svar:
      'Du gjør. Du får all kildekode, domenet står i ditt navn, og innholdet er ditt. ' +
      'Du kan ta med deg hele siden til en annen leverandør når som helst, uten å be oss ' +
      'om tillatelse og uten å miste noe.',
  },
  {
    tema: 'teknisk',
    sporsmal: 'Hvor rask blir siden?',
    svar:
      'Målet vårt er under ett sekund til innholdet vises, og minst 95 poeng på alle fire ' +
      'områder i Google Lighthouse. Vi måler før lansering og sender deg rapporten. Ligger ' +
      'tallene under, retter vi det uten ekstra kostnad før siden går live.',
  },
  {
    tema: 'synlighet',
    sporsmal: 'Hva vil det si at siden er optimalisert for AI-agenter?',
    svar:
      'AI-assistenter som ChatGPT, Claude, Perplexity og Google AI leser rå HTML og kjører ' +
      'som regel ikke JavaScript. Siden vi leverer ferdig rendret HTML, ser de alt ' +
      'innholdet. I tillegg merker vi opp fakta med schema.org, legger ved en llms.txt som ' +
      'forklarer hva bedriften tilbyr, og skriver svarene dine slik at de kan siteres ordrett.',
  },
  {
    tema: 'synlighet',
    sporsmal: 'Kan dere garantere at vi kommer først på Google?',
    svar:
      'Nei, og ingen seriøs leverandør kan det. Det vi garanterer er grunnlaget: riktig ' +
      'teknisk oppsett, innhold som svarer på det folk faktisk søker etter, og måling som ' +
      'viser hva som virker. Garanterer noen førsteplass, bør du spørre hvilket søkeord – ' +
      'svaret er som regel bedriftens eget navn.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Må vi skaffe bildene selv?',
    svar:
      'Nei. Vi kommer gjerne ut og fotograferer bedriften, lokalene, produktene og folkene ' +
      'som jobber der, og filmer med drone når motivet fortjener det. Egne bilder gjør mer ' +
      'for troverdigheten enn noe annet på en bedriftsside, og de gir i tillegg bildetreff i ' +
      'Google som en kjøpt arkivbilde aldri gir.',
  },
  {
    tema: 'prosess',
    sporsmal: 'Jobber dere bare på Lillehammer?',
    svar:
      'Nei. Vi holder til på Lillehammer og møter gjerne kunder i Innlandet ansikt til ' +
      'ansikt, men hele prosessen fungerer på video og e-post. Vi leverer til bedrifter i ' +
      'hele Norge.',
  },
  {
    tema: 'arrangement',
    sporsmal: 'Hva koster en nettside til et arrangement?',
    svar:
      `En arrangementsside lander typisk på ${formaterRamme(arrangement.pris)} kroner eks. mva., ` +
      `med ${arrangement.driftInkludertMnd} måneders drift inkludert. Egen påmelding kommer i ` +
      `tillegg, fra ${formaterPris(tillegg('Påmelding til arrangement').pris)} kroner. Den endelige ` +
      'prisen avtaler vi etter en kort prat, skriftlig.',
  },
  {
    tema: 'arrangement',
    sporsmal: 'Hvor fort kan dere lage en side til messen eller konferansen vår?',
    svar:
      'Vanligvis på én til to uker fra vi har snakket sammen og fått program og praktisk ' +
      'informasjon. Haster det mer enn det, si fra – en enkel side kan ofte stå klar raskere.',
  },
  {
    tema: 'arrangement',
    sporsmal: 'Hva skjer med siden etter arrangementet?',
    svar:
      `Driften i ${arrangement.driftInkludertMnd} måneder er med i prisen. Etterpå kan siden bli en ` +
      '«takk for i år»-side med bilder og dato for neste gang, den kan tas ned, eller vi kan ' +
      'holde den oppe videre for vanlig driftspris.',
  },
  {
    tema: 'arrangement',
    sporsmal: 'Kan vi bruke siden igjen neste år?',
    svar:
      'Ja. Designet står, så neste utgave handler om nye datoer, nytt program og nye bilder. ' +
      `Det koster fra ${formaterPris(tillegg('Ny utgave av arrangementsside').pris)} kroner.`,
  },
  {
    tema: 'arrangement',
    sporsmal: 'Trenger vi eget domene?',
    svar:
      'Nei. Har dere et domene fra før, legger vi siden på en egen adresse under det, som ' +
      'messe.firma.no. Vil dere ha et eget domene for arrangementet, ordner vi det.',
  },
] as const

/** Hent spørsmålene for ett tema, eller alle når ingen tema er oppgitt. */
export function faqFor(...temaer: Sporsmal['tema'][]): readonly Sporsmal[] {
  if (temaer.length === 0) return faq
  return faq.filter((s) => temaer.includes(s.tema))
}

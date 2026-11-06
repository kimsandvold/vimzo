# Designprinsipper for vimzo.no

Målet med nettstedet er ikke å se pent ut. Det er at en rørlegger som aldri
har kjøpt en nettside skal tørre å ta kontakt. Alt under er skrevet for å
kunne etterprøves, ikke diskuteres som smak.

## Først: hva som faktisk er forskningsstøttet

Det er fristende å hevde at «grønt betyr tillit». Det gjør det ikke –
forskning på farge og følelser er svak og sterkt kulturavhengig, og den tåler
ikke vekten folk legger på den. Vi bygger derfor på det som faktisk holder:

**Godt dokumentert, og det vi styrer etter:**

| Prinsipp | Hva det betyr her | Kilde/standard |
| --- | --- | --- |
| Kontrast | All tekst ≥ 4.5:1, store overskrifter ≥ 3:1 | WCAG 2.1 AA |
| Klikkflater | Minst 44 × 44 px | WCAG 2.5.5, Apple HIG |
| Synlige ledetekster | Aldri bare plassholder i et skjemafelt | NN/g, Baymard |
| Linjelengde | 50–75 tegn i brødtekst | Lesbarhetsforskning |
| Synlig fokus | Tastaturfokus skal alltid kunne ses | WCAG 2.4.7 |
| Redusert bevegelse | Animasjon slås av, ikke dempes | WCAG 2.3.3 |
| Åpne priser | Skjult pris øker avbruddsrate | Baymard |
| Navngitte mennesker | Navn og ansikt slår «vi i teamet» | NN/g, Cialdini |
| Forutsigbarhet | Samme element oppfører seg likt overalt | Jakob's law |

**Svakere, men retningsgivende** – vi bruker det bevisst, uten å kalle det
vitenskap: varme fargetoner, runde former og menneskelige motiver oppfattes
som mer imøtekommende enn kalde toner og skarpe hjørner. Det er grunnen til
at paletten er varm. Det er en designbeslutning, ikke et forskningsfunn.

## Paletten

Nettstedet er **varmt, ikke kaldt**. Gråtonene ligger på ~35° hue – de leser
som papir, ikke som skjerm. Det er ingen rene blåtoner noe sted.

| Rolle | Verdi | Hvorfor |
| --- | --- | --- |
| Lerret | `#FBF7F0` krem | Varmt papir. Rent hvitt leser klinisk |
| Flate | `#FFFFFF` | Hevede kort, løftet med skygge |
| Sand | `#F4EEE4` | Rolige mellomseksjoner |
| Dyp | `#1C1813` espresso | Mørke felt. Brunsvart, aldri blåsvart |
| Blekk | `#1C1813` | Varm nesten-svart |
| Aksent | `#1F6A4C` furugrønn | Rolig, nordisk, ikke korporativ blå |
| Varm aksent | `#9A5B18` honning | Tall, merkelapper, det som skal gløde |

Én aksent bærer alt interaktivt. Honning brukes bare til å varme opp – aldri
som andre knappefarge, for da mister den første sin betydning.

## Form

- **Runde hjørner.** 16–36 px. Skarpe hjørner leser som systemverktøy.
- **Skygger, ikke streker.** En strek deler; en skygge løfter. Streker brukes
  bare der en liste faktisk trenger radskille.
- **Luft framfor bokser.** Blir noe utydelig er svaret større grad eller mer
  tomrom – ikke en ramme rundt.

## Tekst

- Brødtekst 17 px, linjehøyde 1.6–1.75.
- Overskrifter store og stramt sporet. Hierarkiet bæres av grad, ikke farge.
- **Ingen floskler.** «Skreddersydde helhetsløsninger» kan hverken en kunde
  eller en språkmodell gjengi. «Fra 14 900 kr, ferdig på to uker» kan begge.
- Skriv som man snakker. Kort setning foran lang.

## Tillit – konkret

Dette er ikke pynt. Hvert punkt fjerner en reell innvending:

1. **Prisene står åpent.** Også det den løpende driften koster.
2. **Et navngitt menneske.** Ikke «teamet».
3. **Ingen mørke mønstre.** Ingen falsk knapphet, ingen «3 andre ser på
   denne siden nå», ingen forhåndshuket avkrysning.
4. **Tall vi har målt.** Aldri anslag presentert som resultat.
5. **Tomme felter skjuler seg selv.** Står ikke org.nr i `firma.ts`, vises
   det ikke – vi publiserer aldri en opplysning vi ikke har.
6. **Kunden eier alt.** Og det står på siden, ikke i småskriften.

## Bevegelse

Innsig på 0.85 s med mykt utløp, forskjøvet i gitre. Aldri noe som spretter,
blinker eller krever at man venter. `prefers-reduced-motion` slår det helt av.

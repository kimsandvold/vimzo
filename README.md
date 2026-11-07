# vimzo.no

Nettstedet til Vimzo – som lager håndkodede, forhåndsrendrede nettsider for
små og mellomstore bedrifter.

Siden er bygget på nøyaktig samme måte som dem vi selger. Det er poenget: den
er selv beviset. Ingen tredjeparts-script, ingen informasjonskapsler, ingen
ikonbibliotek, og hver rute leveres som ferdig HTML.

## Kom i gang

```bash
npm install
npm run dev          # utviklingsserver
npm run build        # typesjekk → sitemap + llms.txt → vite build → forhåndsrendring
npm run preview      # se det ferdige bygget lokalt
```

| Kommando | Hva den gjør |
| --- | --- |
| `npm run dev` | Vite-dev-server med HMR |
| `npm run build` | Hele kjeden: `tsc -b`, sitemap/llms.txt, `vite build`, forhåndsrendring |
| `npm run sitemap` | Bare `public/sitemap.xml` og `public/llms.txt` |
| `npm run prerender` | Bare forhåndsrendringen (krever et eksisterende `dist/`) |
| `npm run og` | Tegner `public/images/og/vimzo.png` og `public/apple-touch-icon.png` på nytt |
| `npm run lint` | ESLint |

## Slik henger det sammen

Appen er en vanlig React-app som rendres klient-side. Forskjellen ligger i
byggesteget: etter `vite build` starter `scripts/prerender.mjs` en headless
Chromium, besøker hver rute fra `sitemap.xml` og lagrer ferdig rendret DOM –
med `<title>`, meta, canonical, OG og JSON-LD – som statisk HTML:

```
dist/index.html
dist/priser/index.html
dist/guider/hva-koster-en-nettside/index.html
```

Besøkende får den statiske filen først, og React overtar i bakgrunnen.
Søkemotorer og AI-assistenter trenger aldri å kjøre JavaScript for å se
innholdet.

### Alt innhold ligger i `src/data/`

| Fil | Innhold |
| --- | --- |
| `firma.ts` | Foretaksopplysninger. Tomme felter skjuler seg selv i visningen |
| `tjenester.ts` | De åtte tjenestene, med hva som inngår i hver |
| `pakker.ts` | Pakkepriser, drift, tillegg og timepris |
| `prosess.ts` | De fem stegene fra samtale til lansering |
| `faq.ts` | Spørsmål og svar – brukes både som tekst og som `FAQPage` |
| `cases.ts` | Leverte prosjekter |
| `guider.ts` | Fagartiklene, som strukturert data framfor ferdig HTML |

Endrer du en pris i `pakker.ts`, slår det gjennom på forsiden, prissiden,
kontaktskjemaet, strukturerte data **og** i `llms.txt`. Det finnes med vilje
ingen andre steder å redigere den.

Ny guide eller nytt prosjekt? Legg det til i datafila. `generate-sitemap.mjs`
leser den, URL-en havner i sitemap-en, og `prerender.mjs` forhåndsrendrer den.
Ingenting må registreres to steder – bortsett fra ruta, som legges inn i
`src/routes.ts`.

### SEO og AI-synlighet

* `src/hooks/useSEO.ts` setter tittel, meta, canonical, OG/Twitter og JSON-LD.
* `src/lib/jsonLd.ts` bygger de strukturerte dataene: `ProfessionalService`,
  `WebSite`, `Service`, `FAQPage`, `BreadcrumbList`, `Article`.
* `public/llms.txt` genereres fra datafilene ved hvert bygg.
* `public/robots.txt` slipper alle roboter inn, også AI-robotene.

### Design

Alle tokens ligger i `src/styles/theme.ts`. Palette: kaldnøytral gråskala på
~220° hue, én indigo aksent. Alle tekstfarger er kontrastsjekket mot flatene
de brukes på (AA, 4.5:1). Flatene følger en rytme – `paper`, `surface`,
`sunken`, `deep`, `aksent` – der to naboseksjoner aldri deler flate.

Ikonene ligger som rå SVG-baner i `src/components/shared/Icon.tsx`. Et
ikonbibliotek ville kostet titalls kilobyte JavaScript for å tegne ti streker.

## Før lansering

1. Fyll inn `orgNr` og `juridiskNavn` i `src/data/firma.ts`. Telefon, adresse og
   e-post skal ikke vises noe sted – all kontakt går via kontaktskjemaet.
   Alt som leser dem skjuler seg selv så lenge de er tomme.
2. Juster beløpene i `src/data/pakker.ts` til det du faktisk vil ta.
3. Sett opp EmailJS og legg de tre `VITE_EMAILJS_*`-verdiene i `.env` (se
   `.env.example`). Både kontaktskjemaet og kalkulatoren sender via den. Uten
   dem åpner skjemaene en ferdig utfylt e-post i stedet. Fyll også inn
   databehandler-TODO-en i `PersonvernSide.tsx`.
4. Legg inn flere prosjekter i `src/data/cases.ts` etter hvert som de lanseres –
   og bare med tall som er målt.
5. Meld `https://vimzo.no/sitemap.xml` inn i Google Search Console.

## Neste prosjekt: Vimzo-panelet

Panelet som kundene får – der de selv endrer kontaktinfo, åpningstider, priser
og korte tjenestedetaljer – er beskrevet på nettstedet, men ikke bygget ennå.
Planen er Firebase Auth (Google eller e-post/passord) og Firestore, med de
redigerbare feltene som en liten, fast datamodell. Nettsidene vi leverer blir
da headless: statisk HTML fra CDN, med de få foranderlige feltene hentet fra
databasen – og siste kjente verdi bakt inn i den forhåndsrendrede HTML-en, så
innholdet er riktig også uten JavaScript.

## Publisering

`dist/` er rene statiske filer og kan legges hvor som helst. `vercel.json`
ligger klar med `cleanUrls`, cache-hoder for `assets/` og `fonts/`, og
sikkerhetshoder. På en annen vert trengs bare at `/priser` serverer
`/priser/index.html`.

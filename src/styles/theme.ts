/**
 * Designtokens for vimzo.no
 *
 * Retningen er presis og lys. Nettstedet selger fast pris og tydelig omfang,
 * og da må flatene se ut som noen har talt opp noe – ikke som et stemningsbilde.
 * Derfor er gråskalaen nesten nøytral (en hårfin varm snert, ~70°, for å unngå
 * at hvitt leser klinisk) og aksenten er mettet i stedet for dempet.
 *
 * Fire regler som holder uttrykket samlet:
 *   1. Én aksent bærer alt interaktivt. Det finnes ingen andre aksentfarge –
 *      honning er fjernet, fordi to varmfarger gjør at ingen av dem betyr noe.
 *   2. Ingen kant der en skygge gjør samme jobb.
 *   3. Runde hjørner, men strammere enn før. For myke leser som leketøy.
 *   4. Typografien bærer hierarkiet. Blir noe utydelig, er svaret større
 *      grad eller mer luft – aldri en boks rundt.
 *
 * Aksenten er en klar, ren blå – ikke indigo, ikke lilla – og den finnes i
 * tre styrker fordi hver av dem har en jobb kontrasten krever:
 *   `accent` (#0052B4) er tekst og lenker på lyst — 7.6:1 mot hvitt.
 *   `accentVivid` (#005CC8) er flate: knapper og merkelapper, med hvit tekst
 *   oppå — 6.2:1. `accentLight` (#6CB4FF) brukes på mørke flater, 7.7:1.
 *
 * Hvorfor denne blåfargen: blått er fargen som sterkest leses som tillit og
 * trygghet, og det er også fargen folk allerede forventer at en knapp har.
 * Indigoen som lå her trakk mot lilla, og lilla leser som leketøy eller
 * kampanje. Denne er klar og rolig – en fast hånd, ikke et rop. Den lå et
 * hakk lysere en stund (#0071E3), men den leste som en app-knapp; et trinn
 * dypere er det samme blå, bare med mer tyngde.
 *
 * `success` er fortsatt et eget, gulere grønt, og det er semantikk — aldri
 * dekor.
 *
 * Alle tekstfarger er kontrastsjekket mot flatene de brukes på (AA, 4.5:1).
 * Se docs/designprinsipper.md for begrunnelsene og kildene.
 */

/** Nesten nøytral gråskala med en hårfin varm snert. Ikke brun, ikke blå. */
/*
 * Mykere enn før. Den gamle skalaen gikk helt ned i nesten-sort (#0C0D0C) og
 * opp i kritthvitt, og med svarte brikker og et svart kort midt på ble
 * forsiden hard å se på. Nå er mørkeste tekst en dyp grafitt, og flatene er
 * hvitt og en svak, kjølig grå – kontrasten holder AA, men den roper ikke.
 */
const neutral = {
  50: '#FFFFFF',
  100: '#F5F5F7',
  200: '#E8E8ED',
  300: '#D2D2D7',
  400: '#A1A1A8',
  500: '#6E6E76',
  600: '#55565C',
  700: '#3A3B40',
  800: '#26272B',
  900: '#1D1D1F',
} as const

const theme = {
  colors: {
    // --- Flater ---
    /** Sidens lerret. Kritthvit – rent hvitt leser klinisk, brunt leser gammelt. */
    paper: neutral[50],
    /** Hevet flate: kort og panel. Ren hvit, løftet med skygge – ikke kant. */
    surface: '#FFFFFF',
    /** Dempet tone. Til rolige mellomseksjoner. */
    sunken: neutral[100],
    /**
     * Dyp flate: estimatkortet, foten og de få mørke avbrekkene.
     *
     * Den var ren nær-sort, og da leste kortet som et hull klippet ut av
     * siden – ingenting bandt det til resten. Nå er det samme dybde, men
     * tonet mot indigo, så den mørke flaten er i slekt med aksenten.
     * Kontrasten er like høy; det er slektskapet som er nytt.
     */
    deep: '#1D1D1F',
    /** Dyp flate, ett hakk lysere – for kort på `deep`. */
    deepRaised: '#2A2A2E',

    // --- Tekst ---
    ink: neutral[900],
    /** Ingresser og brødtekst som ikke skal konkurrere med overskriften. */
    inkMuted: neutral[600],
    /** Metadata og bildetekst. Lysest mulige tone som klarer AA mot alle flater. */
    inkSubtle: neutral[500],
    inkInverted: '#FFFFFF',
    inkInvertedMuted: 'rgba(255, 255, 255, 0.7)',

    // --- Kanter (brukes sparsomt – helst skygge i stedet) ---
    border: neutral[200],
    borderStrong: neutral[300],
    borderInverted: 'rgba(252, 252, 250, 0.14)',

    // --- Aksent: indigo, i tre styrker ---
    /**
     * Indigo som TEKST og lenke. 6.8:1 mot lerretet.
     * Bruk denne når aksenten skal leses, ikke ses.
     */
    accent: '#0052B4',
    accentHover: '#00449A',
    /**
     * Indigo som FLATE – knapper og merkelapper, med hvit tekst oppå (5.9:1).
     * Dyp nok til å bære en knapp uten å bli pastell.
     */
    accentVivid: '#005CC8',
    accentVividHover: '#004FAD',
    /** Tekst oppå `accentVivid`. Hvit, 6.2:1. */
    accentOn: '#FFFFFF',
    /** Aksent på mørke flater. 9.4:1 mot `deep`. */
    accentLight: '#6CB4FF',
    /** Lys aksentflate: merkelapper og fremhevede felter. */
    accentSoft: '#E8F0FB',
    /** Tekst på `accentSoft`. 7.6:1. */
    accentInk: '#003E8A',
    focus: '#005CC8',
    focusInverted: '#6CB4FF',

    // --- Semantikk (aldri som dekor) ---
    success: '#15803D',
    successSoft: '#E6F6EC',
    warning: '#A16207',
    warningSoft: '#FBF3DF',
    error: '#BE123C',
    errorSoft: '#FCE7EC',

    neutral,
  },

  fonts: {
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
    /**
     * Overskriftene står i Geist, som resten av siden.
     *
     * Vi prøvde fire alternativer: Instrument Serif (for tynn), Fraunces
     * (for myk), Bricolage Grotesque (for sær) – og landet tilbake her.
     * Geist i 700 med stram sporing er rolig og presis, og gjør jobben uten
     * å kreve oppmerksomhet.
     *
     * Konklusjonen er verdt å skrive ned: særpreget til denne siden ligger
     * ikke i skriften. Det ligger i tallet som teller seg fram, i den mørke
     * kvitteringen ved siden av skjemaet, og i at prisen faktisk står der.
     * En display-skrift oppå det ville vært pynt på noe som alt virker.
     */
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", sans-serif',
    /**
     * «Tallskriften» – nå samme skrift som resten.
     *
     * Den var Geist Mono før, til priser, tall og små etiketter. Det ga to
     * skriftstemmer på samme flate, og der den ble brukt til vanlig tekst
     * («Velg omfang i steg 2») leste den som en terminal. Nå er det Geist
     * overalt, med `tabular-nums` der tall står, så sifrene fortsatt har lik
     * bredde og ikke hopper når et beløp teller seg fram. Én font mindre å
     * laste, også.
     */
    mono: '"Geist", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
  },

  /**
   * Typeskalaen: sju trinn, ingen andre.
   *
   * Siden hadde vokst til femtifem ulike skriftstørrelser – 13, 14, 14,4,
   * 14,8, 15, 15,2 piksler og så videre – fordi hver komponent fant sin egen.
   * Det er den mest sikre måten å få en side til å se uferdig ut på: ingen
   * ser tallene, men alle ser at ingenting stemmer.
   *
   * Nå er det sju trinn, og hvert har én jobb. Selve verdiene står som
   * CSS-variabler i GlobalStyles (`--fs-*`), sammen med sporingen som hører
   * til hvert trinn (`--ls-*`) – jo større skrift, jo strammere. Vekten har
   * tre trinn: 400 for løpende tekst, 500 for grensesnitt og etiketter, 600
   * for overskrifter og det som skal fram.
   *
   *   micro    12   etiketter i versaler, merkelapper
   *   small    14   metadata, hjelpetekst, bildetekst
   *   body     16   brødtekst, knapper, felt, navigasjon
   *   lead     18–20  ingresser, korttitler
   *   title    20–24  spørsmål, underoverskrifter, tall i kort
   *   heading  30–44  seksjonsoverskrifter (h2) – én per seksjon
   *
   * Regelen som holder det rent: hver seksjon har ÉN stor ting, overskriften.
   * Alt inni – korttitler, listepunkter, h3 – er lead eller mindre. Står to
   * ting i heading- eller title-grad ved siden av hverandre, konkurrerer de.
   *   display  40–76  sidetitler (h1)
   */
  fontSizes: {
    micro: 'var(--fs-micro)',
    small: 'var(--fs-small)',
    body: 'var(--fs-body)',
    lead: 'var(--fs-lead)',
    title: 'var(--fs-title)',
    heading: 'var(--fs-heading)',
    display: 'var(--fs-display)',
  },

  breakpoints: {
    smallMobile: '560px',
    mobile: '768px',
    desktop: '769px',
    wideDesktop: '1400px',
  },

  spacing: {
    /** Luft over og under en seksjon. Raust – det er luften som gjør siden lett. */
    seksjon: 'clamp(5rem, 10vw, 9rem)',
    seksjonTett: 'clamp(3.5rem, 6vw, 5.5rem)',
    /* 1200 var trangt: på en 1920-skjerm sto innholdet som en smal spalte
       med store tomme marger. Brødtekst er uansett beskyttet av proseMax. */
    containerMax: '1320px',
    proseMax: '66ch',
  },

  zIndex: { nav: 1000, menyBakgrunn: 900, kontaktknapp: 800, heroInnhold: 20 },

  /** Store radier. Myke hjørner leser som lett; skarpe leser som systemverktøy. */
  borderRadius: {
    small: '10px',
    medium: '16px',
    large: '22px',
    xl: '28px',
    xxl: '36px',
    round: '50%',
    pill: '999px',
  },

  /**
   * Skygger brukes nå sparsomt.
   *
   * Regelen var «skygge, ikke kant», og resultatet ble en side der alt svevde:
   * steg-kort, priskort, tillitsbånd – alle løftet fra flaten. Seks svevende
   * ting er uroligere enn seks rolige.
   *
   * Nå ligger kortene flatt med en hårfin kant, og skygge er reservert for de
   * få tingene som FAKTISK skal ligge over siden – estimatkortet først og
   * fremst. Kontrasten flyttes dermed fra flatene til typografien, der den
   * gjør mer nytte.
   */
  shadows: {
    xs: '0 1px 2px rgba(12, 13, 12, 0.05)',
    sm: '0 2px 6px -2px rgba(12, 13, 12, 0.08)',
    md: '0 8px 20px -8px rgba(12, 13, 12, 0.10)',
    lg: '0 20px 44px -18px rgba(12, 13, 12, 0.14)',
    xl: '0 36px 80px -28px rgba(12, 13, 12, 0.18)',
    /** Det lange svevet – kun til det ene elementet som skal løftes mest. */
    svev: '0 40px 90px -34px rgba(12, 13, 12, 0.30)',
    onDark: '0 30px 70px -24px rgba(0, 0, 0, 0.55)',
    none: 'none',
  },

  transitions: {
    default: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    soft: '0.45s cubic-bezier(0.22, 1, 0.36, 1)',
    slow: '0.9s cubic-bezier(0.22, 1, 0.36, 1)',
  },

  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const

export type Theme = typeof theme
export default theme

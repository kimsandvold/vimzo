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
 * Aksenten er indigo, og den finnes i tre styrker fordi hver av dem har en
 * jobb kontrasten krever:
 *   `accent` (#4F3FD6) er tekst og lenker på lyst — 6.8:1 mot lerretet.
 *   `accentVivid` (#5B4AE8) er flate: knapper og merkelapper, med hvit tekst
 *   oppå — 5.9:1. `accentLight` (#B6A9FF) brukes på mørke flater, der den
 *   måler 9.4:1 og bærer det store beløpet i estimatet.
 *
 * Grønt er med vilje borte. Det eneste grønne som er igjen er `success`,
 * og det er semantikk — aldri dekor.
 *
 * Alle tekstfarger er kontrastsjekket mot flatene de brukes på (AA, 4.5:1).
 * Se docs/designprinsipper.md for begrunnelsene og kildene.
 */

/** Nesten nøytral gråskala med en hårfin varm snert. Ikke brun, ikke blå. */
const neutral = {
  50: '#FCFCFA',
  100: '#F4F4F1',
  200: '#E7E8E5',
  300: '#D4D6D1',
  400: '#9EA29C',
  500: '#6B706A',
  600: '#4E524D',
  700: '#32352F',
  800: '#1A1C19',
  900: '#0C0D0C',
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
    deep: '#13111F',
    /** Dyp flate, ett hakk lysere – for kort på `deep`. */
    deepRaised: '#1E1B30',

    // --- Tekst ---
    ink: neutral[900],
    /** Ingresser og brødtekst som ikke skal konkurrere med overskriften. */
    inkMuted: neutral[600],
    /** Metadata og bildetekst. Lysest mulige tone som klarer AA mot alle flater. */
    inkSubtle: neutral[500],
    inkInverted: '#FFFFFF',
    inkInvertedMuted: 'rgba(252, 252, 250, 0.68)',

    // --- Kanter (brukes sparsomt – helst skygge i stedet) ---
    border: neutral[200],
    borderStrong: neutral[300],
    borderInverted: 'rgba(252, 252, 250, 0.14)',

    // --- Aksent: indigo, i tre styrker ---
    /**
     * Indigo som TEKST og lenke. 6.8:1 mot lerretet.
     * Bruk denne når aksenten skal leses, ikke ses.
     */
    accent: '#4F3FD6',
    accentHover: '#4133B8',
    /**
     * Indigo som FLATE – knapper og merkelapper, med hvit tekst oppå (5.9:1).
     * Dyp nok til å bære en knapp uten å bli pastell.
     */
    accentVivid: '#5B4AE8',
    accentVividHover: '#4A3BD1',
    /** Tekst oppå `accentVivid`. Hvit, 5.9:1. */
    accentOn: '#FFFFFF',
    /** Aksent på mørke flater. 9.4:1 mot `deep`. */
    accentLight: '#B6A9FF',
    /** Lys aksentflate: merkelapper og fremhevede felter. */
    accentSoft: '#EDEAFF',
    /** Tekst på `accentSoft`. 8.3:1. */
    accentInk: '#3B2EA8',
    focus: '#5B4AE8',
    focusInverted: '#B6A9FF',

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
    mono: '"Geist Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace',
  },

  /**
   * Typeskala. Bevisst stor i toppen: en moderne, lett side får luft nettopp
   * fordi overskriftene er store nok til å bære sin egen plass.
   */
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    md: '1.0625rem',
    lg: 'clamp(1.125rem, 0.4vw + 1rem, 1.3125rem)',
    xl: 'clamp(1.3rem, 1vw + 1rem, 1.6rem)',
    '2xl': 'clamp(1.75rem, 2vw + 1.1rem, 2.4rem)',
    '3xl': 'clamp(2.25rem, 3.6vw + 1.1rem, 3.6rem)',
    '4xl': 'clamp(2.9rem, 6vw + 1rem, 5.6rem)',
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

  zIndex: { nav: 1000, menyBakgrunn: 900, heroInnhold: 20 },

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

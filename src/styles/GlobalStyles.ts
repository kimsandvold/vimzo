import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  /**
   * Tokens speiles til CSS-variabler slik at markup utenfor styled-components
   * (prerendret HTML, innebygde SVG-er) kan bruke samme palett.
   */
  :root {
    /* Navbaren ligger fast over innholdet. Høyden er en variabel fordi både
       hovedinnholdet og heltene må regne med den – den ene trekker fra, den
       andre legger til. */
    --nav-hoyde: clamp(68px, 5vw, 80px);

    /* Typeskalaen – se theme.fontSizes for hva hvert trinn er til. */
    --fs-micro: 0.75rem;
    --fs-small: 0.875rem;
    --fs-body: 1rem;
    --fs-lead: clamp(1.125rem, 0.35vw + 1.03rem, 1.25rem);
    --fs-title: clamp(1.25rem, 0.6vw + 1.05rem, 1.5rem);
    --fs-heading: clamp(1.875rem, 1.8vw + 1.3rem, 2.75rem);
    --fs-display: clamp(2.5rem, 4.4vw + 0.9rem, 4.75rem);

    /* Sporing per trinn: jo større, jo strammere. Versaletiketter har sin
       egen, positive sporing (0.08em) der de står. */
    --ls-micro: 0;
    --ls-small: -0.005em;
    --ls-body: -0.01em;
    --ls-lead: -0.015em;
    --ls-title: -0.025em;
    --ls-heading: -0.035em;
    --ls-display: -0.04em;

    --paper: ${({ theme }) => theme.colors.paper};
    --surface: ${({ theme }) => theme.colors.surface};
    --sunken: ${({ theme }) => theme.colors.sunken};
    --deep: ${({ theme }) => theme.colors.deep};

    --ink: ${({ theme }) => theme.colors.ink};
    --ink-muted: ${({ theme }) => theme.colors.inkMuted};
    --ink-subtle: ${({ theme }) => theme.colors.inkSubtle};
    --ink-inverted: ${({ theme }) => theme.colors.inkInverted};

    --border: ${({ theme }) => theme.colors.border};
    --border-strong: ${({ theme }) => theme.colors.borderStrong};

    --accent: ${({ theme }) => theme.colors.accent};
    --accent-hover: ${({ theme }) => theme.colors.accentHover};
    --accent-light: ${({ theme }) => theme.colors.accentLight};
    --accent-soft: ${({ theme }) => theme.colors.accentSoft};

    --shadow-sm: ${({ theme }) => theme.shadows.sm};
    --shadow-md: ${({ theme }) => theme.shadows.md};
    --shadow-lg: ${({ theme }) => theme.shadows.lg};
    --shadow-xl: ${({ theme }) => theme.shadows.xl};

    --ease-standard: ${({ theme }) => theme.easing.standard};
    --ease-soft: ${({ theme }) => theme.easing.soft};
  }

  /* Logoverktøyet i kalkulatorens modal har ingen meny (se lib/innebygd.ts). */
  html[data-innebygd] {
    --nav-hoyde: 0px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }

  /* Respekter systemvalget: slå av bevegelse, ikke bare demp den. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* clip, ikke hidden. hidden gjør html og body til egne rulleflater, og da
     slutter alt som er position: sticky å lime seg til skjermen – både
     estimatkortet og kalkulatorens knapperad på mobil. clip kutter det
     samme uten å lage en rulleflate. */
  html {
    overflow-x: clip;
    width: 100%;
    /* Fast offset for ankerlenker slik at den flytende navbaren ikke dekker målet. */
    scroll-padding-top: 6rem;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    /*
     * 100 %, ikke 16px.
     *
     * En hardkodet pikselverdi her overstyrer skriftstørrelsen brukeren selv
     * har satt i nettleseren. Har noen skrudd standarden opp til 24px fordi
     * de trenger det, fikk de 16 likevel. Alt annet på siden er i rem, så med
     * 100 % følger hele skalaen brukerens valg.
     */
    font-size: 100%;
    font-weight: 400;
    overflow-x: clip;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.paper};
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.ink};
    text-rendering: optimizeLegibility;
  }

  p {
    line-height: 1.65;
    /* Arver farge fra flaten — mørke seksjoner slipper å overstyre. */
    /* Unngå enslige ord på siste linje i ingresser og brødtekst. */
    text-wrap: pretty;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.15;
    text-wrap: balance;
  }

  /**
   * Overskriftene: Geist 600, med sporing og grad fra typeskalaen.
   * Én vekt for alle nivåer – hierarkiet ligger i størrelsen, ikke i at
   * hvert nivå har sin egen tykkelse.
   */
  h1, h2, h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 600;
    letter-spacing: var(--ls-heading);
    font-optical-sizing: auto;
    /* Bevisst ingen farge her — overskrifter arver fra flaten de står på,
       slik at mørke seksjoner ikke må overstyre hver enkelt. */
  }

  h1 {
    font-weight: 600;
    font-size: var(--fs-display);
    letter-spacing: var(--ls-display);
    line-height: 0.98;
  }

  h2 {
    font-weight: 600;
    font-size: var(--fs-heading);
    letter-spacing: var(--ls-heading);
    line-height: 1.04;
  }

  h3 {
    font-weight: 600;
    font-size: var(--fs-lead);
  }

  h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-weight: 600;
    letter-spacing: var(--ls-title);
  }

  /** Én synlig fokusring i hele appen, med nok kontrast mot begge flater. */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
    border-radius: 6px;
  }

  /* Mørke flater får den lyse aksentvarianten. */
  [data-surface='dark'] :focus-visible {
    outline-color: ${({ theme }) => theme.colors.focusInverted};
  }

  /* Ikke vis ring ved museklikk — kun ved tastatur. */
  :focus:not(:focus-visible) {
    outline: none;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
  }

  /* Fast navbar tar ingen plass i flyten – vi gir den plass her, én gang.
     Helter som skal gå helt til toppen trekker den fra igjen med
     negativ margin. */
  #innhold {
    padding-top: var(--nav-hoyde);
  }

  /* Hovedinnholdet får fokus fra «Hopp til innhold» – uten en ring rundt hele siden. */
  #innhold:focus {
    outline: none;
  }

  img, picture, video {
    display: block;
    max-width: 100%;
  }
`

export default GlobalStyles

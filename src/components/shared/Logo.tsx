import styled from 'styled-components'

/**
 * Merket, tegnet av Kim. To kantete strekar som danner en V.
 *
 * Kildefilene ligger i `public/images/logo/` – `vimzo-icon.svg` med flis, og
 * `vimzo-mark.svg` som bar glyf til gravering og trykk. Banene her er de
 * samme, lagt inn i koden i stedet for lastet som fil: navbaren er det første
 * som tegnes på hver side, og den skal ikke vente på et nettverkskall.
 */
const BANER = [
  'M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z',
  'M678 367L718 435L500 795L461 721Z',
] as const

/**
 * Glyfen alene, uten flisen rundt.
 *
 * Den fyller bare 40 % av bredden i det kvadratiske 1024-rutenettet, så vist
 * uten flis måtte den beskjæres – ellers ville den stått som et frimerke midt
 * i et tomt felt, halvparten så stor som flisversjonen ved siden av.
 */
const GLYF_BOKS = '248 264 531 531'

const Rad = styled.span<{ $mork: boolean; $fast?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $fast }) => ($fast ? '0.6rem' : 'clamp(0.55rem, 0.7vw, 0.8rem)')};
  color: ${({ theme, $mork }) => ($mork ? theme.colors.inkInverted : theme.colors.ink)};
  text-decoration: none;

  /* Merket og ordet vokser i takt. Settes storrelse-propen, fryses begge. */
  svg {
    display: block;
    flex-shrink: 0;
    width: ${({ $fast }) => $fast ?? 'clamp(32px, 1.5vw + 18px, 46px)'};
    height: ${({ $fast }) => $fast ?? 'clamp(32px, 1.5vw + 18px, 46px)'};
  }
`

/**
 * Ordmerket.
 *
 * Versaler og åpen sperring, ikke tett små bokstaver som før. Merket er en
 * V med luft mellom strekene, og et sammenklemt ordbilde ved siden av jobbet
 * imot den geometrien. Versalene svarer dessuten på V-en i selve merket.
 *
 * Sperringen spises opp av siste bokstav hvis man ikke kompenserer – derfor
 * en negativ `margin-right` på samme størrelse, så O-en står like langt fra
 * kanten som V-en står fra merket.
 */
const Ord = styled.span`
  /* Ordmerket står i grotesken, ikke i displayserifen – merket er geometrisk,
     og et ordbilde med seriffer ved siden av ville vært en annen bedrift. */
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: var(--fs-lead);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-right: -0.14em;
  white-space: nowrap;
`

interface Props {
  /**
   * Fast størrelse i piksler. Uten denne skalerer merket med skjermen.
   *
   * Den sto fast på 30 px overalt før, og på en 1920-skjerm ble merket
   * mindre enn «Få tilbud»-knappen ved siden av – altså var knappen
   * tyngre enn avsenderen. Nå vokser merket og ordet i takt, men bare til
   * 44 px: en logo som fyller navbaren er ikke selvsikker, bare stor.
   *
   * Logosiden setter den fast, fordi den viser merket i avtalte grader.
   */
  storrelse?: number
  /** Skjul ordmerket, f.eks. på smale skjermer. */
  kunMerke?: boolean
  mork?: boolean
}

export default function Logo({ storrelse, kunMerke = false, mork = false }: Props) {
  const fast = storrelse !== undefined ? `${storrelse}px` : undefined
  return (
    <Rad $mork={mork} $fast={fast}>
      <svg
        /* På mørk flate faller den nesten svarte flisen bort i bakgrunnen.
           Da viser vi glyfen bar i stedet – det er nettopp det graverings-
           versjonen er laget for – og beskjærer til den. */
        viewBox={mork ? GLYF_BOKS : '0 0 1024 1024'}
        role="img"
        aria-label="Vimzo"
        focusable="false"
      >
        {!mork && <rect width="1024" height="1024" rx="150" fill="#1D1D1F" />}
        <g fill={mork ? 'currentColor' : '#fff'}>
          {BANER.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
      {!kunMerke && <Ord>VIMZO</Ord>}
    </Rad>
  )
}

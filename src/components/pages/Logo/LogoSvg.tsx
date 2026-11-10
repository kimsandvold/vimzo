import {
  fargesett,
  finnSkrift,
  finnSymbol,
  initialer,
  legUt,
  slagordstil,
  visningsnavn,
  type Design,
  type Innhold,
} from './motor'
import { FONTER, fontstabel } from './merker'
import { lagAbstrakt } from './abstrakt'

export type Variant = 'positiv' | 'negativ' | 'svart' | 'hvit'

/**
 * Logoen, tegnet som SVG fra en beskrivelse.
 *
 * Én komponent for alt: forslagene, redigeringen, profilarket og alle
 * bruksområdene. Det er det som gjør at visittkortet og bilen alltid viser
 * nøyaktig den logoen kunden har valgt – det finnes ingen annen tegning.
 */
export default function LogoSvg({
  design,
  innhold,
  variant = 'positiv',
  kunMerke = false,
  hoyde,
  fyll = false,
  className,
}: {
  design: Design
  innhold: Innhold
  variant?: Variant
  /** Bare symbolet – til avatar, favikon og bil. */
  kunMerke?: boolean
  /** Fast høyde i px. Uten den fyller logoen bredden den får. */
  hoyde?: number
  /** Fyll boksen i begge retninger og hold sideforholdet – til smale flater som et skilt. */
  fyll?: boolean
  className?: string
}) {
  const d: Design = kunMerke ? { ...design, oppsett: 'kun-merke', merkestorrelse: 1 } : design
  const u = legUt(d, innhold)
  const farger = fargesett(d, variant)
  const stil = finnSkrift(d.skrift)
  const navn = visningsnavn(innhold.navn, stil, d.bokstaver)
  const sperring = (stil.sperring + d.sperring) * (u.navn?.grad ?? 0)
  const slag = slagordstil(d, innhold.slagord)
  // Litt luft rundt, så tynne kanter og sperrede versaler ikke kuttes.
  const pad = 2
  const vb = `${-pad} ${-pad} ${Math.ceil(u.bredde + pad * 2)} ${Math.ceil(u.hoyde + pad * 2)}`

  return (
    <svg
      viewBox={vb}
      className={className}
      role="img"
      aria-label={`Logo for ${innhold.navn.trim() || 'firmaet'}`}
      style={
        fyll
          ? { width: '100%', height: '100%' }
          : hoyde
            ? { height: hoyde, width: 'auto', maxWidth: '100%' }
            : { width: '100%', height: 'auto' }
      }
    >
      {u.merke && <Merke design={d} navn={innhold.navn} farger={farger} {...u.merke} />}
      {u.navn && (
        <text
          x={u.navn.x}
          y={u.navn.y}
          fontFamily={fontstabel(stil.font)}
          fontWeight={stil.vekt}
          fontSize={u.navn.grad}
          letterSpacing={sperring}
          textAnchor={u.navn.anker}
          fill={farger.tekst}
          // Sentrert tekst med sperring får luft etter siste tegn; dytt den
          // en halv sperring tilbake, så den står optisk midt på.
          dx={u.navn.anker === 'middle' ? sperring / 2 : 0}
          style={{ fontKerning: 'normal' }}
        >
          {navn}
        </text>
      )}
      {u.slagord && (
        <text
          x={u.slagord.x}
          y={u.slagord.y}
          fontFamily={fontstabel(slag.stil.font)}
          fontWeight={slag.stil.vekt}
          fontSize={u.slagord.grad}
          letterSpacing={u.slagord.grad * slag.stil.sperring}
          textAnchor={u.slagord.anker}
          dx={u.slagord.anker === 'middle' ? (u.slagord.grad * slag.stil.sperring) / 2 : 0}
          fill={farger.slagord}
        >
          {slag.tekst}
        </text>
      )}
    </svg>
  )
}

/**
 * Merket: et tegnet symbol eller et monogram, med eller uten beholder.
 *
 * I en beholder krymper symbolet til 56 % – mindre enn man skulle tro, men
 * det er den luften som gjør at en flis ser tegnet ut og ikke stappet.
 */
function Merke({
  design,
  navn,
  farger,
  x,
  y,
  storrelse: M,
}: {
  design: Design
  navn: string
  farger: ReturnType<typeof fargesett>
  x: number
  y: number
  storrelse: number
}) {
  const beholder = design.beholder
  const iBeholder = beholder !== 'ingen'
  const innerFarge = iBeholder ? farger.iBeholder : farger.merke
  const andel = iBeholder ? 0.56 : 1
  const indre = M * andel
  const forskyv = (M - indre) / 2
  const symbol = ['monogram', 'ikon', 'abstrakt'].includes(design.merke) ? null : finnSymbol(design.merke)
  // Et ikon som ikke er lastet eller ikke finnes, blir monogram – aldri en tom flis.
  const ikon = design.merke === 'ikon' ? design.ikon : undefined
  const abstrakt = design.merke === 'abstrakt' && design.abstrakt ? lagAbstrakt(design.abstrakt) : null

  return (
    <g transform={`translate(${x} ${y})`}>
      {beholder === 'flis' && <rect width={M} height={M} rx={M * 0.24} fill={farger.merke} />}
      {beholder === 'sirkel' && <circle cx={M / 2} cy={M / 2} r={M / 2} fill={farger.merke} />}
      {abstrakt ? (
        <g transform={`translate(${forskyv} ${forskyv}) scale(${indre / 64})`}>
          {abstrakt.map((f, i) => {
            const fill = iBeholder ? innerFarge : farger.flerfarge[f.f]
            const felles = { fill, transform: f.rot ? `rotate(${f.rot} 32 32)` : undefined }
            return f.t === 'path' ? (
              <path key={i} d={f.d} fillRule={f.e ? 'evenodd' : undefined} {...felles} />
            ) : f.t === 'circle' ? (
              <circle key={i} cx={f.cx} cy={f.cy} r={f.r} {...felles} />
            ) : (
              <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} {...felles} />
            )
          })}
        </g>
      ) : ikon ? (
        <g transform={`translate(${forskyv} ${forskyv}) scale(${indre / Math.max(ikon.b, ikon.h)})`} fill={innerFarge}>
          {ikon.former.map((f, i) =>
            f.t === 'path' ? (
              <path key={i} d={f.d} fillRule={f.e ? 'evenodd' : undefined} />
            ) : f.t === 'circle' ? (
              <circle key={i} cx={f.cx} cy={f.cy} r={f.r} />
            ) : f.t === 'rect' ? (
              <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} />
            ) : (
              <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} />
            ),
          )}
        </g>
      ) : symbol ? (
        <g transform={`translate(${forskyv} ${forskyv}) scale(${indre / 48})`}>
          {symbol.baner.map((b, i) => (
            <path key={i} d={b} fill={innerFarge} fillRule={symbol.evenodd ? 'evenodd' : undefined} />
          ))}
        </g>
      ) : (
        <Monogram
          tekst={initialer(navn)}
          M={M}
          farge={innerFarge}
          iBeholder={iBeholder}
          stil={finnSkrift(design.skrift)}
        />
      )}
    </g>
  )
}

/**
 * Initialene som merke. Uten beholder får de en tynn ramme, ellers står to
 * løse bokstaver og ser ut som starten på et ord i stedet for et merke.
 */
function Monogram({
  tekst,
  M,
  farge,
  iBeholder,
  stil,
}: {
  tekst: string
  M: number
  farge: string
  iBeholder: boolean
  stil: ReturnType<typeof finnSkrift>
}) {
  const grad = M * (tekst.length > 1 ? 0.42 : 0.52)
  return (
    <>
      {!iBeholder && (
        // En ramme som fylt ring, ikke strek – så filen kan skjæres og graveres.
        <path
          fillRule="evenodd"
          fill={farge}
          d={`${avrundetRute(M * 0.04, M * 0.92, M * 0.22)}${avrundetRute(M * 0.1, M * 0.8, M * 0.16)}`}
        />
      )}
      <text
        x={M / 2}
        y={M / 2 + (grad * FONTER[stil.font].kap) / 2}
        textAnchor="middle"
        fontFamily={fontstabel(stil.font)}
        fontWeight={stil.vekt}
        fontSize={grad}
        letterSpacing={stil.versaler ? grad * 0.02 : -grad * 0.04}
        fill={farge}
      >
        {tekst}
      </text>
    </>
  )
}

/** En avrundet firkant som bane, til monogramrammen. */
function avrundetRute(o: number, s: number, r: number) {
  const a = o
  const b = o + s
  return `M${a + r} ${a}H${b - r}A${r} ${r} 0 0 1 ${b} ${a + r}V${b - r}A${r} ${r} 0 0 1 ${b - r} ${b}H${a + r}A${r} ${r} 0 0 1 ${a} ${b - r}V${a + r}A${r} ${r} 0 0 1 ${a + r} ${a}Z`
}

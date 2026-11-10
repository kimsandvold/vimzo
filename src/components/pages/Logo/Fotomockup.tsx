import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import styled from 'styled-components'
import LogoSvg, { type Variant } from './LogoSvg'
import { FOTOMALER, type Fotomal, type Materiale } from './fotomaler'
import { matrise3d } from './perspektiv'
import type { Design, Innhold } from './motor'

/**
 * Logoen på ekte flater, i lag – slik en mockup i Photoshop er bygget:
 *
 *   1. basefotoet
 *   2. logoen, lagt i flatens perspektiv med `matrix3d` og klippet til
 *      masken, med blanding etter materiale (trykk på papir og stoff er
 *      `multiply`, så strukturen i fotoet skinner gjennom)
 *   3. skyggekartet over logoen (`multiply`), så bretter og krumning mørkner
 *      trykket – eller, uten kart, fotoets egne skygger via blandingen i 2
 *   4. høylys (`screen`), så glans og refleks går over trykket i stedet for
 *      under det
 *   5. et svakt korn over alt, så en skarp vektor ikke står ut mot et foto
 *
 * Alt styres av manifestet i fotomaler.ts. Scenen bygges i basefotoets egne
 * piksler og skaleres som én enhet, så punktene gjelder på alle skjermer.
 *
 * Krumning og høylys gjøres i ett SVG-filter på logolaget, i fotoets
 * koordinater: et forskyvningskart (feDisplacementMap) bøyer trykket rundt
 * en kopp eller inn i folder i stoffet, og høylyset fra fotoet klippes til
 * logoens egen form før det legges på – som en klippemaske i Photoshop. Da
 * lyser bare trykket opp, ikke en firkant rundt det.
 */

/** Hvordan logoen oppfører seg på hvert materiale. */
const MATERIALER: Record<
  Materiale,
  { blanding: CSSProperties['mixBlendMode']; dekning: number; mykhet: number; lys: number; glod?: boolean }
> = {
  papir: { blanding: 'multiply', dekning: 0.96, mykhet: 0.3, lys: 0.12 },
  stoff: { blanding: 'multiply', dekning: 0.88, mykhet: 0.8, lys: 0.08 },
  keramikk: { blanding: 'multiply', dekning: 0.94, mykhet: 0.6, lys: 0.35 },
  lakk: { blanding: 'multiply', dekning: 0.97, mykhet: 0.25, lys: 0.4 },
  folie: { blanding: 'normal', dekning: 0.95, mykhet: 0.2, lys: 0.5 },
  // Frostet folie: litt gjennomsiktig, litt myk, og refleksen går over.
  glass: { blanding: 'normal', dekning: 0.82, mykhet: 0.6, lys: 0.45 },
  // Bakbelyst akryl i en mørk front: aldri multiply (hvitt ville forsvunnet),
  // full dekning, skarp kant og en liten glød så den leser som lys.
  akryl: { blanding: 'normal', dekning: 1, mykhet: 0.12, lys: 0.12, glod: true },
}

/* ---------------------------------------------------------- forskyvning */

/**
 * Kartene lages én gang per mal, på canvas, i halv oppløsning – feImage
 * skalerer dem opp igjen, og det glatter overgangene. Rødt er forskyvning i
 * x, grønt i y; 128 er null.
 */
const KART = new Map<string, Promise<{ url: string; skala: number }>>()

function lagKart(mal: Fotomal): Promise<{ url: string; skala: number }> | null {
  const b = mal.boying
  if (!b || typeof document === 'undefined') return null
  const lagret = KART.get(mal.id)
  if (lagret) return lagret
  const W = Math.round(mal.bredde / 2)
  const H = Math.round(mal.hoyde / 2)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const ferdig = (async () => {
    const ut = ctx.createImageData(W, H)
    const px = ut.data
    let skala: number
    if (b.type === 'sylinder') {
      // Utbrettet flate → sylinder: punktet x på fotoet ligger i vinkelen
      // θ = asin((x − aksen) / R(y)) og hentes fra x = aksen + Rref · θ i den
      // flate logoen. Sidene presses sammen, og ringene vi ser ovenfra
      // løfter kantene – trykket smiler, slik det gjør på en ekte kopp.
      skala = 160
      const [y0, r0] = b.topp
      const [y1, r1] = b.bunn
      const R = (y: number) => r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
      const ys = mal.quad.map((q) => q[1])
      const ymid = (Math.min(...ys) + Math.max(...ys)) / 2
      const Rref = R(ymid)
      const yt = Math.min(...ys)
      const yb = Math.max(...ys)
      for (let j = 0; j < H; j++) {
        const y = j * 2
        const r = R(y)
        const t = Math.min(1, Math.max(0, (y - yt) / (yb - yt || 1)))
        const e = b.ellipse[0] + t * (b.ellipse[1] - b.ellipse[0])
        for (let i = 0; i < W; i++) {
          const x = i * 2
          const u = (x - b.aksen) / r
          let dx = 0
          let dy = 0
          if (Math.abs(u) < 0.98) {
            const th = Math.asin(u)
            dx = b.aksen + Rref * th - x
            dy = e * r * (1 - Math.cos(th))
          }
          const k = (j * W + i) * 4
          px[k] = Math.max(0, Math.min(255, Math.round(128 + (dx / skala) * 255)))
          px[k + 1] = Math.max(0, Math.min(255, Math.round(128 + (dy / skala) * 255)))
          px[k + 2] = 128
          px[k + 3] = 255
        }
      }
    } else {
      // Stoff: fotoets lyshet, kraftig utglattet, blir et høydekart. Mørke
      // folder trekker trykket inn, lyse løfter det – Photoshops «Displace».
      skala = b.styrke * 2
      const img = new Image()
      img.src = mal.base
      await img.decode()
      const liten = document.createElement('canvas')
      liten.width = Math.max(1, Math.round(W / 10))
      liten.height = Math.max(1, Math.round(H / 10))
      const lctx = liten.getContext('2d')!
      lctx.drawImage(img, 0, 0, liten.width, liten.height)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(liten, 0, 0, W, H)
      const inn = ctx.getImageData(0, 0, W, H).data
      const lum = (k: number) => 0.3 * inn[k] + 0.59 * inn[k + 1] + 0.11 * inn[k + 2]
      // Snittet over flaten er null – ellers flytter hele logoen seg.
      const xs = mal.quad.map((q) => q[0] / 2)
      const ys = mal.quad.map((q) => q[1] / 2)
      let sum = 0
      let n = 0
      for (let j = Math.floor(Math.min(...ys)); j < Math.max(...ys); j++)
        for (let i = Math.floor(Math.min(...xs)); i < Math.max(...xs); i++) {
          sum += lum((j * W + i) * 4)
          n++
        }
      const snitt = n ? sum / n : 128
      for (let k = 0; k < px.length; k += 4) {
        const v = Math.max(0, Math.min(255, Math.round(128 + (lum(k) - snitt) * 2.2)))
        px[k] = v
        px[k + 1] = v
        px[k + 2] = 128
        px[k + 3] = 255
      }
    }
    ctx.putImageData(ut, 0, 0)
    return { url: c.toDataURL('image/png'), skala }
  })()
  KART.set(mal.id, ferdig)
  return ferdig
}

function useKart(mal: Fotomal) {
  const [kart, setKart] = useState<{ url: string; skala: number } | null>(null)
  useEffect(() => {
    let aktiv = true
    lagKart(mal)
      ?.then((k) => aktiv && setKart(k))
      .catch(() => {})
    return () => {
      aktiv = false
    }
  }, [mal])
  return kart
}

export default function Fotomockup({
  mal,
  design,
  innhold,
  fyll = false,
  stempel = true,
}: {
  mal: Fotomal
  design: Design
  innhold: Innhold
  /** Fyll en fast celle (profilarket): fotoet beskjæres som `cover` i stedet for å bestemme høyden. */
  fyll?: boolean
  /** Eget stempel på bildet. Av i profilarket, der arket har sitt eget. */
  stempel?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [maal, setMaal] = useState({ skala: 0, x: 0, y: 0, b: 0 })
  const skala = maal.skala
  const kart = useKart(mal)
  const filterId = `foto-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect
      if (!fyll) return setMaal({ skala: w / mal.bredde, x: 0, y: 0, b: w })
      // Beskjær som `cover`, men rundt utsnittet malen ber om – ikke midten.
      const [ux, uy, ub, uh] = mal.utsnitt ?? [0, 0, mal.bredde, mal.hoyde]
      const s = Math.max(w / ub, h / uh, w / mal.bredde, h / mal.hoyde)
      const klem = (v: number, min: number) => Math.min(0, Math.max(min, v))
      setMaal({
        skala: s,
        x: klem(w / 2 - (ux + ub / 2) * s, w - mal.bredde * s),
        y: klem(h / 2 - (uy + uh / 2) * s, h - mal.hoyde * s),
        b: w,
      })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [mal, fyll])

  const m = MATERIALER[mal.materiale]
  const B = 1000
  const H = Math.round((B * mal.flate.hoyde) / mal.flate.bredde)
  const boying = mal.boying
  // På en sylinder er quad-en den utbrettede flaten: et rektangel om aksen,
  // like bredt som toppen av quad-en. Kartet gjør resten.
  const quad =
    boying?.type === 'sylinder'
      ? (() => {
          const halv = Math.abs(mal.quad[1][0] - mal.quad[0][0]) / 2
          const [yt, yb] = [mal.quad[0][1], mal.quad[3][1]]
          return [
            [boying.aksen - halv, yt],
            [boying.aksen + halv, yt],
            [boying.aksen + halv, yb],
            [boying.aksen - halv, yb],
          ]
        })()
      : mal.quad
  const transform = matrise3d([0, 0, B, 0, B, H, 0, H], quad.flat())
  const variant: Variant = mal.variant === 'auto' ? ((mal.lyshet ?? 0.85) > 0.5 ? 'positiv' : 'hvit') : mal.variant
  const [luftB, luftH] = mal.luft ?? [0.8, 0.8]
  // Uten egen maske klippes logoen til flaten selv.
  const polygon = Array.isArray(mal.maske) ? mal.maske : mal.quad
  const klipp =
    typeof mal.maske === 'string' ? undefined : `polygon(${polygon.map(([x, y]) => `${x}px ${y}px`).join(', ')})`
  const maskeBilde = typeof mal.maske === 'string' ? `url(${mal.maske})` : undefined
  const lagDesign: Design = { ...design, slagord: false, oppsett: mal.oppsett ?? design.oppsett }

  // Skalaen er i bildepiksler; mykheten skal være lik på skjermen uansett.
  const mykhet = m.mykhet / Math.max(skala, 0.3)

  // Høylyset: bare det lyseste i fotoet (over terskelen) slipper gjennom.
  const terskel = 0.62
  const k = m.lys / (1 - terskel)
  const lysrad = `${0.3 * k} ${0.59 * k} ${0.11 * k} 0 ${-terskel * k}`

  // Stempelet i det øvre hjørnet lengst fra logoen.
  const midtX = maal.x + (quad.reduce((a, q) => a + q[0], 0) / 4) * skala
  const stempelVenstre = maal.b > 0 && midtX > maal.b / 2

  return (
    <Ramme ref={ref} style={fyll ? { height: '100%' } : { aspectRatio: `${mal.bredde} / ${mal.hoyde}` }}>
      <Scene
        style={{
          width: mal.bredde,
          height: mal.hoyde,
          transform: `translate(${maal.x}px, ${maal.y}px) scale(${skala})`,
        }}
      >
        <img src={mal.base} alt="" width={mal.bredde} height={mal.hoyde} loading="lazy" decoding="async" />

        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={mal.bredde}
            height={mal.hoyde}
            colorInterpolationFilters="sRGB"
          >
            {kart ? (
              <>
                <feImage
                  href={kart.url}
                  x="0"
                  y="0"
                  width={mal.bredde}
                  height={mal.hoyde}
                  preserveAspectRatio="none"
                  result="kart"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="kart"
                  scale={kart.skala}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="trykk"
                />
              </>
            ) : (
              <feOffset in="SourceGraphic" dx="0" dy="0" result="trykk" />
            )}
            <feImage
              href={mal.lys ?? mal.base}
              x="0"
              y="0"
              width={mal.bredde}
              height={mal.hoyde}
              preserveAspectRatio="none"
              result="foto"
            />
            <feColorMatrix
              in="foto"
              type="matrix"
              values={`${lysrad} ${lysrad} ${lysrad} 0 0 0 0 1`}
              result="glans"
            />
            <feComposite in="glans" in2="trykk" operator="in" result="glans" />
            <feBlend in="trykk" in2="glans" mode="screen" />
          </filter>
        </svg>

        <Lag
          style={{
            clipPath: klipp,
            WebkitMaskImage: maskeBilde,
            maskImage: maskeBilde,
            mixBlendMode: m.blanding,
            filter: `url(#${filterId})`,
          }}
        >
          <Flate
            style={{
              width: B,
              height: H,
              transform,
              opacity: m.dekning,
              filter: m.glod
                ? `blur(${mykhet}px) drop-shadow(0 0 ${2 / Math.max(skala, 0.3)}px rgba(255,255,255,0.25))`
                : `blur(${mykhet}px)`,
            }}
          >
            <div style={{ width: `${luftB * 100}%`, height: `${luftH * 100}%` }}>
              <LogoSvg
                design={lagDesign}
                innhold={innhold}
                variant={variant}
                kunMerke={mal.oppsett === 'kun-merke'}
                fyll
              />
            </div>
          </Flate>
        </Lag>

        {mal.skygge && (
          <Lag style={{ clipPath: klipp, mixBlendMode: 'multiply' }}>
            <img src={mal.skygge} alt="" />
          </Lag>
        )}

        <Korn aria-hidden="true" />
      </Scene>
      {stempel && <Vannmerkeflate aria-hidden="true" $venstre={stempelVenstre} />}
      <Navn>{mal.navn}</Navn>
    </Ramme>
  )
}

export function Fotogalleri({ design, innhold }: { design: Design; innhold: Innhold }) {
  return (
    <Galleri>
      {FOTOMALER.map((m) => (
        <Fotomockup key={m.id} mal={m} design={design} innhold={innhold} />
      ))}
    </Galleri>
  )
}

/* ------------------------------------------------------------------- stiler */

const Galleri = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  /* Det første bildet går over hele bredden – et redaksjonelt oppslag, ikke
     et rutenett av like bokser. */
  > :first-child {
    grid-column: 1 / -1;
  }

  /* Blir det ett bilde til overs etter heltebildet, får det hele raden –
     aldri et tomt felt ved siden av. */
  > :nth-child(even):last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

const Ramme = styled.figure`
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.sunken};
  user-select: none;
  -webkit-user-select: none;
`

const Scene = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  isolation: isolate;

  img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Lag = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
`

const Flate = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: 0 0;

  svg {
    display: block;
  }
`

/** Fotokorn: støy fra feTurbulence, så vektorkantene får samme tekstur som fotoet. */
const Korn = styled.span`
  position: absolute;
  inset: 0;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url('data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='k'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#k)'/></svg>",
  )}');
  pointer-events: none;
`

/** Ett diskret stempel per bilde – nok til at et skjermbilde ikke er en ferdig fil. */
const Vannmerkeflate = styled.span<{ $venstre: boolean }>`
  position: absolute;
  top: 0.6rem;
  ${({ $venstre }) => ($venstre ? 'left: 0.6rem;' : 'right: 0.6rem;')}
  line-height: 1;
  pointer-events: none;

  /* I det øvre hjørnet lengst fra logoen – resultatet skal kunne vurderes. */
  &::after {
    content: 'Forhåndsvisning';
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.32);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }

  [data-vannmerke='av'] & {
    display: none;
  }
`

const Navn = styled.figcaption`
  position: absolute;
  left: 0.75rem;
  bottom: 0.65rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
`

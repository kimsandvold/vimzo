import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Wrap } from '../../ui'
import Icon from '../shared/Icon'
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

export interface Smule {
  navn: string
  sti?: string
}

/**
 * Sidehodet på undersidene.
 *
 * Lyst, som forsiden – før åpnet hver underside på en mørk flate, og da
 * leste nettstedet som to ulike steder. Ved siden av tittelen svever tre
 * nettsider i isometri, på et rutenett som glir sakte under dem: en
 * skisse, et utkast og en ferdig side. Det er hva
 * vi gjør, vist i stedet for sagt – og det er det eneste bildet nettstedet
 * trenger.
 *
 * Alt er CSS. Ingen bilder å laste, ingenting som blir uskarpt, og med
 * «redusert bevegelse» står det stille.
 */
export default function Sidehode({
  smuler = [],
  stikkord,
  tittel,
  ingress,
  handlinger,
  barn,
  motiv = 'nettside',
}: {
  /** Hva arkene viser. Samme form overalt, men innholdet passer siden. */
  motiv?: Motiv
  smuler?: Smule[]
  stikkord?: string
  tittel: ReactNode
  ingress?: ReactNode
  handlinger?: ReactNode
  /** Fullbredde innhold nederst: faner, nøkkeltall, hurtiglenker. */
  barn?: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  /**
   * Stabelen vipper litt etter musa. Bare med mus (ikke berøring, der det
   * ville hoppet ved hvert trykk), og bare uten «redusert bevegelse». Verdiene
   * skrives rett som CSS-variabler – ingen React-rendring per bevegelse.
   */
  function vedPeker(e: PointerEvent<HTMLElement>) {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }

  return (
    <Flate ref={ref} onPointerMove={vedPeker}>
      <Wrap>
        {smuler.length > 0 && (
          <Smuler aria-label="Brødsmuler">
            <ol>
              <li>
                <Link to="/">Forsiden</Link>
              </li>
              {smuler.map((s) => (
                <li key={s.navn}>
                  <Icon navn="pilHoyre" storrelse={12} tykkelse={2.2} />
                  {s.sti ? <Link to={s.sti}>{s.navn}</Link> : <span aria-current="page">{s.navn}</span>}
                </li>
              ))}
            </ol>
          </Smuler>
        )}

        <Gitter>
          <Tekst>
            {stikkord && <Stikk>{stikkord}</Stikk>}
            <h1>{tittel}</h1>
            {ingress && <Ingress>{ingress}</Ingress>}
            {handlinger && <Handlinger>{handlinger}</Handlinger>}
          </Tekst>
          <Stabel motiv={motiv} />
        </Gitter>

        {barn && <Bunn>{barn}</Bunn>}
      </Wrap>
    </Flate>
  )
}

export type Motiv =
  | 'nettside'
  | 'kalender'
  | 'kalkulator'
  | 'logo'
  | 'sok'
  | 'pris'
  | 'galleri'
  | 'guide'
  | 'samtale'
  | 'verktoy'

/**
 * Tre ark i isometri: skisse, utkast, ferdig.
 *
 * De ligger i hvert sitt lag og puster forskjøvet, så stabelen kjennes
 * levende uten at noe beveger seg mer enn et par piksler. Det øverste arket
 * er det eneste med farge – blått der siden «virker».
 *
 * Formen er den samme på alle undersider, så nettstedet henger sammen. Det
 * som står PÅ arkene, følger siden: en kalender på fristkalenderen, en
 * kalkyle på timeprisen, en logo i logoverktøyet. Man ser hva siden gjør
 * før man har lest et ord.
 */
function Stabel({ motiv }: { motiv: Motiv }) {
  return (
    <Scene aria-hidden="true">
      <Plan>
        <Flis />
        {[0, 1, 2].map((i) => (
          <Ark key={i} $niva={i} style={{ '--i': i } as CSSProperties}>
            <Arkinnhold motiv={motiv} />
          </Ark>
        ))}
      </Plan>
    </Scene>
  )
}

/** En strek eller flate på arket. `a` = aksent (blå), `m` = mørk – bare på det ferdige arket. */
function L({ b, h = 8, a, m, r, flex }: { b: string; h?: number; a?: boolean; m?: boolean; r?: number; flex?: boolean }) {
  return (
    <i
      className={[a && 'a', m && 'm'].filter(Boolean).join(' ') || undefined}
      style={{ width: b, height: flex ? undefined : h, flex: flex ? 1 : undefined, borderRadius: r }}
    />
  )
}

function Arkinnhold({ motiv }: { motiv: Motiv }) {
  switch (motiv) {
    case 'kalender':
      return (
        <>
          <L b="36%" />
          <L b="64%" h={18} m />
          <b className="rutenett kal">
            {Array.from({ length: 15 }, (_, n) => (
              <i key={n} className={n === 6 ? 'a' : undefined} />
            ))}
          </b>
        </>
      )
    case 'kalkulator':
      return (
        <>
          <L b="40%" />
          <L b="70%" h={34} m />
          {[0, 1, 2].map((n) => (
            <b className="rad" key={n}>
              <L b="44%" />
              <L b="20%" />
            </b>
          ))}
          <b className="rad auto">
            <L b="34%" h={14} />
            <L b="38%" h={26} r={999} a />
          </b>
        </>
      )
    case 'logo':
      return (
        <b className="midt">
          <i className="a sirkel" />
          <L b="64%" h={18} m />
          <b className="rad">
            <i className="a prikk" />
            <i className="m prikk" />
            <i className="prikk" />
          </b>
        </b>
      )
    case 'sok':
      return (
        <>
          <L b="44%" />
          <b className="felt">
            <L b="54%" h={12} m />
            <i className="a pille" />
          </b>
          {[0, 1, 2].map((n) => (
            <b className="kortrad" key={n}>
              <i className={n === 0 ? 'a prikk liten' : 'prikk liten'} />
              <L b={`${68 - n * 10}%`} h={10} />
            </b>
          ))}
        </>
      )
    case 'pris':
      return (
        <>
          <L b="38%" />
          <L b="56%" h={34} m />
          {[0, 1, 2].map((n) => (
            <b className="rad start" key={n}>
              <i className="a prikk liten" />
              <L b={`${70 - n * 12}%`} />
            </b>
          ))}
          <b className="auto">
            <L b="100%" h={26} r={999} a />
          </b>
        </>
      )
    case 'galleri':
      return (
        <>
          <L b="56%" h={18} m />
          <b className="rutenett fyll" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <i className="a" />
            <i />
            <i />
            <i />
          </b>
        </>
      )
    case 'guide':
      return (
        <>
          <L b="36%" />
          <L b="84%" h={18} m />
          <L b="92%" />
          <L b="70%" />
          {[0, 1, 2].map((n) => (
            <b className="rad start" key={n}>
              <i className={n < 2 ? 'a boks' : 'boks'} />
              <L b={`${74 - n * 12}%`} />
            </b>
          ))}
        </>
      )
    case 'samtale':
      return (
        <>
          <b className="boble">
            <L b="64%" h={34} r={14} />
          </b>
          <b className="boble hoyre">
            <L b="72%" h={44} r={14} a />
          </b>
          <b className="boble">
            <L b="50%" h={28} r={14} />
          </b>
          <b className="felt auto">
            <L b="56%" h={8} />
            <i className="a pille" />
          </b>
        </>
      )
    case 'verktoy':
      return (
        <>
          <L b="44%" />
          <L b="72%" h={18} m />
          <b className="rutenett fyll" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <i className="a" />
            <i />
            <i />
            <i />
          </b>
        </>
      )
    default:
      return (
        <>
          <L b="40%" />
          <L b="82%" h={18} m />
          <L b="92%" />
          <L b="64%" />
          <L b="100%" flex r={10} />
          <L b="46%" h={22} r={999} a />
        </>
      )
  }
}

const Flate = styled.header`
  position: relative;
  overflow: hidden;
  margin-top: calc(-1 * var(--nav-hoyde));
  padding: calc(3rem + var(--nav-hoyde)) 0 clamp(2rem, 4vw, 3rem);

  /* Seksjonen rett under trenger ikke sin fulle luft på toppen. Sidehodets
     bunn og seksjonens topp ble lagt sammen før, og ga et tomt belte på
     opptil 250 px mellom tittelen og innholdet – det så ut som om noe ikke
     hadde lastet. */
  & + section {
    padding-top: clamp(2.5rem, 5vw, 4rem);
  }
  --px: 0;
  --py: 0;
  background: #fff;
  color: ${({ theme }) => theme.colors.ink};

  h1 {
    margin: 0;
    font-size: var(--fs-display);
    font-weight: 600;
    line-height: 1;
    letter-spacing: var(--ls-display);
    max-width: 20ch;
    text-wrap: balance;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: calc(2rem + var(--nav-hoyde)) 0 1rem;
  }
`

/* Flisene glir én rute langs planet – som et transportbånd under arkene. */
const gli = keyframes`
  from { background-position: 0 0, 0 0; }
  to   { background-position: 40px 0, 0 40px; }
`

/**
 * Gulvet under stabelen, i samme plan som arkene.
 *
 * Det lå som et eget perspektivgulv under teksten før, og da så stabelen ut
 * til å sveve over et annet rom. Her er rutenettet en del av samme objekt:
 * arkene står på det, og det vipper med dem når musa beveger seg.
 */
const Flis = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 720px;
  height: 720px;
  margin: -360px 0 0 -360px;
  background-image:
    linear-gradient(to right, rgba(0, 92, 200, 0.18) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 92, 200, 0.18) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: translateZ(-36px);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 18%, transparent 62%);
  mask-image: radial-gradient(circle at 50% 50%, #000 18%, transparent 62%);
  animation: ${gli} 6s linear infinite;
  pointer-events: none;
`

/* Hvert ark hever og senker seg litt, forskjøvet i tid. */
const pust = keyframes`
  0%, 100% { transform: translateZ(calc(var(--i) * 72px)); }
  50%      { transform: translateZ(calc(var(--i) * 72px + 14px)); }
`

const Scene = styled.div`
  position: relative;
  justify-self: center;
  width: 440px;
  height: 340px;

  /* På telefon: under teksten, sentrert og mindre. Ikke i hjørnet bak
     tittelen – en stabel som stikker ut i kanten ser uferdig ut. */
  @media (max-width: 960px) {
    width: 100%;
    height: 210px;
    margin-top: 0.5rem;

    > div {
      scale: 0.58;
    }
  }
`

const Plan = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 250px;
  height: 310px;
  margin: -170px 0 0 -125px;
  transform: rotateX(calc(56deg + var(--py) * -5deg)) rotateZ(calc(-42deg + var(--px) * 7deg));
  transform-style: preserve-3d;
  transition: transform 0.6s ${({ theme }) => theme.easing.soft};
`

const Ark = styled.div<{ $niva: number }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  animation: ${pust} 6s ${({ theme }) => theme.easing.soft} infinite;
  animation-delay: calc(var(--i) * -0.9s);

  /* 0: skisse – bare strek. 1: utkast – grå flater. 2: ferdig – hvit, med farge. */
  ${({ $niva, theme }) =>
    $niva === 0
      ? `
        border: 1.5px dashed ${theme.colors.borderStrong};
        background: rgba(255, 255, 255, 0.4);
      `
      : $niva === 1
        ? `
        border: 1px solid ${theme.colors.border};
        background: ${theme.colors.sunken};
        box-shadow: 0 24px 40px -24px rgba(29, 29, 31, 0.25);
      `
        : `
        border: 1px solid ${theme.colors.border};
        background: #fff;
        /* Blått lys under det ferdige arket – det er det som «virker». */
        box-shadow:
          0 40px 60px -28px rgba(0, 92, 200, 0.45),
          0 2px 0 ${theme.colors.border};
      `}

  /* Alt på arket er streker og flater. Skissen har stiplet omriss, utkastet
     grå flater, og bare det ferdige arket får farge. */
  i {
    display: block;
    flex: none;
    border-radius: 6px;
    background: ${({ $niva, theme }) => ($niva === 0 ? 'transparent' : theme.colors.border)};
    border: ${({ $niva, theme }) => ($niva === 0 ? `1.5px dashed ${theme.colors.borderStrong}` : '0')};
  }

  ${({ $niva, theme }) =>
    $niva === 2
      ? `
        i.a { background: ${theme.colors.accentVivid}; }
        i.m { background: ${theme.colors.ink}; }
      `
      : ''}

  b {
    display: flex;
    gap: 8px;
  }

  .rad {
    align-items: center;
    justify-content: space-between;
  }

  .rad.start {
    justify-content: flex-start;
  }

  .rutenett {
    display: grid;
    gap: 7px;
    margin-top: 4px;

    i {
      width: auto;
      min-height: 18px;
      border-radius: 8px;
    }
  }

  /* Kalenderen: tre uker, store ruter som fyller arket. */
  .rutenett.kal {
    flex: 1;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  .rutenett.fyll {
    flex: 1;
    grid-auto-rows: 1fr;
  }

  .auto {
    margin-top: auto;
  }

  .kortrad {
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    border: 1.5px ${({ $niva }) => ($niva === 0 ? 'dashed' : 'solid')} ${({ theme }) => theme.colors.border};
  }

  .skille {
    height: 0;
    margin: 2px 0;
    border-top: 1.5px ${({ $niva }) => ($niva === 0 ? 'dashed' : 'solid')} ${({ theme }) => theme.colors.border};
  }

  .midt {
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .sirkel {
    width: 92px;
    height: 92px;
    border-radius: 50%;
  }

  .prikk {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }

  .prikk.liten {
    width: 12px;
    height: 12px;
  }

  .boks {
    width: 14px;
    height: 14px;
    border-radius: 4px;
  }

  .felt {
    align-items: center;
    justify-content: space-between;
    padding: 10px 10px 10px 14px;
    border-radius: 999px;
    border: 1.5px ${({ $niva }) => ($niva === 0 ? 'dashed' : 'solid')} ${({ theme }) => theme.colors.border};
  }

  .pille {
    width: 46px;
    height: 20px;
    border-radius: 999px;
  }

  .boble {
    display: flex;
  }

  .boble.hoyre {
    justify-content: flex-end;
  }
`

const Smuler = styled.nav`
  position: relative;
  margin-bottom: clamp(2rem, 4vw, 3rem);

  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--fs-small);
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  a {
    color: ${({ theme }) => theme.colors.inkSubtle};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.ink};
    }
  }
`

const Gitter = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 2rem 4rem;
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Stikk = styled.p`
  margin-bottom: 1rem;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Tekst = styled.div`
  position: relative;
  z-index: 1;
`

const Ingress = styled.p`
  max-width: 46ch;
  margin-top: 1.25rem;
  font-size: var(--fs-lead);
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
`

const Bunn = styled.div`
  position: relative;
  margin-top: clamp(2.25rem, 4vw, 3.5rem);
`

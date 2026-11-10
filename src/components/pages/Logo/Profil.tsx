import { useEffect, useRef, useState, type ReactNode } from 'react'
import styled from 'styled-components'
import LogoSvg from './LogoSvg'
import Fotomockup from './Fotomockup'
import { FOTOMALER } from './fotomaler'
import { FONTER, TEKSTFONT, fontstabel } from './merker'
import { finnPalett, finnSkrift, visningsnavn, type Design, type Innhold } from './motor'

/**
 * Den visuelle profilen som en liten merkevarebok: seks ark i A4 liggende.
 *
 * Hvert ark er tegnet i fast størrelse (1120 × 792) og skaleres som én
 * enhet – så det samme arket kan vises som et lite miniatyrbilde i
 * verktøyet, stort i fremviseren og i full bredde på profilsiden, og PDF-en
 * kan følge den samme oppbygningen.
 *
 * Før kjøp får hvert ark ett diskret «Forhåndsvisning»-stempel. Ligger arket
 * inne i et element med `data-vannmerke="av"`, forsvinner det.
 */
const B = 1120
const H = 792

function lagSider(design: Design, innhold: Innhold): { navn: string; side: ReactNode }[] {
  const p = finnPalett(design.palett)
  const s = finnSkrift(design.skrift)
  const navn = visningsnavn(innhold.navn, s, design.bokstaver)
  const rent = { ...design, slagord: false }
  const ikon = { ...design, beholder: 'ingen' as const }
  const fot = (lys = false) => (
    <Fot $lys={lys}>
      <span>{navn}</span>
      <span>Visuell profil</span>
    </Fot>
  )

  return [
    {
      navn: 'Forside',
      side: (
        <Ark $bg={p.primaer}>
          <Midt>
            <div style={{ width: 560 }}>
              <LogoSvg design={design} innhold={innhold} variant="negativ" />
            </div>
          </Midt>
          {fot(true)}
        </Ark>
      ),
    },
    {
      navn: 'Logo',
      side: (
        <Ark $bg="#FFFFFF">
          <Etikett>01 · Logo</Etikett>
          <Midt>
            <Frisone>
              <LogoSvg design={design} innhold={innhold} />
              <i aria-hidden="true" />
              <b className="topp">x</b>
              <b className="side">x</b>
            </Frisone>
          </Midt>
          <Linje>Fri plass rundt logoen: minst høyden på merket (x). Minste størrelse: 24 px / 15 mm.</Linje>
          <Bruksrad>
            {(
              [
                ['Nettside og dokumenter', '#FFFFFF', rent, 'positiv', false],
                ['Skilt og bil', p.primaer, rent, 'negativ', false],
                ['Sosiale medier', p.lys, design, 'positiv', true],
                ['Gravering og stempel', '#FFFFFF', rent, 'svart', false],
              ] as const
            ).map(([n, bak, d, v, kun]) => (
              <figure key={n}>
                <Celle $bg={bak}>
                  {kun ? (
                    <Rund style={{ background: p.primaer }}>
                      <div style={{ width: '56%' }}>
                        <LogoSvg design={{ ...d, beholder: 'ingen' }} innhold={innhold} variant="hvit" kunMerke />
                      </div>
                    </Rund>
                  ) : (
                    <div style={{ width: '74%' }}>
                      <LogoSvg design={d} innhold={innhold} variant={v} />
                    </div>
                  )}
                </Celle>
                <figcaption>{n}</figcaption>
              </figure>
            ))}
          </Bruksrad>
          {fot()}
        </Ark>
      ),
    },
    {
      navn: 'Farger',
      side: (
        <Ark $bg="#FFFFFF">
          <Etikett>02 · Farger</Etikett>
          <Fargeoppslag>
            <Fargeblokk $hex={p.primaer} $lys className="stor">
              <Fargedata hex={p.primaer} navn="Primær" />
            </Fargeblokk>
            <Fargeblokk $hex={p.aksent} $lys={erMork(p.aksent)}>
              <Fargedata hex={p.aksent} navn="Aksent" />
            </Fargeblokk>
            <Fargeblokk $hex={p.mork} $lys>
              <Fargedata hex={p.mork} navn="Mørk" />
            </Fargeblokk>
            <Fargeblokk $hex={p.lys} $kant>
              <Fargedata hex={p.lys} navn="Lys" />
            </Fargeblokk>
          </Fargeoppslag>
          <Andel>
            <i style={{ flex: 60, background: p.lys }}>60</i>
            <i style={{ flex: 30, background: p.primaer, color: '#fff' }}>30</i>
            <i style={{ flex: 10, background: p.aksent, color: erMork(p.aksent) ? '#fff' : p.mork }}>10</i>
          </Andel>
          {fot()}
        </Ark>
      ),
    },
    {
      navn: 'Skrift',
      side: (
        <Ark $bg={p.lys}>
          <Etikett>03 · Skrift</Etikett>
          <Tospalte>
            <div>
              <Aa style={{ fontFamily: fontstabel(s.font), fontWeight: s.vekt, color: p.mork }}>Aa</Aa>
              <Alfabet style={{ fontFamily: fontstabel(s.font), fontWeight: s.vekt, color: p.mork }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ
                <br />
                abcdefghijklmnopqrstuvwxyzæøå 0123456789
              </Alfabet>
            </div>
            <Hierarki>
              <p style={{ fontFamily: fontstabel(s.font), fontWeight: s.vekt, color: p.mork }}>Overskrift</p>
              <p style={{ fontFamily: fontstabel(TEKSTFONT), fontWeight: 700, color: p.mork }}>Underoverskrift</p>
              <p style={{ fontFamily: fontstabel(TEKSTFONT), fontWeight: 500 }}>
                Brødtekst i {FONTER[TEKSTFONT].familie.replace('Logo ', '')}. Rolig og lesbar, på skjerm og på papir.
              </p>
              <p>
                Logoskrift: {FONTER[s.font].familie.replace('Logo ', '')} {s.vekt}
              </p>
            </Hierarki>
          </Tospalte>
          {fot()}
        </Ark>
      ),
    },
    {
      navn: 'I bruk',
      side: (
        <Ark $bg="#FFFFFF">
          <Etikett>04 · I bruk</Etikett>
          <Bruk>
            {FOTOMALER.map((m) => (
              <div key={m.id}>
                <Fotomockup mal={m} design={design} innhold={innhold} fyll stempel={false} />
              </div>
            ))}
          </Bruk>
          {fot()}
        </Ark>
      ),
    },
    {
      navn: 'Digitalt',
      side: (
        <Ark $bg={p.lys}>
          <Etikett>05 · Digitalt</Etikett>
          <Digitalt>
            <Banner style={{ background: p.primaer }}>
              <div style={{ width: '42%' }}>
                <LogoSvg design={rent} innhold={innhold} variant="negativ" />
              </div>
              <small>Forsidebilde · Facebook 1640 × 624 · LinkedIn 1584 × 396</small>
            </Banner>
            <Post style={{ background: p.primaer }}>
              <div className="merke">
                <LogoSvg design={ikon} innhold={innhold} variant="hvit" kunMerke />
              </div>
              <p style={{ fontFamily: fontstabel(s.font), fontWeight: s.vekt }}>{innhold.slagord.trim() || navn}</p>
              <small>Innlegg 1080 × 1080</small>
            </Post>
            <Avatarrute>
              <Rund style={{ background: p.primaer, width: 150 }}>
                <div style={{ width: '56%' }}>
                  <LogoSvg design={ikon} innhold={innhold} variant="hvit" kunMerke />
                </div>
              </Rund>
              <small>Profilbilde 1080 × 1080</small>
            </Avatarrute>
            <Signatur>
              <div style={{ width: 150 }}>
                <LogoSvg design={rent} innhold={innhold} />
              </div>
              <p>
                <strong>Ditt navn</strong>
                <br />
                Tittel · {navn}
                <br />
                Telefon · nettside
              </p>
              <small>E-postsignatur</small>
            </Signatur>
          </Digitalt>
          {fot()}
        </Ark>
      ),
    },
  ]
}

/* --------------------------------------------------------------- visninger */

/** Et ark skalert til bredden det får. */
function Skalert({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [s, setS] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new ResizeObserver(([e]) => setS(e.contentRect.width / B))
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return (
    <SkalertRamme ref={ref}>
      <div style={{ width: B, height: H, transform: `scale(${s})` }}>{children}</div>
    </SkalertRamme>
  )
}

/** Hele boka, ark under ark – til den rene profilsiden. */
export default function Profil({ design, innhold }: { design: Design; innhold: Innhold }) {
  return (
    <Bok>
      {lagSider(design, innhold).map(({ navn, side }) => (
        <Skalert key={navn}>{side}</Skalert>
      ))}
    </Bok>
  )
}

/**
 * Miniatyrene i verktøyet: hele boka på én skjerm, og et klikk åpner
 * fremviseren. Steget skal ikke være seks skjermer med rulling.
 */
export function ProfilMiniatyrer({ design, innhold }: { design: Design; innhold: Innhold }) {
  const sider = lagSider(design, innhold)
  const [apen, setApen] = useState<number | null>(null)
  return (
    <>
      <Miniatyrer>
        {sider.map(({ navn, side }, i) => (
          <Miniatyr key={navn} type="button" onClick={() => setApen(i)} aria-label={`Åpne ${navn}`}>
            <Skalert>{side}</Skalert>
            <span>{navn}</span>
          </Miniatyr>
        ))}
      </Miniatyrer>
      {apen !== null && <Fremviser sider={sider} start={apen} onLukk={() => setApen(null)} />}
    </>
  )
}

export function ApneProfil({ design, innhold, children }: { design: Design; innhold: Innhold; children: ReactNode }) {
  const [apen, setApen] = useState(false)
  return (
    <>
      <Apneknapp type="button" onClick={() => setApen(true)}>
        {children}
      </Apneknapp>
      {apen && <Fremviser sider={lagSider(design, innhold)} start={0} onLukk={() => setApen(false)} />}
    </>
  )
}

/** Fullskjerm, ett ark om gangen. Piltaster, sveip og Esc. */
function Fremviser({
  sider,
  start,
  onLukk,
}: {
  sider: { navn: string; side: ReactNode }[]
  start: number
  onLukk: () => void
}) {
  const [i, setI] = useState(start)
  const ref = useRef<HTMLDialogElement>(null)
  const x0 = useRef<number | null>(null)
  const ga = (d: number) => setI((n) => Math.max(0, Math.min(sider.length - 1, n + d)))

  useEffect(() => {
    ref.current?.showModal()
    const tast = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') ga(1)
      if (e.key === 'ArrowLeft') ga(-1)
    }
    window.addEventListener('keydown', tast)
    return () => window.removeEventListener('keydown', tast)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- én gang ved åpning
  }, [])

  return (
    <Dialog
      ref={ref}
      onClose={onLukk}
      aria-label="Visuell profil"
      onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (x0.current === null) return
        const dx = e.changedTouches[0].clientX - x0.current
        if (Math.abs(dx) > 50) ga(dx < 0 ? 1 : -1)
        x0.current = null
      }}
    >
      <Topplinje>
        <span>
          {sider[i].navn} · {i + 1} / {sider.length}
        </span>
        <button type="button" onClick={() => ref.current?.close()}>
          Lukk
        </button>
      </Topplinje>
      <Scene>
        <Skalert>{sider[i].side}</Skalert>
      </Scene>
      <Piler>
        <button type="button" onClick={() => ga(-1)} disabled={i === 0} aria-label="Forrige">
          ←
        </button>
        <button type="button" onClick={() => ga(1)} disabled={i === sider.length - 1} aria-label="Neste">
          →
        </button>
      </Piler>
    </Dialog>
  )
}

/* ------------------------------------------------------------- fargedata */

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

/** Omtrentlig CMYK fra RGB – til prøvetrykk, ikke til endelig fargestyring. */
function cmyk(h: string) {
  const [r, g, b] = rgb(h).map((v) => v / 255)
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return [0, 0, 0, 100]
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100))
}

function erMork(h: string) {
  const [r, g, b] = rgb(h)
  return 0.299 * r + 0.587 * g + 0.114 * b < 150
}

function Fargedata({ hex, navn }: { hex: string; navn: string }) {
  return (
    <dl>
      <dt>{navn}</dt>
      <dd>{hex.toUpperCase()}</dd>
      <dd>RGB {rgb(hex).join(' ')}</dd>
      <dd>CMYK {cmyk(hex).join(' ')}</dd>
    </dl>
  )
}

/* ---------------------------------------------------------------- vannmerke */

/**
 * Vannmerket i editoren: ett diskret stempel, ikke et tapet av tekst. Nok
 * til at et skjermbilde ikke er en ferdig fil – ikke så mye at logoen ikke
 * kan vurderes.
 */
export function Vannmerke({ children, lys }: { children: ReactNode; lys?: boolean }) {
  return (
    <VannmerkeRamme $lys={lys}>
      {children}
      <span aria-hidden="true" data-stempel="Forhåndsvisning" />
    </VannmerkeRamme>
  )
}

const stempel = (farge: string) => `
  content: 'Forhåndsvisning';
  position: absolute;
  top: 20px;
  right: 24px;
  padding: 4px 12px;
  border: 1px solid ${farge};
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${farge};
  pointer-events: none;
`

/* Stempelet plasseres mot nærmeste posisjonerte forelder (lerretet), i
   hjørnet – aldri oppå slagordet. */
const VannmerkeRamme = styled.div<{ $lys?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;

  /* Teksten ligger i ::after: den er ren dekor, ikke innhold. */
  > span::after {
    content: attr(data-stempel);
  }

  > span {
    position: absolute;
    top: 1.1rem;
    right: 1.25rem;
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ $lys }) => ($lys ? 'rgba(255,255,255,0.45)' : 'rgba(29,29,31,0.28)')};
    pointer-events: none;
  }

  [data-vannmerke='av'] & > span {
    display: none;
  }
`

/* ------------------------------------------------------------------- stiler */

const Apneknapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentVivid};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 600;
  color: #fff;
  cursor: pointer;

  transition:
    background-color 0.2s ease,
    transform 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentVividHover};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }
`

const Bok = styled.div`
  display: grid;
  gap: 1rem;
`

const SkalertRamme = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${B} / ${H};
  overflow: hidden;
  border-radius: 12px;

  > div {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }
`

const Ark = styled.section<{ $bg: string; $fri?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: ${B}px;
  height: ${H}px;
  padding: ${({ $fri }) => ($fri ? '0' : '48px 56px 40px')};
  overflow: hidden;
  background: ${({ $bg }) => $bg};
  color: ${({ theme }) => theme.colors.ink};
  user-select: none;
  -webkit-user-select: none;

  &::after {
    ${stempel('rgba(127,127,127,0.18)')}
  }

  [data-vannmerke='av'] &::after {
    display: none;
  }
`

const Midt = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`

const Etikett = styled.p<{ $lys?: boolean; $flytende?: boolean }>`
  position: ${({ $flytende }) => ($flytende ? 'absolute' : 'relative')};
  top: ${({ $flytende }) => ($flytende ? '48px' : 'auto')};
  left: ${({ $flytende }) => ($flytende ? '56px' : 'auto')};
  z-index: 1;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $lys, theme }) => ($lys ? '#fff' : theme.colors.inkMuted)};
`

const Fot = styled.div<{ $lys?: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  /* Arkene ligger på primær- og lysfargen; grått leses ikke på dem. */
  color: ${({ $lys, theme }) => ($lys ? '#fff' : theme.colors.inkMuted)};
`

const Linje = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Frisone = styled.div`
  position: relative;
  width: 620px;
  padding: 64px;

  i {
    position: absolute;
    inset: 0;
    border: 2px dashed ${({ theme }) => theme.colors.accentVivid};
    border-radius: 6px;
  }

  b {
    position: absolute;
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accentVivid};
  }

  .topp {
    top: 20px;
    left: 50%;
  }

  .side {
    top: 50%;
    left: 22px;
    transform: translateY(-50%);
  }
`

const Celle = styled.div<{ $bg: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background: ${({ $bg }) => $bg};

  small {
    position: absolute;
    left: 14px;
    bottom: 10px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Bruksrad = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  figure {
    display: grid;
    gap: 8px;
    margin: 0;
  }

  figure > div {
    height: 150px;
  }

  figcaption {
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Rund = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  aspect-ratio: 1;
  border-radius: 50%;
`

const Digitalt = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 14px;
  flex: 1;
  min-height: 0;

  small {
    position: absolute;
    left: 14px;
    bottom: 10px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.92);
  }

  > * {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
  }
`

const Banner = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Post = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 24px 40px;

  .merke {
    width: 48px;
  }

  p {
    margin: 0;
    font-size: 30px;
    line-height: 1.1;
    color: #fff;
  }
`

const Avatarrute = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;

  small {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Signatur = styled.div`
  display: grid;
  align-content: center;
  gap: 14px;
  padding: 24px;
  background: #fff;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  strong {
    color: ${({ theme }) => theme.colors.ink};
  }

  small {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Fargeoppslag = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  flex: 1;

  .stor {
    grid-row: span 2;
  }
`

const Fargeblokk = styled.div<{ $hex: string; $lys?: boolean; $kant?: boolean }>`
  display: flex;
  align-items: flex-end;
  padding: 20px;
  border-radius: 16px;
  background: ${({ $hex }) => $hex};
  border: ${({ $kant, theme }) => ($kant ? `1px solid ${theme.colors.border}` : '0')};
  color: ${({ $lys, theme }) => ($lys ? '#fff' : theme.colors.ink)};

  dl {
    margin: 0;
  }

  dt {
    font-size: 20px;
    font-weight: 600;
  }

  dd {
    margin: 0;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }
`

const Andel = styled.div`
  display: flex;
  gap: 3px;
  height: 32px;
  overflow: hidden;
  border-radius: 999px;

  i {
    display: flex;
    align-items: center;
    padding: 0 14px;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Tospalte = styled.div<{ $fri?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ $fri }) => ($fri ? '0' : '40px')};
  flex: 1;
  align-items: ${({ $fri }) => ($fri ? 'stretch' : 'center')};
`

const Aa = styled.p`
  margin: 0;
  font-size: 220px;
  line-height: 0.9;
  letter-spacing: -0.02em;
`

const Alfabet = styled.p`
  margin: 16px 0 0;
  font-size: 22px;
  line-height: 1.4;
`

const Hierarki = styled.div`
  display: grid;
  gap: 16px;

  p {
    margin: 0;
  }

  p:nth-child(1) {
    font-size: 56px;
    line-height: 1.05;
  }

  p:nth-child(2) {
    font-size: 30px;
  }

  p:nth-child(3) {
    font-size: 18px;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  p:nth-child(4) {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

/**
 * Seks bilder på ett ark, som et redaksjonelt oppslag: skiltet stort til
 * venstre, to høye i midten (kortet, veska) og tre brede til høyre (vinduet,
 * koppen, skjorta) – formatene passer fotoene, så lite må beskjæres bort.
 */
const Bruk = styled.div`
  display: grid;
  grid-template-columns: 1.7fr 1fr 1fr;
  grid-template-rows: repeat(6, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;

  > div {
    min-height: 0;
    overflow: hidden;
    border-radius: 14px;
  }

  > div:nth-child(1) {
    grid-row: 1 / -1;
  }

  > div:nth-child(2),
  > div:nth-child(5) {
    grid-column: 2;
    grid-row: span 3;
  }

  > div:nth-child(3),
  > div:nth-child(4),
  > div:nth-child(6) {
    grid-column: 3;
    grid-row: span 2;
  }
`

/**
 * Seks ark i to hele rader. Bredden følger skjermhøyden, så begge radene
 * står over bretten på en vanlig laptop – steget er én skjerm, ikke en side.
 */
const Miniatyrer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  width: min(100%, calc((100dvh - 440px) * ${B / H} * 1.45));
  min-width: min(100%, 720px);

  @media (max-width: 760px) {
    display: flex;
    gap: 0.6rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 0.5rem;

    > * {
      flex: 0 0 72%;
      scroll-snap-align: start;
    }
  }
`

const Miniatyr = styled.button`
  display: grid;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  cursor: zoom-in;

  > div {
    border: 1px solid ${({ theme }) => theme.colors.border};
    transition: transform ${({ theme }) => theme.transitions.default};
  }

  &:hover > div {
    transform: translateY(-2px);
  }

  /* Bare bildeteksten – ikke tekst inne i arket. */
  > span {
    font-size: var(--fs-small);
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible > div {
    box-shadow: 0 0 0 4px rgba(0, 92, 200, 0.28);
  }

  &:active > div {
    transform: scale(0.99);
  }
`

const Dialog = styled.dialog`
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: #111113;
  color: #fff;

  &::backdrop {
    background: rgba(0, 0, 0, 0.7);
  }

  &[open] {
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
`

const Topplinje = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  font-size: var(--fs-small);
  color: rgba(255, 255, 255, 0.75);

  button {
    min-height: 40px;
    padding: 0 1rem;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    font: inherit;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px rgba(120, 170, 255, 0.45);
    }
  }
`

const Scene = styled.div`
  display: grid;
  place-items: center;
  min-height: 0;
  padding: 0 1rem;

  > div {
    width: min(100%, calc((100dvh - 9rem) * ${B} / ${H}));
  }
`

const Piler = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;

  button {
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    font-size: 1.25rem;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px rgba(120, 170, 255, 0.45);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
`

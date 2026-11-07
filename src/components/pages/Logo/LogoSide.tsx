import { useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { useSEO } from '../../../hooks/useSEO'
import { brodsmuler, ORG_ID } from '../../../lib/jsonLd'
import Sidehode from '../../layout/Sidehode'
import Avslutt from '../../hjem/Avslutt'
import { Knapp, Seksjon, Wrap } from '../../../ui'
import { MERKER, PALETT, type Farge, type Form, type Merke, type Oppsett } from './merker'
import { formaterPris, tillegg } from '../../../data/pakker'

/**
 * Logoverktøyet.
 *
 * Et ekte, gratis verktøy – ikke en demo. Den som trenger en nettside
 * mangler som regel også en logo, og her kan han lage en på et minutt og ta
 * den med seg uansett hvem som ender opp med å lage siden. Det er den beste
 * grunnen vi har til at noen besøker vimzo.no i det hele tatt.
 *
 * Alt skjer i nettleseren: ingenting lastes opp, ingenting lagres. SVG-en
 * bygges av nøyaktig samme markup som vises på skjermen, så det du ser er
 * det du laster ned. PNG tegnes via canvas, slik at skriften brennes inn og
 * filen ser lik ut uansett hvilke fonter mottakeren har.
 */
const SKRIFTSTABEL = '"Geist", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'

export default function LogoSide() {
  const [navn, setNavn] = useState('Hansen Rør')
  const [merke, setMerke] = useState<Merke>(MERKER[0])
  const [farge, setFarge] = useState<Farge>(PALETT[0])
  const [oppsett, setOppsett] = useState<Oppsett>('side')
  const [form, setForm] = useState<Form>('flis')
  const [versaler, setVersaler] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const visNavn = navn.trim() || 'Ditt firma'
  const tekst = versaler ? visNavn.toUpperCase() : visNavn
  const filnavn = useMemo(
    () =>
      visNavn
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'logo',
    [visNavn],
  )

  /** Serialiser SVG-en på skjermen til en frittstående fil. */
  function svgTekst(): string {
    const node = svgRef.current
    if (!node) return ''
    const kopi = node.cloneNode(true) as SVGSVGElement
    kopi.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(kopi)
  }

  function lastNed(blob: Blob, endelse: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filnavn}-logo.${endelse}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function lastNedSvg() {
    lastNed(new Blob([svgTekst()], { type: 'image/svg+xml' }), 'svg')
  }

  /**
   * PNG i 4× oppløsning. Vi går veien om et bilde i stedet for å tegne på
   * canvas for hånd, så PNG-en garantert blir identisk med SVG-en.
   */
  function lastNedPng() {
    const node = svgRef.current
    if (!node) return
    const bredde = node.viewBox.baseVal.width || 600
    const hoyde = node.viewBox.baseVal.height || 200
    const skala = 4

    const bilde = new Image()
    bilde.onload = () => {
      const lerret = document.createElement('canvas')
      lerret.width = bredde * skala
      lerret.height = hoyde * skala
      const ctx = lerret.getContext('2d')
      if (!ctx) return
      ctx.drawImage(bilde, 0, 0, lerret.width, lerret.height)
      lerret.toBlob((blob) => blob && lastNed(blob, 'png'), 'image/png')
    }
    bilde.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgTekst())
  }

  useSEO({
    title: 'Lag logo gratis – logoverktøy for norske bedrifter | Vimzo',
    description:
      'Lag en enkel, ryddig logo til bedriften din på ett minutt. Velg merke, farge og ' +
      'oppsett, og last ned som SVG og PNG. Gratis, ingen innlogging, ingenting lagres.',
    jsonLd: [
      brodsmuler([{ navn: 'Lag logo', sti: '/logo' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Vimzo logoverktøy',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Nettleser',
        url: 'https://vimzo.no/logo',
        inLanguage: 'nb-NO',
        description:
          'Gratis verktøy for å lage en enkel bedriftslogo. Velg merke, farge og oppsett, og ' +
          'last ned som SVG og PNG.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
        provider: { '@id': ORG_ID },
      },
    ],
  })

  return (
    <>
      <Sidehode
        smuler={[{ navn: 'Lag logo' }]}
        stikkord="Gratis verktøy"
        tittel="Lag logoen din nå."
        ingress="Velg et merke, en farge og et oppsett. Last ned som SVG og PNG og bruk den til hva du vil – også om du aldri bestiller noe av oss."
      />

      <Seksjon $flate="paper">
        <Wrap>
          <Oppstilling>
            <Styring>
              <Blokk>
                <Etikett htmlFor="firmanavn">Firmanavn</Etikett>
                <Input
                  id="firmanavn"
                  value={navn}
                  onChange={(e) => setNavn(e.target.value.slice(0, 26))}
                  placeholder="Ditt firma"
                  autoComplete="organization"
                />
              </Blokk>

              <Blokk>
                <Etikett as="p">Merke</Etikett>
                <Merkerad role="group" aria-label="Velg merke">
                  {MERKER.map((m) => (
                    <Merkeknapp
                      key={m.id}
                      type="button"
                      aria-label={m.navn}
                      aria-pressed={m.id === merke.id}
                      $valgt={m.id === merke.id}
                      onClick={() => setMerke(m)}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                        {m.baner.map((d, i) => (
                          <path key={i} d={d} fill="currentColor" fillRule={m.evenodd ? 'evenodd' : undefined} />
                        ))}
                      </svg>
                    </Merkeknapp>
                  ))}
                </Merkerad>
              </Blokk>

              <Blokk>
                <Etikett as="p">Farge</Etikett>
                <Fargerad role="group" aria-label="Velg farge">
                  {PALETT.map((f) => (
                    <Fargeknapp
                      key={f.id}
                      type="button"
                      aria-label={f.navn}
                      aria-pressed={f.id === farge.id}
                      $hex={f.hex}
                      $valgt={f.id === farge.id}
                      onClick={() => setFarge(f)}
                    />
                  ))}
                </Fargerad>
              </Blokk>

              <ToKol>
                <Blokk>
                  <Etikett as="p">Oppsett</Etikett>
                  <Valgrad role="group" aria-label="Velg oppsett">
                    {(
                      [
                        ['side', 'Side om side'],
                        ['over', 'Merke over'],
                        ['kun-merke', 'Kun merke'],
                      ] as const
                    ).map(([id, navn]) => (
                      <Valg key={id} type="button" $valgt={oppsett === id} onClick={() => setOppsett(id)}>
                        {navn}
                      </Valg>
                    ))}
                  </Valgrad>
                </Blokk>

                <Blokk>
                  <Etikett as="p">Merkeform</Etikett>
                  <Valgrad role="group" aria-label="Velg merkeform">
                    <Valg type="button" $valgt={form === 'flis'} onClick={() => setForm('flis')}>
                      Farget flis
                    </Valg>
                    <Valg type="button" $valgt={form === 'rent'} onClick={() => setForm('rent')}>
                      Rent merke
                    </Valg>
                  </Valgrad>
                </Blokk>
              </ToKol>

              <Bryter>
                <input
                  type="checkbox"
                  checked={versaler}
                  onChange={(e) => setVersaler(e.target.checked)}
                />
                <span>Store bokstaver i navnet</span>
              </Bryter>

              <Nedlasting>
                <Knapp onClick={lastNedPng} variant="aksent" ikon="pilNed">
                  Last ned PNG
                </Knapp>
                <Knapp onClick={lastNedSvg} variant="myk" ikon="pilNed">
                  SVG
                </Knapp>
              </Nedlasting>
              <Fotnote>
                Alt skjer i nettleseren. Ingenting lastes opp, og vi lagrer ingenting. Logoen er
                din – bruk den fritt.
              </Fotnote>
            </Styring>

            <Forhandsvisning>
              <Lerret $morkt={false}>
                <Logo
                  ref={svgRef}
                  navn={tekst}
                  merke={merke}
                  hex={farge.hex}
                  oppsett={oppsett}
                  form={form}
                  tekstfarge="#0E1117"
                />
              </Lerret>

              <Smaa>
                <Lerret $morkt $liten>
                  <Logo
                    navn={tekst}
                    merke={merke}
                    hex={form === 'flis' ? farge.hex : '#FFFFFF'}
                    oppsett={oppsett}
                    form={form}
                    tekstfarge="#FFFFFF"
                  />
                </Lerret>
                <Lerret $liten>
                  <Logo
                    navn={tekst}
                    merke={merke}
                    hex="#0E1117"
                    oppsett={oppsett}
                    form={form}
                    tekstfarge="#0E1117"
                  />
                </Lerret>
              </Smaa>
              <Bildetekst>Slik ser den ut på mørk bakgrunn og i svart-hvitt.</Bildetekst>
            </Forhandsvisning>
          </Oppstilling>

          <Neste>
            <div>
              <h2>Vil du ha den ferdig tegnet?</h2>
              <p>
                Verktøyet gir deg en ryddig logo på et minutt. Trenger du noe som er tegnet for
                akkurat din bedrift – med farger og skrifttyper som hører sammen – tegner vi den for{' '}
                {formaterPris(tillegg('Logo').pris)} kroner.
              </p>
            </div>
            <Knapp til="/kontakt" variant="mork" ikon="pilHoyre">
              Snakk med oss
            </Knapp>
          </Neste>
        </Wrap>
      </Seksjon>

      <Avslutt
        tittel="Logo på plass. Mangler du siden?"
        tekst="Vi lager hele nettsiden for bedriften din – domene, tekst, bilder og publisering. Se hva det omtrent koster, og ta en prat."
      />
    </>
  )
}

/* ------------------------------------------------------------------- logoen */

interface LogoProps {
  navn: string
  merke: Merke
  hex: string
  oppsett: Oppsett
  form: Form
  tekstfarge: string
  ref?: React.Ref<SVGSVGElement>
}

/**
 * Selve logoen, som SVG.
 *
 * Målene regnes ut fra oppsettet slik at viewBox alltid sitter tett rundt
 * innholdet – da får nedlastet fil ingen tilfeldig luft rundt seg, og PNG-en
 * kan skaleres rett opp uten å bli liten i et stort lerret.
 */
function Logo({ navn, merke, hex, oppsett, form, tekstfarge, ref }: LogoProps) {
  const flis = form === 'flis'
  const M = 64 // merkestørrelse
  const skala = M / 24
  const innrykk = flis ? M * 0.22 : 0
  const merkeSkala = flis ? (M - innrykk * 2) / 24 : skala
  const merkeFarge = flis ? '#FFFFFF' : hex

  const skriftgrad = M * 0.52
  const tekstbredde = navn.length * skriftgrad * 0.56
  const mellomrom = M * 0.34

  const bredde = oppsett === 'kun-merke' ? M : oppsett === 'side' ? M + mellomrom + tekstbredde : Math.max(M, tekstbredde)
  const hoyde = oppsett === 'over' ? M + mellomrom * 0.8 + skriftgrad : M

  const merkeX = oppsett === 'over' ? (bredde - M) / 2 : 0
  const tekstX = oppsett === 'side' ? M + mellomrom : bredde / 2
  const tekstY = oppsett === 'side' ? M / 2 : M + mellomrom * 0.8 + skriftgrad * 0.36

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${Math.ceil(bredde)} ${Math.ceil(hoyde)}`}
      width={Math.ceil(bredde)}
      height={Math.ceil(hoyde)}
      role="img"
      aria-label={`Logo for ${navn}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <g transform={`translate(${merkeX} 0)`}>
        {flis && <rect width={M} height={M} rx={M * 0.26} fill={hex} />}
        <g transform={`translate(${innrykk} ${innrykk}) scale(${merkeSkala})`}>
          {merke.baner.map((d, i) => (
            <path key={i} d={d} fill={merkeFarge} fillRule={merke.evenodd ? 'evenodd' : undefined} />
          ))}
        </g>
      </g>

      {oppsett !== 'kun-merke' && (
        <text
          x={tekstX}
          y={tekstY}
          fontFamily={SKRIFTSTABEL}
          fontSize={skriftgrad}
          fontWeight={650}
          letterSpacing={-skriftgrad * 0.035}
          fill={tekstfarge}
          textAnchor={oppsett === 'side' ? 'start' : 'middle'}
          dominantBaseline={oppsett === 'side' ? 'central' : 'auto'}
        >
          {navn}
        </text>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------- stiler */

const Oppstilling = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Styring = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

const Blokk = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`

const ToKol = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Etikett = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.sunken};
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.colors.ink};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Merkerad = styled.div`
  /* Fast firekolonners rutenett: med auto-fill ble siste merke stående
     alene på rad to på vanlige bredder. */
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  max-width: 17rem;
`

const Merkeknapp = styled.button<{ $valgt: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  ${({ $valgt, theme }) =>
    $valgt
      ? css`
          background: ${theme.colors.ink};
          color: #fff;
        `
      : css`
          background: ${theme.colors.sunken};
          color: ${theme.colors.inkMuted};
          &:hover {
            color: ${theme.colors.accent};
          }
        `}
`

const Fargerad = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Fargeknapp = styled.button<{ $hex: string; $valgt: boolean }>`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: ${({ $hex }) => $hex};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.default};
  box-shadow: ${({ $valgt, theme }) =>
    $valgt ? `0 0 0 2px ${theme.colors.paper}, 0 0 0 4px ${theme.colors.ink}` : 'none'};

  &:hover {
    transform: scale(1.1);
  }
`

const Valgrad = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const Valg = styled.button<{ $valgt: boolean }>`
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 550;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};

  ${({ $valgt, theme }) =>
    $valgt
      ? css`
          background: ${theme.colors.ink};
          color: #fff;
        `
      : css`
          background: ${theme.colors.sunken};
          color: ${theme.colors.inkMuted};
          &:hover {
            color: ${theme.colors.ink};
          }
        `}
`

const Bryter = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.925rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
  }
`

const Nedlasting = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`

const Fotnote = styled.p`
  font-size: 0.82rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Forhandsvisning = styled.div`
  position: sticky;
  top: 7rem;

  @media (max-width: 960px) {
    position: static;
  }
`

const Lerret = styled.div<{ $morkt?: boolean; $liten?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ $liten }) => ($liten ? '1.5rem 1rem' : 'clamp(2.5rem, 6vw, 4.5rem) 2rem')};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme, $morkt }) => ($morkt ? theme.colors.deep : theme.colors.surface)};
  box-shadow: ${({ theme }) => theme.shadows.md};

  svg {
    max-width: ${({ $liten }) => ($liten ? '160px' : '100%')};
    height: auto;
  }
`

const Smaa = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const Bildetekst = styled.p`
  margin-top: 1rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Neste = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.75rem;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  padding: clamp(1.75rem, 3vw, 2.25rem);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.sunken};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: -0.03em;
    margin-bottom: 0.5rem;
  }

  p {
    max-width: 62ch;
    font-size: 0.95rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

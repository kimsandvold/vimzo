import type { ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import Icon, { type IkonNavn } from '../components/shared/Icon'

/**
 * Byggeklossene hele nettstedet er satt sammen av.
 *
 * Ett gitter, én overskriftsstil, én knapp, én innsigsanimasjon. Når alt på
 * siden kommer herfra, leser forsiden og undersidene som samme sted – og en
 * ny seksjon tar minutter i stedet for at noen finner på en ny kortstil.
 *
 * Uttrykket er lyst og luftig: store overskrifter, mye tomrom, runde hjørner
 * og myke skygger i stedet for streker.
 */

/* ------------------------------------------------------------------ oppsett */

export const Wrap = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1.25rem;
  }
`

export type Flate = 'paper' | 'surface' | 'tint' | 'deep'

export const Seksjon = styled.section<{ $flate?: Flate; $tett?: boolean }>`
  position: relative;
  padding: ${({ theme, $tett }) => ($tett ? theme.spacing.seksjonTett : theme.spacing.seksjon)} 0;

  ${({ theme, $flate = 'paper' }) => {
    if ($flate === 'deep')
      return css`
        background: ${theme.colors.deep};
        color: ${theme.colors.inkInverted};
      `
    if ($flate === 'tint') return css`background: ${theme.colors.sunken};`
    if ($flate === 'surface') return css`background: ${theme.colors.surface};`
    return css`background: ${theme.colors.paper};`
  }}
`

/* ---------------------------------------------------------------- typografi */

/**
 * Stikkordet over en overskrift. Grått og i små versaler – en etikett, ikke
 * en lenke. Det sto i aksentfargen før, og da var det umulig å se forskjell på
 * det og tekst man kunne klikke på. Aksentfargen er for lenker og knapper.
 */
export const Stikkord = styled.p<{ $lys?: boolean }>`
  /* && gir dobbel klasse, så stikkordet vinner over en seksjons egen
     «p { … }»-regel. Uten det arvet det ingressens grad noen steder, og
     samme etikett sto i tre ulike størrelser rundt på nettstedet. */
  && {
    margin: 0 0 1rem;
    font-size: var(--fs-micro);
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme, $lys }) => ($lys ? theme.colors.inkInvertedMuted : theme.colors.inkSubtle)};
  }
`

/**
 * Seksjonsoverskriften, i to nivåer.
 *
 * Alle syv seksjonene sto i samme grad før – samme stikkord, samme
 * tolinjers overskrift, samme sted, syv ganger. Siden hadde ett grep og
 * gjentok det, og da leser den jevn i stedet for komponert.
 *
 * `stor` er for de to seksjonene som bærer salget: hva du får, og hva det
 * koster. `medium` er for dem som støtter opp. Forskjellen i grad forteller
 * leseren hva som er viktigst uten at vi må si det.
 */
export const Tittel = styled.h2<{ $niva?: 'stor' | 'medium' }>`
  margin: 0;
  font-size: var(--fs-heading);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: var(--ls-heading);
  /* Ingen smal sperre. 15ch tvang fram linjeskift i overskrifter som fint
     fikk plass på én linje («La kunden regne / ut prisen selv.»). */
  max-width: 28ch;
  text-wrap: balance;
`

export const Ingress = styled.p<{ $lys?: boolean }>`
  margin: 1.25rem 0 0;
  max-width: 48ch;
  font-size: var(--fs-lead);
  line-height: 1.55;
  color: ${({ theme, $lys }) => ($lys ? theme.colors.inkInvertedMuted : theme.colors.inkMuted)};
`

/** Tittel til venstre, lenke eller ingress til høyre, satt på samme grunnlinje. */
export const Hode = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem 4rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
`

/* ------------------------------------------------------------------ innsig */

const InnsigBoks = styled.div<{ $synlig: boolean; $forsinkelse: number }>`
  opacity: ${({ $synlig }) => ($synlig ? 1 : 0)};
  transform: translateY(${({ $synlig }) => ($synlig ? '0' : '26px')});
  transition:
    opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${({ $forsinkelse }) => $forsinkelse}ms,
    transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${({ $forsinkelse }) => $forsinkelse}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`

/** Mykt innsig når innholdet rulles fram. Forsinkelse gir trappetrinn i gitre. */
export function Innsig({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
  const [ref, synlig] = useIntersectionObserver({ threshold: 0.1, rootMargin: '0px 0px -60px 0px' })
  return (
    <InnsigBoks ref={ref} $synlig={synlig} $forsinkelse={forsinkelse}>
      {children}
    </InnsigBoks>
  )
}

/* ------------------------------------------------------------------ knapper */

export type KnappVariant = 'aksent' | 'mork' | 'hvit' | 'glass' | 'myk'

const knappStil = css<{ $variant: KnappVariant; $stor?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: ${({ $stor }) => ($stor ? '56px' : '48px')};
  padding: 0 ${({ $stor }) => ($stor ? '1.9rem' : '1.5rem')};
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: var(--ls-body);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  &:active {
    transform: scale(0.985);
  }

  ${({ theme, $variant }) => {
    switch ($variant) {
      case 'aksent':
        return css`
          background: ${theme.colors.accentVivid};
          color: #fff;
          /* Ingen farget skygge. Den fikk knappen til å gløde, og en knapp
             som gløder ser ut som reklame – ikke som et trygt valg. */
          &:hover {
            background: ${theme.colors.accentHover};
          }
        `
      case 'hvit':
        return css`
          background: #fff;
          color: ${theme.colors.ink};
          box-shadow: ${theme.shadows.md};
          &:hover {
            border-color: ${theme.colors.borderStrong};
          }
        `
      case 'glass':
        return css`
          background: rgba(251, 247, 240, 0.1);
          color: ${theme.colors.inkInverted};
          box-shadow: inset 0 0 0 1px rgba(251, 247, 240, 0.24);
          backdrop-filter: saturate(160%) blur(18px);
          -webkit-backdrop-filter: saturate(160%) blur(18px);
          &:hover {
            background: rgba(251, 247, 240, 0.18);
          }
        `
      case 'myk':
        return css`
          background: ${theme.colors.accentSoft};
          color: ${theme.colors.accentInk};
          &:hover {
            background: #D9E6F8;
          }
        `
      default:
        return css`
          background: ${theme.colors.ink};
          color: #fff;
          &:hover {
            background: ${theme.colors.neutral[700]};
          }
        `
    }
  }}
`

const KnappLenke = styled(Link)<{ $variant: KnappVariant; $stor?: boolean }>`
  ${knappStil}
`
const KnappAnker = styled.a<{ $variant: KnappVariant; $stor?: boolean }>`
  ${knappStil}
`
const KnappKnapp = styled.button<{ $variant: KnappVariant; $stor?: boolean }>`
  ${knappStil}
`

interface KnappProps {
  children: ReactNode
  til?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: KnappVariant
  stor?: boolean
  ikon?: IkonNavn
  disabled?: boolean
  'aria-label'?: string
}

/** Én knapp for hele siden. Velger selv lenke, anker eller ekte `<button>`. */
export function Knapp({
  children,
  til,
  href,
  onClick,
  type = 'button',
  variant = 'aksent',
  stor,
  ikon,
  disabled,
  ...rest
}: KnappProps) {
  const innhold = (
    <>
      <span>{children}</span>
      {ikon && <Icon navn={ikon} storrelse="1.1em" tykkelse={2} />}
    </>
  )
  if (til)
    return (
      <KnappLenke to={til} onClick={onClick} $variant={variant} $stor={stor} {...rest}>
        {innhold}
      </KnappLenke>
    )
  if (href) {
    const ute = href.startsWith('http')
    return (
      <KnappAnker
        href={href}
        onClick={onClick}
        $variant={variant}
        $stor={stor}
        target={ute ? '_blank' : undefined}
        rel={ute ? 'noopener noreferrer' : undefined}
        {...rest}
      >
        {innhold}
      </KnappAnker>
    )
  }
  return (
    <KnappKnapp type={type} onClick={onClick} disabled={disabled} $variant={variant} $stor={stor} {...rest}>
      {innhold}
    </KnappKnapp>
  )
}

const PilStil = css<{ $lys?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: var(--ls-body);
  text-decoration: none;
  color: ${({ theme, $lys }) => ($lys ? theme.colors.inkInverted : theme.colors.accent)};

  svg {
    transition: transform ${({ theme }) => theme.transitions.default};
  }
  &:hover svg {
    transform: translateX(4px);
  }
`

const PilStyled = styled(Link)<{ $lys?: boolean }>`
  ${PilStil}
`

/** Lenke med pil. Brukes der en hel knapp ville tatt for mye oppmerksomhet. */
export function Pil({ til, children, lys }: { til: string; children: ReactNode; lys?: boolean }) {
  return (
    <PilStyled to={til} $lys={lys}>
      {children}
      <Icon navn="pilHoyre" storrelse="1em" tykkelse={2} />
    </PilStyled>
  )
}

/* -------------------------------------------------------------------- kort */

/** Hevet flate uten kant. Skyggen gjør jobben en strek ellers ville gjort. */
export const Kort = styled.div<{ $klikkbar?: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition:
    box-shadow ${({ theme }) => theme.transitions.soft},
    transform ${({ theme }) => theme.transitions.soft};

  ${({ $klikkbar, theme }) =>
    $klikkbar &&
    css`
      &:hover {
        transform: translateY(-4px);
        border-color: ${theme.colors.borderStrong};
      }
    `}
`

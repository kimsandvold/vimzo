import { useId, useState } from 'react'
import styled from 'styled-components'
import { formaterTall } from '../../../lib/kroner'

/**
 * Ett tallfelt, med synlig ledetekst over og forklaring under.
 *
 * Ledeteksten forsvinner aldri. En plassholder som blankes i det du begynner
 * å skrive, er ingen ledetekst – da må feltet tømmes for å huske hva det het.
 *
 * `inputMode="numeric"` gir talltastatur på telefon, men `type="text"` holder
 * nettleserens egne pil-knapper og scroll-til-å-endre-verdi unna.
 */

const Rad = styled.div`
  display: grid;
  gap: 0.3rem;
`

const Ledetekst = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;
  letter-spacing: -0.005em;
`

const Ramme = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
`

const Inndata = styled.input`
  flex: 1;
  min-width: 0;
  /* 44 px – minstekravet for noe som skal treffes med en finger. */
  min-height: 46px;
  padding: 0 0.8rem;
  border: 0;
  background: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.body};
  text-align: right;
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
  }
`

const Enhet = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.8rem;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  white-space: nowrap;
`

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: ${({ theme }) => theme.fontSizes.micro};
  line-height: 1.5;
`

export default function Felt({
  navn,
  verdi,
  onEndre,
  enhet,
  hint,
  plassholder,
}: {
  navn: string
  verdi: number
  onEndre: (verdi: number) => void
  enhet: string
  hint?: string
  plassholder?: string
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const [harFokus, settHarFokus] = useState(false)

  /**
   * Tusenskille når feltet ligger i ro, rene siffer når det redigeres.
   *
   * «600 000» er til å lese; «600000» må telles. Men settes skillet inn mens
   * noen taster, hopper markøren hver gang et mellomrom dukker opp foran den.
   */
  const vist = harFokus ? String(verdi) : formaterTall(verdi)

  return (
    <Rad>
      <Ledetekst htmlFor={id}>{navn}</Ledetekst>
      <Ramme>
        <Inndata
          id={id}
          type="text"
          inputMode="numeric"
          value={verdi === 0 ? '' : vist}
          placeholder={plassholder ?? '0'}
          aria-describedby={hint ? hintId : undefined}
          onFocus={() => settHarFokus(true)}
          onBlur={() => settHarFokus(false)}
          onChange={(e) => {
            // Bare siffer. «120 000» limt inn fra et regneark blir 120000,
            // ikke NaN.
            const rent = e.target.value.replace(/[^\d]/g, '')
            onEndre(rent === '' ? 0 : Number(rent))
          }}
        />
        <Enhet>{enhet}</Enhet>
      </Ramme>
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
    </Rad>
  )
}

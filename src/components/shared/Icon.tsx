import type { JSX } from 'react'

/**
 * Ikonene ligger som rå SVG-baner i koden i stedet for i et ikonbibliotek.
 * Grunnen er den samme som resten av siden bygger på: et ikonpakke-avhengig
 * nettsted laster ned titalls kilobyte JavaScript for å tegne ti streker.
 * Her koster hvert ikon noen hundre byte, og de havner rett i den
 * forhåndsrendrede HTML-en.
 *
 * Alle baner er tegnet i et 24×24-rutenett med strek, ikke fyll, slik at
 * strektykkelsen følger størrelsen og ikonene står visuelt likt.
 */
const IKONER = {
  kode: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  lyn: <path d="M4 14h7l-1.2 7.4a.4.4 0 0 0 .7.3L20 10h-7l1.2-7.4a.4.4 0 0 0-.7-.3z" />,
  sok: (
    <>
      <circle cx="11" cy="11" r="7.5" />
      <path d="m21 21-4.6-4.6" />
    </>
  ),
  gnist: (
    <>
      <path d="M11.6 3.1a.4.4 0 0 1 .8 0l1.4 4.5a2 2 0 0 0 1.3 1.3l4.5 1.4a.4.4 0 0 1 0 .8l-4.5 1.4a2 2 0 0 0-1.3 1.3l-1.4 4.5a.4.4 0 0 1-.8 0l-1.4-4.5a2 2 0 0 0-1.3-1.3l-4.5-1.4a.4.4 0 0 1 0-.8l4.5-1.4a2 2 0 0 0 1.3-1.3z" />
      <path d="M19 15.5V19" />
      <path d="M20.75 17.25h-3.5" />
    </>
  ),
  penn: (
    <>
      <path d="M12 20h9" />
      <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7.4 18.6a2 2 0 0 1-.9.5l-2.9.8a.5.5 0 0 1-.6-.6l.8-2.9a2 2 0 0 1 .5-.9z" />
    </>
  ),
  skjold: (
    <>
      <path d="M20 12.5c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20 4 17.5 4 12.5v-7a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.3 17 4.5 19 4.5a1 1 0 0 1 1 1z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  kamera: (
    <>
      <path d="M14.5 4.5h-5L7 7.5H4.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H17z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  samtale: <path d="M21 14.5a2 2 0 0 1-2 2H7.5L3 21V5.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  maler: (
    <>
      <path d="M3.4 18.5a9.5 9.5 0 1 1 17.2 0" />
      <path d="m12 14 3.8-3.8" />
    </>
  ),
  rakett: (
    <>
      <path d="M12 15.2 8.8 12a21 21 0 0 1 2-3.9A12.6 12.6 0 0 1 21.5 2.5c0 2.7-.8 7.3-5.9 10.7a21 21 0 0 1-3.6 2z" />
      <path d="M8.8 12H4.3s.5-3 2-3.9c1.6-1.1 4.9 0 4.9 0" />
      <path d="M12 15.2v4.5s3-.5 3.9-2c1.1-1.6 0-4.9 0-4.9" />
      <path d="M4.8 16.6c-1.5 1.3-2 5-2 5s3.7-.5 5-2a2.2 2.2 0 0 0-3-3z" />
    </>
  ),
  graf: (
    <>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </>
  ),
  globus: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19z" />
    </>
  ),
  klokke: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  epost: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m21 7-8.4 5.3a1.8 1.8 0 0 1-1.9 0L2.9 7" />
    </>
  ),
  kart: (
    <>
      <path d="M19.5 10.5c0 4.7-5.2 9.6-7 11.1a.9.9 0 0 1-1.1 0c-1.8-1.5-7-6.4-7-11.1a7.5 7.5 0 0 1 15 0z" />
      <circle cx="12" cy="10.3" r="2.8" />
    </>
  ),
  telefon: (
    <path d="M21 16.4v2.8a1.9 1.9 0 0 1-2 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.2 4.2 1.9 1.9 0 0 1 4.1 2.2h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.9 9.7a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.9z" />
  ),
  sjekk: <path d="M20 6.5 9.3 17.2l-5-5" />,
  pilHoyre: (
    <>
      <path d="M4.5 12h14" />
      <path d="m12.5 5.5 7 6.5-7 6.5" />
    </>
  ),
  pilNed: (
    <>
      <path d="M12 4.5v14" />
      <path d="m5.5 12 6.5 7 6.5-7" />
    </>
  ),
  meny: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  lukk: (
    <>
      <path d="M18.5 5.5l-13 13" />
      <path d="m5.5 5.5 13 13" />
    </>
  ),
  pluss: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  minus: <path d="M5.5 12h13" />,
  panel: (
    <>
      <path d="M4 7.5h7" />
      <path d="M16.5 7.5H20" />
      <path d="M4 16.5h3.5" />
      <path d="M13 16.5h7" />
      <circle cx="13.7" cy="7.5" r="2.4" />
      <circle cx="10.3" cy="16.5" r="2.4" />
    </>
  ),
  /** Skjerm og telefon ved siden av hverandre – «virker på alle enheter». */
  enheter: (
    <>
      <rect x="2.2" y="4" width="12.6" height="9.6" rx="1.6" />
      <path d="M8.5 13.6v3.6" />
      <path d="M6 17.2h5" />
      <rect x="17" y="8.4" width="4.8" height="11.4" rx="1.6" />
      <path d="M19.1 17.4h.6" />
    </>
  ),
  dokument: (
    <>
      <path d="M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.8z" />
      <path d="M14 2.8v5h5" />
      <path d="M8.8 13h6.4" />
      <path d="M8.8 16.5h4.4" />
    </>
  ),
} as const

export type IkonNavn = keyof typeof IKONER

interface IconProps {
  navn: IkonNavn
  /** Piksler. Følger font-størrelsen når den ikke settes. */
  storrelse?: number | string
  /** Strektykkelse. 1.6 er standard; 2 for små størrelser som trenger tyngde. */
  tykkelse?: number
  className?: string
  /** Sett denne når ikonet står alene og bærer betydning. */
  tittel?: string
}

export default function Icon({ navn, storrelse = '1em', tykkelse = 1.6, className, tittel }: IconProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={storrelse}
      height={storrelse}
      fill="none"
      stroke="currentColor"
      strokeWidth={tykkelse}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={tittel ? 'img' : undefined}
      aria-label={tittel}
      aria-hidden={tittel ? undefined : true}
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {IKONER[navn]}
    </svg>
  )
}

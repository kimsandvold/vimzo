/** Formatering og datoer for /admin. */

export const kr = (n: number | null | undefined) =>
  n === null || n === undefined ? '–' : `${n.toLocaleString('nb-NO')} kr`

export const dato = (ms: number | string | null | undefined, medTid = false) => {
  if (ms === null || ms === undefined) return '–'
  const d = typeof ms === 'string' ? new Date(`${ms}T12:00:00`) : new Date(ms)
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(medTid ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** Dagens dato som 'ÅÅÅÅ-MM-DD' i lokal tid – det et <input type="date"> vil ha. */
export const idag = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'ÅÅÅÅ-MM-DD' → millisekunder, midt på dagen så tidssoner ikke flytter datoen. */
export const tilMs = (iso: string) => new Date(`${iso}T12:00:00`).getTime()


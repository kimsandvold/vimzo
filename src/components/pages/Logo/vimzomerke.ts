/**
 * Vimzos eget merke, til profilarket og ZIP-filen.
 *
 * Kopiert fra src/components/shared/Logo.tsx, der banene ikke eksporteres.
 * Endres merket der, må det endres her også.
 */
export const BANER = [
  'M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z',
  'M678 367L718 435L500 795L461 721Z',
]

/** Merket i 1024-rutenettet, på mørk flis med hvit glyf. */
export function vimzoSvg(storrelse = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${storrelse}" height="${storrelse}" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="150" fill="#1D1D1F"/><g fill="#fff">${BANER.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`
}

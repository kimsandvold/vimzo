/**
 * Homografien som flytter firkanten `fra` til firkanten `til`, som CSS
 * `matrix3d`. Åtte ukjente, åtte likninger – løst med Gauss-eliminasjon.
 * Hver liste er [x0, y0, x1, y1, x2, y2, x3, y3] med hjørnene i rekkefølgen
 * øvre venstre, øvre høyre, nedre høyre, nedre venstre.
 */
export function matrise3d(fra: number[], til: number[]): string {
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const [x, y, u, v] = [fra[i * 2], fra[i * 2 + 1], til[i * 2], til[i * 2 + 1]]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  for (let k = 0; k < 8; k++) {
    let maks = k
    for (let r = k + 1; r < 8; r++) if (Math.abs(A[r][k]) > Math.abs(A[maks][k])) maks = r
    ;[A[k], A[maks]] = [A[maks], A[k]]
    for (let r = 0; r < 8; r++) {
      if (r === k) continue
      const f = A[r][k] / A[k][k]
      for (let c = k; c < 9; c++) A[r][c] -= f * A[k][c]
    }
  }
  const h = A.map((rad, i) => rad[8] / rad[i])
  // [a b c; d e f; g h 1] → kolonnevis 4×4 for CSS.
  const m = [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1]
  return `matrix3d(${m.map((n) => +n.toFixed(10)).join(',')})`
}

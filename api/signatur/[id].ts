/**
 * Logobildet i kundens e-postsignatur: GET /api/signatur/<designId>?bilde=logo|merke
 *
 * Bildet ligger i Firestore (samlingen `signaturbilder`, se
 * src/lib/signaturbilder.ts) og hentes med Firestores REST-API uten
 * innlogging – reglene tillater å lese ett dokument, ikke å liste dem.
 *
 * Svaret mellomlagres lenge: adressen i signaturen har `v=…`, som endres
 * når logoen endres.
 */

const PROSJEKT = process.env.VITE_FIREBASE_PROJECT_ID || 'vimzo-73890'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const id = decodeURIComponent(url.pathname.split('/').pop() ?? '')
  const bilde = url.searchParams.get('bilde') === 'merke' ? 'merke' : 'logo'
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return new Response('Ugyldig id', { status: 400 })

  const svar = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROSJEKT}/databases/(default)/documents/signaturbilder/${id}?mask.fieldPaths=${bilde}`,
  )
  if (!svar.ok) return new Response('Fant ikke bildet', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })

  const dok = (await svar.json()) as { fields?: Record<string, { bytesValue?: string }> }
  const b64 = dok.fields?.[bilde]?.bytesValue
  if (!b64) return new Response('Fant ikke bildet', { status: 404 })

  return new Response(Buffer.from(b64, 'base64'), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

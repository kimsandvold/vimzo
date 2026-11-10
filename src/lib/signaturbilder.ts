import { firebaseKlar, hentDb } from './firebase'

/**
 * Logobildene i e-postsignaturen.
 *
 * En signatur kan ikke ha bildet inni seg (Gmail fjerner det), så det må
 * ligge på en vanlig adresse. Bildene lagres her, i Firestore, under samme
 * id som logoen i `logodesign` – og serveres av api/signatur/[id].ts som
 * https://vimzo.no/api/signatur/<id>?bilde=logo.
 *
 * Firestore-reglene (signaturbilder) lar hvem som helst LESE ett bilde –
 * det står jo i hver e-post kunden sender – men bare eieren av en kjøpt
 * profil kan skrive, og bare små PNG-er.
 */

const SAMLING = 'signaturbilder'

/** Øvre grense per bilde, også i firestore.rules. Bildene er 20–40 kB i praksis. */
export const MAKS_SIGNATURBILDE = 150_000

export async function lagreSignaturbilder(designId: string, bilder: { logo: Blob; merke: Blob }): Promise<void> {
  if (!firebaseKlar) throw new Error('Lagring er ikke tilgjengelig akkurat nå')
  const [{ Bytes, doc, serverTimestamp, setDoc }, { getAuth }, db] = await Promise.all([
    import('firebase/firestore'),
    import('firebase/auth'),
    hentDb(),
  ])
  const uid = getAuth().currentUser?.uid
  if (!uid) throw new Error('Du må være innlogget')
  const bytes = async (b: Blob) => {
    if (b.size > MAKS_SIGNATURBILDE) throw new Error('Signaturbildet ble for stort')
    return Bytes.fromUint8Array(new Uint8Array(await b.arrayBuffer()))
  }
  await setDoc(doc(db, SAMLING, designId), {
    uid,
    logo: await bytes(bilder.logo),
    merke: await bytes(bilder.merke),
    oppdatert: serverTimestamp(),
  })
}

/** Adressen bildet har i signaturen. `v` endres når logoen endres, så ingen ser et gammelt bilde fra mellomlageret. */
export const signaturbildeUrl = (designId: string, bilde: 'logo' | 'merke', v: string) =>
  `https://vimzo.no/api/signatur/${encodeURIComponent(designId)}?bilde=${bilde}&v=${encodeURIComponent(v)}`

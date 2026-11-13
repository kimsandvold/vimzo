import { describe, expect, it } from 'vitest'
import { fakturablokk, slaSammen, somCsv, treffer, type ProfilMedId } from './kunder'
import type { Logobestilling } from './logobestillinger'

const profil: ProfilMedId = {
  id: 'u1',
  konto: { uid: 'u1', epost: 'kim@gmail.com', navn: 'Kim S' },
  person: { navn: 'Kim Sandvold', tittel: 'Daglig leder', telefon: '900 12 345', epost: 'kim@rubic.no' },
  bedrift: {
    orgnr: '923609016', navn: 'Rubic AS', formkode: 'AS', adresse: 'Torggata 5', postnr: '0181', poststed: 'Oslo',
    telefon: '', epost: '', nettside: '', kontonummer: '12345678903',
  },
  frister: null,
  fullfort: true,
  opprettet: 2000,
  oppdatert: 3000,
}

function ordre(endringer: Partial<Logobestilling>): Logobestilling {
  return {
    id: 'o', uid: 'u2', epost: 'ola@firma.no', produkt: 'logo', pris: 490, oppgraderer: null,
    bedrift: 'Olas Firma', orgnr: '912345678', adresse: 'Gata 1', postnr: '5000', poststed: 'Bergen',
    navn: 'Ola Nordmann', telefon: '400 00 000', merknad: '', design: '', vilkar: '', status: 'levert',
    opprettet: 1000, oppdatert: 1000,
    ...endringer,
  }
}

describe('slaSammen', () => {
  it('profilen vinner, og kontaktadressen vises når den er en annen enn kontoens', () => {
    const [k] = slaSammen([profil], [])
    expect(k.navn).toBe('Kim Sandvold')
    expect(k.bedrift).toBe('Rubic AS')
    expect(k.epost).toBe('kim@gmail.com')
    expect(k.kontaktEpost).toBe('kim@rubic.no')
    expect(k.kontonummer).toBe('12345678903')
  })

  it('kunde som bare har bestilt, får alt fra bestillingen', () => {
    const [k] = slaSammen([], [ordre({})])
    expect(k.uid).toBe('u2')
    expect(k.profil).toBeNull()
    expect(k.navn).toBe('Ola Nordmann')
    expect(k.orgnr).toBe('912345678')
    expect(k.epost).toBe('ola@firma.no')
    expect(k.registrert).toBe(1000)
  })

  it('fyller hull i profilen fra bestillingen, og summerer uten kansellerte', () => {
    const tom: ProfilMedId = { ...profil, id: 'u2', bedrift: null, person: { navn: '', tittel: '', telefon: '', epost: '' }, konto: null }
    const [k] = slaSammen([tom], [ordre({ pris: 490 }), ordre({ id: 'o2', pris: 990, status: 'kansellert' })])
    expect(k.navn).toBe('Ola Nordmann')
    expect(k.bedrift).toBe('Olas Firma')
    expect(k.omsetning).toBe(490)
    expect(k.bestillinger).toHaveLength(2)
    expect(k.registrert).toBe(1000)
  })

  it('nyeste kunde først', () => {
    const liste = slaSammen([profil], [ordre({})])
    expect(liste.map((k) => k.uid)).toEqual(['u1', 'u2'])
  })
})

describe('søk og eksport', () => {
  const [k] = slaSammen([profil], [])

  it('søker i tekst og siffer', () => {
    expect(treffer(k, 'rubic')).toBe(true)
    expect(treffer(k, '923 609')).toBe(true)
    expect(treffer(k, '90012')).toBe(true)
    expect(treffer(k, 'bergen')).toBe(false)
  })

  it('fakturablokken har det regnskapet trenger', () => {
    expect(fakturablokk(k)).toBe('Rubic AS\nOrg.nr. 923609016\nTorggata 5\n0181 Oslo\nAtt: Kim Sandvold\nkim@gmail.com\n900 12 345')
  })

  it('CSV med semikolon og BOM, og felt med semikolon i anførselstegn', () => {
    const csv = somCsv([{ ...k, navn: 'Kim; S' }])
    expect(csv.startsWith('﻿Navn;Bedrift')).toBe(true)
    expect(csv).toContain('"Kim; S";Rubic AS;923609016')
  })
})

import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export interface AdminKontekst {
  bruker: User
  loggUt: () => void
}

export const Kontekst = createContext<AdminKontekst | null>(null)

export function useAdmin(): AdminKontekst {
  const k = useContext(Kontekst)
  if (!k) throw new Error('useAdmin brukes utenfor <AdminRamme>')
  return k
}

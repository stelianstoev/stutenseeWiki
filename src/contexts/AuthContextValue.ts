import { createContext } from 'react'
import type { Neighbor } from '../types'

export interface AuthContextValue {
  neighbor: Neighbor | null
  loading: boolean
  signIn: (displayName: string) => Promise<string | null>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

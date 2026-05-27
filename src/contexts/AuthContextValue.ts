import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Neighbor } from '../types'

export interface AuthContextValue {
  user: User | null
  neighbor: Neighbor | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

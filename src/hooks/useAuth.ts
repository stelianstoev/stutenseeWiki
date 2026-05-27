import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContextValue'
import type { AuthContextValue } from '../contexts/AuthContextValue'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

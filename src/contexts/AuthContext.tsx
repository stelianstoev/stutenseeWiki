import { useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Neighbor } from '../types'
import { AuthContext } from './AuthContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [neighbor, setNeighbor] = useState<Neighbor | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNeighbor = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('neighbors')
      .select('*')
      .eq('id', userId)
      .single()
    setNeighbor(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchNeighbor(u.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchNeighbor(u.id)
      else {
        setNeighbor(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchNeighbor])

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signUp(email: string, password: string, displayName: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (!data.user) return 'Signup failed'

    const { error: profileError } = await supabase
      .from('neighbors')
      .insert({ id: data.user.id, display_name: displayName })
    return profileError?.message ?? null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setNeighbor(null)
  }

  return (
    <AuthContext.Provider value={{ user, neighbor, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

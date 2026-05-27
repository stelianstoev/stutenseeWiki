import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Neighbor } from '../types'
import { AuthContext } from './AuthContextValue'

const STORAGE_KEY = 'sw_neighbor_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [neighbor, setNeighbor] = useState<Neighbor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)

    async function init() {
      if (!savedId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('neighbors')
        .select('*')
        .eq('id', savedId)
        .single()

      if (error || !data) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        setNeighbor(data)
      }
      setLoading(false)
    }

    init()
  }, [])

  async function signIn(displayName: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from('neighbors')
      .select('*')
      .eq('display_name', displayName)
      .maybeSingle()

    if (existing) {
      localStorage.setItem(STORAGE_KEY, existing.id)
      setNeighbor(existing)
      return null
    }

    const { data, error } = await supabase
      .from('neighbors')
      .insert({ display_name: displayName })
      .select()
      .single()

    if (error) return error.message
    if (!data) return 'Failed to create profile'

    localStorage.setItem(STORAGE_KEY, data.id)
    setNeighbor(data)
    return null
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setNeighbor(null)
  }

  return (
    <AuthContext.Provider value={{ neighbor, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

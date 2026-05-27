import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (data) setCategories(buildTree(data))
      setLoading(false)
    }
    fetch()
  }, [version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  return { categories, loading, refresh }
}

function buildTree(items: Category[]): Category[] {
  const map = new Map<string, Category>()
  const roots: Category[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

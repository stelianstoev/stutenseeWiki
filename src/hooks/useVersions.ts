import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ArticleVersion } from '../types'

export function useVersions(slug: string) {
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVersions() {
      const { data: article } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!article) {
        setLoading(false)
        return
      }

      const { data: versionData } = await supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', article.id)
        .order('created_at', { ascending: false })

      if (!versionData) {
        setLoading(false)
        return
      }

      const withAuthors = await Promise.all(
        versionData.map(async (v) => {
          const { data: author } = await supabase
            .from('neighbors')
            .select('display_name')
            .eq('id', v.created_by)
            .single()

          return { ...v, author: author ?? undefined } as unknown as ArticleVersion
        })
      )

      setVersions(withAuthors)
      setLoading(false)
    }

    fetchVersions()
  }, [slug])

  return { versions, loading }
}

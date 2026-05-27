import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ArticleVersion } from '../types'

export function useVersions(articleId: string) {
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('article_versions')
      .select(`
        *,
        author:neighbors!article_versions_created_by_fkey(display_name)
      `)
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVersions(data as unknown as ArticleVersion[])
        setLoading(false)
      })
  }, [articleId])

  return { versions, loading }
}

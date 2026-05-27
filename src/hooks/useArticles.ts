import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Article } from '../types'

export function useArticles(searchQuery?: string) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)

      let query = supabase
        .from('articles')
        .select(`
          *,
          author:neighbors!articles_created_by_fkey(display_name),
          categories:article_categories(
            category:categories(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }

      const { data } = await query

      if (data) {
        setArticles(data as unknown as Article[])
      }
      setLoading(false)
    }

    fetchArticles()
  }, [searchQuery])

  return { articles, loading }
}

export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('articles')
      .select(`
        *,
        author:neighbors!articles_created_by_fkey(display_name),
        categories:article_categories(
          category:categories(*)
        )
      `)
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setArticle(data as unknown as Article)
        setLoading(false)
      })
  }, [slug])

  return { article, loading }
}

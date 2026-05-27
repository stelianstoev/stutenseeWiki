import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Article, Category } from '../types'

export function useArticles(searchQuery?: string) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true)

      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }

      const { data: articleData } = await query

      if (!articleData) {
        setLoading(false)
        return
      }

      const articlesWithDetails = await Promise.all(
        articleData.map(async (article) => {
          const { data: author } = await supabase
            .from('neighbors')
            .select('display_name')
            .eq('id', article.created_by)
            .single()

          const { data: catLinks } = await supabase
            .from('article_categories')
            .select('category_id')
            .eq('article_id', article.id)

          let categories: { category: Category }[] = []
          if (catLinks && catLinks.length > 0) {
            const ids = catLinks.map((c: { category_id: string }) => c.category_id)
            const { data: cats } = await supabase
              .from('categories')
              .select('*')
              .in('id', ids)

            if (cats) {
              categories = cats.map((c) => ({ category: c }))
            }
          }

          return {
            ...article,
            author: author ?? undefined,
            categories,
          } as unknown as Article
        })
      )

      setArticles(articlesWithDetails)
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
    async function fetchArticle() {
      const { data: articleData } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!articleData) {
        setLoading(false)
        return
      }

      const { data: author } = await supabase
        .from('neighbors')
        .select('display_name')
        .eq('id', articleData.created_by)
        .single()

      const { data: catLinks } = await supabase
        .from('article_categories')
        .select('category_id')
        .eq('article_id', articleData.id)

      let categories: { category: Category }[] = []
      if (catLinks && catLinks.length > 0) {
        const ids = catLinks.map((c: { category_id: string }) => c.category_id)
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .in('id', ids)

        if (cats) {
          categories = cats.map((c) => ({ category: c }))
        }
      }

      setArticle({
        ...articleData,
        author: author ?? undefined,
        categories,
      } as unknown as Article)
      setLoading(false)
    }

    fetchArticle()
  }, [slug])

  return { article, loading }
}

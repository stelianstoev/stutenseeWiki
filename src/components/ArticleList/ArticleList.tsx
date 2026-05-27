import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useArticles } from '../../hooks/useArticles'
import type { Neighbor } from '../../types'

export function ArticleList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [neighbors, setNeighbors] = useState<Neighbor[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { articles, loading } = useArticles(debouncedSearch, authorFilter)

  useEffect(() => {
    supabase
      .from('neighbors')
      .select('id, display_name')
      .order('display_name')
      .then(({ data }) => {
        if (data) setNeighbors(data as Neighbor[])
      })
  }, [])

  function handleSearch(value: string) {
    setSearch(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(value), 400)
  }

  return (
    <div className="article-list">
      <div className="list-toolbar">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        >
          <option value="">All authors</option>
          {neighbors.map((n) => (
            <option key={n.id} value={n.id}>{n.display_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <p>No articles yet.</p>
          <a href="/new" className="btn-primary">Write the first one</a>
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <a href={`/article/${article.slug}`} key={article.id} className="article-card">
              <h2>{article.title}</h2>
              <div className="article-meta">
                {article.author && (
                  <span className="author">by {article.author.display_name}</span>
                )}
                <time dateTime={article.created_at}>
                  {new Date(article.created_at).toLocaleDateString()}
                </time>
              </div>
              {article.categories && article.categories.length > 0 && (
                <div className="article-categories">
                  {article.categories.map((ac) => (
                    <span key={ac.category.id} className="badge">
                      {ac.category.name}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

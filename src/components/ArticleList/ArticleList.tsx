import { useState, useCallback } from 'react'
import { useArticles } from '../../hooks/useArticles'

export function ArticleList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { articles, loading } = useArticles(debouncedSearch)

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    const timer = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="article-list">
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
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

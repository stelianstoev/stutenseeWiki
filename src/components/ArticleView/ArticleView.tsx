import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useArticle } from '../../hooks/useArticles'
import { deleteUnusedImages } from '../../lib/imageUtils'
import type { Article } from '../../types'

export function ArticleView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { article, loading } = useArticle(slug!)
  const [deleting, setDeleting] = useState(false)

  if (loading) return <p className="loading">Loading...</p>
  if (!article) return <p className="error">Article not found.</p>

  return <ArticleViewInner article={article} deleting={deleting} setDeleting={setDeleting} navigate={navigate} />
}

function ArticleViewInner({
  article,
  deleting,
  setDeleting,
  navigate,
}: {
  article: Article
  deleting: boolean
  setDeleting: (v: boolean) => void
  navigate: (path: string) => void
}) {
  async function handleDelete() {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteUnusedImages(article.id)
    await supabase.from('articles').delete().eq('id', article.id)
    navigate('/')
  }

  return (
    <article className="article-view">
      <div className="article-header">
        <h1>{article.title}</h1>
        <div className="article-meta">
          {article.author && (
            <span>by {article.author.display_name}</span>
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
      </div>

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="article-footer">
        <Link to={`/article/${article.slug}/edit`} className="btn-secondary">
          Edit
        </Link>
        <Link to={`/article/${article.slug}/history`} className="btn-ghost">
          Version history
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-ghost"
          style={{ marginLeft: 'auto' }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

import { useParams, Link } from 'react-router-dom'
import { useArticle } from '../../hooks/useArticles'

export function ArticleView() {
  const { slug } = useParams<{ slug: string }>()
  const { article, loading } = useArticle(slug!)

  if (loading) return <p className="loading">Loading...</p>
  if (!article) return <p className="error">Article not found.</p>

  return (
    <article className="article-view">
      <div className="article-header">
        <h1>{article.title}</h1>
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
      </div>

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="article-actions">
        <Link to={`/article/${article.slug}/edit`} className="btn-secondary">
          Edit
        </Link>
        <Link to={`/article/${article.slug}/history`} className="btn-ghost">
          Version history
        </Link>
      </div>
    </article>
  )
}

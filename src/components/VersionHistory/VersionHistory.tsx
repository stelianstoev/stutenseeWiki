import { useParams, Link } from 'react-router-dom'
import { useVersions } from '../../hooks/useVersions'

export function VersionHistory() {
  const { slug } = useParams<{ slug: string }>()
  const { versions, loading } = useVersions(slug!)

  if (loading) return <p className="loading">Loading...</p>

  return (
    <div className="version-history">
      <h1>Version History</h1>
      <Link to={`/article/${slug}`} className="btn-ghost">&larr; Back to article</Link>

      {versions.length === 0 ? (
        <p>No previous versions.</p>
      ) : (
        <ul className="versions-list">
          {versions.map((version, index) => (
            <li key={version.id} className="version-item">
              <div className="version-meta">
                <span className="version-number">v{versions.length - index}</span>
                {version.author && (
                  <span className="author">by {version.author.display_name}</span>
                )}
                <time dateTime={version.created_at}>
                  {new Date(version.created_at).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

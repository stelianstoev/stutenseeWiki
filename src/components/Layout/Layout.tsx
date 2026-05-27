import { useAuth } from '../../hooks/useAuth'
import { useCategories } from '../../hooks/useCategories'
import type { Category } from '../../types'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { neighbor, signOut } = useAuth()
  const { categories } = useCategories()

  return (
    <div className="app-layout">
      <header className="app-header">
        <a href="/" className="logo">Stutensee Wiki</a>
        <div className="header-right">
          {neighbor && (
            <span className="display-name">{neighbor.display_name}</span>
          )}
          <button onClick={signOut} className="btn-ghost">Sign out</button>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <a href="/" className="nav-link">All articles</a>
          <div className="sidebar-section">
            <h3>Categories</h3>
            <CategoryList items={categories} />
          </div>
        </nav>
        <a href="/new" className="btn-primary">+ New article</a>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

function CategoryList({ items }: { items: Category[] }) {
  if (items.length === 0) return <p className="empty-hint">No categories yet</p>

  return (
    <ul className="category-tree">
      {items.map((cat) => (
        <li key={cat.id}>
          <a href={`/?category=${cat.slug}`} className="nav-link">
            {cat.name}
          </a>
          {cat.children && cat.children.length > 0 && (
            <CategoryList items={cat.children} />
          )}
        </li>
      ))}
    </ul>
  )
}

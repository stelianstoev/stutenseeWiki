import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCategories } from '../../hooks/useCategories'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { neighbor, signOut } = useAuth()
  const { categories, loading, refresh } = useCategories()
  const location = useLocation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleDelete(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    setEditingId(null)
    refresh()
  }

  async function handleRename(id: string, name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    await supabase.from('categories').update({ name, slug }).eq('id', id)
    setEditingId(null)
    refresh()
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <a href="/" className="logo">Stutensee Wiki</a>
        <div className="header-right">
          {neighbor && (
            <span className="display-name">{neighbor.display_name}</span>
          )}
          <button onClick={signOut} className="btn-ghost">Sign out</button>
        </div>
      </header>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <nav onClick={(e) => { const target = (e.target as HTMLElement).closest('a'); if (target) setMenuOpen(false) }}>
          <a href="/" className="nav-link">All articles</a>
          <div className="sidebar-section">
            <h3>Categories</h3>
            {loading ? (
              <p className="empty-hint">Loading...</p>
            ) : (
              <CategoryList
                items={categories}
                editingId={editingId}
                onStartEdit={setEditingId}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            )}
          </div>
        </nav>
        <a href="/new" className="btn-primary" onClick={() => setMenuOpen(false)}>+ New article</a>
      </aside>

      <main className="main-content">
        {children}
      </main>

      {location.pathname !== '/new' && (
        <a href="/new" className="fab" onClick={() => setMenuOpen(false)}>+</a>
      )}
    </div>
  )
}

function CategoryList({
  items,
  editingId,
  onStartEdit,
  onRename,
  onDelete,
}: {
  items: Category[]
  editingId: string | null
  onStartEdit: (id: string | null) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) return <p className="empty-hint">No categories yet</p>

  return (
    <ul className="category-tree">
      {items.map((cat) => (
        <li key={cat.id}>
          {editingId === cat.id ? (
            <CategoryEditForm
              category={cat}
              onSave={(name) => onRename(cat.id, name)}
              onDelete={() => onDelete(cat.id)}
              onCancel={() => onStartEdit(null)}
            />
          ) : (
            <div className="category-row">
              <a href={`/?category=${cat.slug}`} className="nav-link">
                {cat.name}
              </a>
              <button
                className="btn-icon"
                onClick={() => onStartEdit(cat.id)}
                title="Edit category"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
          {cat.children && cat.children.length > 0 && (
            <CategoryList
              items={cat.children}
              editingId={editingId}
              onStartEdit={onStartEdit}
              onRename={onRename}
              onDelete={onDelete}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

function CategoryEditForm({
  category,
  onSave,
  onDelete,
  onCancel,
}: {
  category: Category
  onSave: (name: string) => void
  onDelete: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(category.name)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="category-edit-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="form-actions">
        <button type="submit" className="btn-primary btn-small">Save</button>
        <button type="button" className="btn-ghost btn-small" onClick={onDelete}>Delete</button>
        <button type="button" className="btn-ghost btn-small" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

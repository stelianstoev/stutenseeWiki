import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types'

interface CategoryTreeProps {
  selectedIds: string[]
  onToggle: (categoryId: string) => void
}

export function CategoryTree({ selectedIds, onToggle }: CategoryTreeProps) {
  const { categories, loading, refresh } = useCategories()
  const { neighbor } = useAuth()
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParent, setNewParent] = useState('')
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !neighbor) return

    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { error: insertError } = await supabase
      .from('categories')
      .insert({
        name: newName.trim(),
        slug,
        parent_id: newParent || null,
        created_by: neighbor.id,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setNewName('')
      setShowNewForm(false)
      setError('')
      refresh()
    }
  }

  return (
    <div className="category-tree-picker">
      <h3>Categories</h3>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <ul className="category-picker-list">
          {categories.map((cat) => (
            <CategoryPickerItem
              key={cat.id}
              category={cat}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}

      {showNewForm && (
        <form onSubmit={handleCreate} className="new-category-form">
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <select
            value={newParent}
            onChange={(e) => setNewParent(e.target.value)}
          >
            <option value="">No parent (top-level)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-small">Create</button>
            <button type="button" className="btn-ghost btn-small" onClick={() => setShowNewForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showNewForm && (
        <button className="btn-ghost btn-small" onClick={() => setShowNewForm(true)}>
          + New category
        </button>
      )}
    </div>
  )
}

function CategoryPickerItem({
  category,
  selectedIds,
  onToggle,
}: {
  category: Category
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  const isSelected = selectedIds.includes(category.id)

  return (
    <li>
      <label className="category-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(category.id)}
        />
        {category.name}
      </label>
      {category.children && category.children.length > 0 && (
        <ul className="category-picker-list">
          {category.children.map((child) => (
            <CategoryPickerItem
              key={child.id}
              category={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

import { useState, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { CategoryTree } from '../CategoryTree/CategoryTree'
import type { Article } from '../../types'

interface ArticleEditorProps {
  article?: Article
  onSaved: () => void
}

export function ArticleEditor({ article, onSaved }: ArticleEditorProps) {
  const { neighbor } = useAuth()
  const [title, setTitle] = useState(article?.title ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => article?.categories?.map((ac) => ac.category.id) ?? []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder: 'Write your knowledge here...' }),
    ],
    content: article?.content ?? '<p></p>',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !neighbor) return

    const ext = file.name.split('.').pop()
    const filePath = `${neighbor.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('article-photos')
      .upload(filePath, file)

    if (uploadError) {
      setError('Failed to upload image')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('article-photos')
      .getPublicUrl(filePath)

    editor?.chain().focus().setImage({ src: publicUrl }).run()
  }, [editor, neighbor])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!editor) return

    setSaving(true)
    setError('')

    const content = editor.getHTML()
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let articleId: string | undefined = article?.id

    if (article) {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ title, slug, content, updated_at: new Date().toISOString() })
        .eq('id', article.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert({ title, slug, content, created_by: neighbor!.id })
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
      articleId = data.id
    }

    if (articleId) {
      await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', articleId)

      if (selectedCategoryIds.length > 0) {
        const rows = selectedCategoryIds.map((categoryId) => ({
          article_id: articleId!,
          category_id: categoryId,
        }))
        await supabase.from('article_categories').insert(rows)
      }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="article-editor">
      <input
        type="text"
        className="title-input"
        placeholder="Article title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'is-active' : ''}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'is-active' : ''}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'is-active' : ''}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      <EditorContent editor={editor} />

      <CategoryTree
        selectedIds={selectedCategoryIds}
        onToggle={toggleCategory}
      />

      {error && <p className="error">{error}</p>}

      <div className="editor-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : article ? 'Update article' : 'Publish article'}
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Article } from './types'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { InviteGate } from './components/InviteGate/InviteGate'
import { Layout } from './components/Layout/Layout'
import { ArticleList } from './components/ArticleList/ArticleList'
import { ArticleView } from './components/ArticleView/ArticleView'
import { ArticleEditor } from './components/ArticleEditor/ArticleEditor'
import { VersionHistory } from './components/VersionHistory/VersionHistory'
import './styles/index.css'

function AppShell() {
  const { neighbor, loading } = useAuth()

  if (loading) return <p className="loading">Loading...</p>

  if (!neighbor) {
    return <InviteGate />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout><ArticleList /></Layout>
        } />
        <Route path="/new" element={
          <Layout><NewArticlePage /></Layout>
        } />
        <Route path="/article/:slug" element={
          <Layout><ArticleView /></Layout>
        } />
        <Route path="/article/:slug/edit" element={
          <Layout><EditArticlePage /></Layout>
        } />
        <Route path="/article/:slug/history" element={
          <Layout><VersionHistory /></Layout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function NewArticlePage() {
  const navigate = useNavigate()
  return <ArticleEditor onSaved={() => navigate('/')} />
}

function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setArticle(data as unknown as Article)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <p className="loading">Loading...</p>
  if (!article) return <p className="error">Article not found.</p>

  return <ArticleEditor article={article} onSaved={() => navigate(`/article/${slug}`)} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

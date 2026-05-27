import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
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
  const { user, loading } = useAuth()
  const [inviteVerified, setInviteVerified] = useState(false)

  if (loading) return <p className="loading">Loading...</p>

  if (!user && !inviteVerified) {
    return <InviteGate onVerified={() => setInviteVerified(true)} />
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
  const navigate = useNavigate()
  const { slug } = { slug: window.location.pathname.split('/')[2] }
  return <ArticleEditor onSaved={() => navigate(`/article/${slug}`)} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

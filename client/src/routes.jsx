import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Sidebar } from './components/Sidebar'
import { ChatWidget } from './components/ChatWidget'

import Home     from './pages/Home'
import Login    from './pages/Auth/Login'
import Signup   from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard'
import Colleges  from './pages/Colleges'
import Decision  from './pages/Decision'
import Profile   from './pages/Profile'
import Chat      from './pages/Chat'
import Community from './pages/Community'

/* ─── Loading screen ─────────────────────────────────────────────────────── */
function LoadingScreen({ label = 'Loading NavGuide…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10" style={{ color: 'var(--c-teal)' }}
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-600 text-gray-500">{label}</span>
      </div>
    </div>
  )
}

/* ─── Authenticated layout ──────────────────────────────────────────────── */
function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative z-10" style={{ background: 'var(--c-bg)' }}>
      <Sidebar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-6">
        {children}
      </main>
      <footer className="w-full text-center py-4 text-xs text-gray-400 border-t bg-white"
        style={{ borderColor: 'var(--c-border)' }}>
        © {new Date().getFullYear()} NavGuide AI · Your Intelligent Academic Mentor
      </footer>
      <ChatWidget />
    </div>
  )
}

/* ─── Guards ─────────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen label="Restoring session…" />
  return isAuthenticated ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-screen flex flex-col relative z-10 auth-page" style={{ background: 'var(--c-bg)' }}>
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        {children}
      </main>
      <footer className="text-center py-4 text-xs text-gray-400 border-t bg-white"
        style={{ borderColor: 'var(--c-border)' }}>
        © {new Date().getFullYear()} NavGuide AI. Empowering educational journeys.
      </footer>
    </div>
  )
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/colleges"  element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
      <Route path="/decision"  element={<ProtectedRoute><Decision /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes

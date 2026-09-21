import { useState, useEffect } from 'react'
import { DataProvider, useNiyantraData } from './store/DataContext.jsx'
import { TranslationProvider } from './store/TranslationContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import Overview from './pages/Overview.jsx'
import PriorityQueue from './pages/PriorityQueue.jsx'
import BlockCalendar from './pages/BlockCalendar.jsx'
import ConflictResolution from './pages/ConflictResolution.jsx'
import WhatIfSimulator from './pages/WhatIfSimulator.jsx'
import ReportsAnalytics from './pages/ReportsAnalytics.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'

function Shell({ userContext, onLogout }) {
  const [page, setPage] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { bootLoading, error } = useNiyantraData()

  useEffect(() => {
    if (page === 'conflicts' && userContext.role !== 'DRM') {
      setPage('overview')
    }
  }, [page, userContext.role, setPage])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B1120] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-white dark:from-indigo-900/20 dark:via-[#0B1120] dark:to-black overflow-hidden font-sans transition-colors">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - responsive */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}>
        <Sidebar 
          page={page} 
          setPage={(p) => { setPage(p); setMobileMenuOpen(false); }} 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          userContext={userContext}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar 
          setPage={setPage} 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors">
          {bootLoading && <p className="text-sm font-bold text-slate-500 animate-pulse">Loading command center…</p>}
          {error && <p className="mb-3 text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}
          {!bootLoading && (
            <>
              {page === 'overview' && <Overview setPage={setPage} userContext={userContext} />}
              {page === 'priority' && <PriorityQueue />}
              {page === 'calendar' && <BlockCalendar userContext={userContext} />}
              {page === 'conflicts' && userContext?.role === 'DRM' && <ConflictResolution />}
              {page === 'simulator' && <WhatIfSimulator />}
              {page === 'reports' && <ReportsAnalytics />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [viewState, setViewState] = useState('landing') // 'landing' | 'login' | 'app'
  const [userContext, setUserContext] = useState(null) // { role, department, name }

  const handleLoginSuccess = (user) => {
    setUserContext(user)
    setViewState('app')
  }

  const handleLogout = () => {
    setUserContext(null)
    setViewState('landing')
  }

  return (
    <TranslationProvider>
      {viewState === 'landing' && (
        <Landing onNavigateLogin={() => setViewState('login')} />
      )}
      {viewState === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onBackToLanding={() => setViewState('landing')} 
        />
      )}
      {viewState === 'app' && userContext && (
        <DataProvider userContext={userContext}>
          <Shell userContext={userContext} onLogout={handleLogout} />
        </DataProvider>
      )}
    </TranslationProvider>
  )
}

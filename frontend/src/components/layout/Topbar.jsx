import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Bell, LogOut, AlertTriangle, ClipboardCheck, GitPullRequestArrow, Menu } from 'lucide-react'
import { useNiyantraData } from '../../store/DataContext.jsx'
import { useTranslation } from '../../store/TranslationContext.jsx'

function NotificationPanel({ onClose, onNavigate }) {
  const { rankedTasks, blocks, unscheduledTaskIds } = useNiyantraData()
  const critical = rankedTasks.filter((t) => t.severity === 'critical').slice(0, 4)
  const pendingBlocks = blocks.filter((b) => b.status === 'pending').length
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 sm:right-0 sm:top-12 top-12 z-50 w-[calc(100vw-32px)] max-w-sm sm:w-96 border border-white/60 dark:border-white/15 bg-white/85 dark:bg-[#0F172A]/90 backdrop-blur-2xl p-3 shadow-[0_16px_48px_rgba(0,0,0,0.15)] rounded-2xl animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        onClick={() => { onNavigate('calendar'); onClose() }}
        className="focus-ring flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <ClipboardCheck size={16} className="text-gold-dark" />
          Approval requests
        </span>
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-300">{pendingBlocks}</span>
      </button>

      <button
        onClick={() => { onNavigate('conflicts'); onClose() }}
        className="focus-ring flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <GitPullRequestArrow size={16} className="text-dept-trd" />
          Conflict / capacity alerts
        </span>
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-300">{unscheduledTaskIds.length}</span>
      </button>

      <div className="my-2 border-t border-slate-200/50 dark:border-white/10" />

      <button
        onClick={() => { onNavigate('priority'); onClose() }}
        className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors"
      >
        <AlertTriangle size={16} className="text-severity-critical" />
        SLA breach warnings
      </button>
      {critical.length === 0 && (
        <p className="px-3 py-3 text-sm font-medium text-slate-400">No critical severity items right now.</p>
      )}
      <div className="flex flex-col gap-1">
        {critical.map((t) => (
          <button
            key={t.task_id}
            onClick={() => { onNavigate('priority'); onClose() }}
            className="rounded-xl px-3 py-2.5 text-left hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="font-mono text-slate-500 dark:text-slate-400">{t.task_id}</span>
              <span className="rounded-full bg-severity-criticalBg px-2 py-0.5 font-bold text-severity-critical">
                critical
              </span>
            </div>
            <p className="mt-0.5 text-sm capitalize font-semibold text-slate-900 dark:text-white">{t.defect_type.replaceAll('_', ' ')}</p>
            <p className="text-xs text-slate-400 font-medium">{t.section} · {t.overdue_days}d overdue</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Topbar({ setPage, onToggleMobileMenu, onLogout }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { rankedTasks, blocks, unscheduledTaskIds } = useNiyantraData()
  const { toggleLanguage, t } = useTranslation()

  // Toggle Dark Mode on HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const alertCount =
    rankedTasks.filter((t) => t.severity === 'critical').length +
    blocks.filter((b) => b.status === 'pending').length +
    unscheduledTaskIds.length

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-white/70 dark:bg-[#0F172A]/75 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60 dark:border-white/10 px-4 md:px-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 rounded-xl text-slate-700 dark:text-white hover:bg-white/50 dark:hover:bg-white/10 transition" onClick={onToggleMobileMenu}>
          <Menu size={24} />
        </button>
        <h1 className="font-serif text-2xl font-black text-indigo-900 dark:text-amber-400 tracking-widest hidden sm:block drop-shadow-sm">{t('topbar.title')}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
          className="focus-ring rounded-xl p-2.5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-700 dark:text-white shadow-sm transition-all duration-200"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={toggleLanguage}
          title="Translate"
          className="focus-ring rounded-xl px-3 py-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-white shadow-sm transition-all duration-200 font-bold text-sm"
        >
          A/अ
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
            className="focus-ring relative rounded-xl p-2.5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-700 dark:text-white shadow-sm transition-all duration-200"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-severity-critical text-[10px] font-black text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                {alertCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel onClose={() => setNotifOpen(false)} onNavigate={setPage} />
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-300/60 dark:bg-white/20 hidden sm:block"></div>
        
        <button
          onClick={onLogout}
          title="Logout"
          className="focus-ring flex items-center gap-2 rounded-xl px-3.5 py-2 bg-white/50 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/20 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-700 hover:text-red-600 dark:text-white/90 dark:hover:text-red-400 shadow-sm transition-all duration-200 font-semibold"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline-block text-sm font-bold">Logout</span>
        </button>
      </div>
    </header>
  )
}

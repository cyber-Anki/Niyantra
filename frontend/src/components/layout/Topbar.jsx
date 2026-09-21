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
      className="absolute right-0 sm:right-0 sm:top-11 top-11 z-20 w-[calc(100vw-32px)] max-w-sm sm:w-96 border border-slate-200/50 dark:border-white/10 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl p-3 shadow-2xl rounded-b-lg sm:rounded-2xl"
    >
      <button
        onClick={() => { onNavigate('calendar'); onClose() }}
        className="focus-ring flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm text-slate-900">
          <ClipboardCheck size={15} className="text-gold-dark" />
          Approval requests
        </span>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-slate-900">{pendingBlocks}</span>
      </button>

      <button
        onClick={() => { onNavigate('conflicts'); onClose() }}
        className="focus-ring flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm text-slate-900">
          <GitPullRequestArrow size={15} className="text-dept-trd" />
          Conflict / capacity alerts
        </span>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-slate-900">{unscheduledTaskIds.length}</span>
      </button>

      <div className="my-2 border-t border-slate-100" />

      <button
        onClick={() => { onNavigate('priority'); onClose() }}
        className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        <AlertTriangle size={15} className="text-severity-critical" />
        SLA breach warnings
      </button>
      {critical.length === 0 && (
        <p className="px-2 py-3 text-sm text-slate-400">No critical severity items right now.</p>
      )}
      <div className="flex flex-col gap-1">
        {critical.map((t) => (
          <button
            key={t.task_id}
            onClick={() => { onNavigate('priority'); onClose() }}
            className="rounded-lg px-2 py-2 text-left hover:bg-slate-50"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500">{t.task_id}</span>
              <span className="rounded-full bg-severity-criticalBg px-2 py-0.5 font-medium text-severity-critical">
                critical
              </span>
            </div>
            <p className="mt-0.5 text-sm capitalize text-slate-900">{t.defect_type.replaceAll('_', ' ')}</p>
            <p className="text-xs text-slate-400">{t.section} · {t.overdue_days}d overdue</p>
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
    <header className="flex h-16 shrink-0 items-center justify-between bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 px-4 md:px-6 transition-colors shadow-sm relative z-20">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white/80" onClick={onToggleMobileMenu}>
          <Menu size={24} />
        </button>
        <h1 className="font-serif text-xl font-black text-indigo-900 dark:text-white tracking-widest hidden sm:block drop-shadow-sm">{t('topbar.title')}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
          className="focus-ring rounded-xl p-2 text-slate-600 dark:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={toggleLanguage}
          title="Translate"
          className="focus-ring rounded-xl p-2 text-slate-600 dark:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition font-bold text-sm"
        >
          A/अ
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
            className="focus-ring relative rounded-xl p-2 text-slate-600 dark:text-white/80 hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-severity-critical text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {alertCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel onClose={() => setNotifOpen(false)} onNavigate={setPage} />
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-300 dark:bg-white/20 hidden sm:block"></div>
        
        <button
          onClick={onLogout}
          title="Logout"
          className="focus-ring flex items-center gap-2 rounded-xl p-2 text-slate-600 dark:text-white/80 hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline-block text-sm font-semibold">Logout</span>
        </button>
      </div>
    </header>
  )
}

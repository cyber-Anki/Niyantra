import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Sun,
  Bell,
  LogOut,
  AlertTriangle,
  ClipboardCheck,
  GitPullRequestArrow,
  Menu,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
} from 'lucide-react'
import { useNiyantraData } from '../../store/DataContext.jsx'
import { useTranslation } from '../../store/TranslationContext.jsx'

function NotificationPanel({ onClose, onNavigate, onMarkAllRead, isMarkedRead }) {
  const { rankedTasks, blocks, unscheduledTaskIds } = useNiyantraData()
  const critical = rankedTasks.filter((t) => t.severity === 'critical').slice(0, 4)
  const pendingBlocks = blocks.filter((b) => b.status === 'pending').length
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const totalUnread = isMarkedRead ? 0 : critical.length + pendingBlocks + unscheduledTaskIds.length

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute right-0 top-[calc(100%+12px)] z-50 w-[calc(100vw-32px)] max-w-sm sm:w-[420px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-[0_20px_50px_rgba(15,23,42,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      {/* Subtle pointer arrow aligned with bell icon */}
      <div className="absolute -top-1.5 right-3.5 h-3 w-3 rotate-45 border-t border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0F172A] z-10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
            <Bell size={15} />
          </div>
          <h2 className="font-serif text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h2>
          {totalUnread > 0 && (
            <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-300">
              {totalUnread} new
            </span>
          )}
        </div>
        <button
          onClick={onMarkAllRead}
          className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 dark:text-amber-400 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors"
        >
          <CheckCheck size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Notification Body */}
      <div className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
        {/* Category 1: Approval Requests */}
        <button
          onClick={() => {
            onNavigate('calendar')
            onClose()
          }}
          className="focus-ring group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Approval requests
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pending maintenance block clearances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              {pendingBlocks}
            </span>
            <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </div>
        </button>

        {/* Category 2: Conflict / Capacity Alerts */}
        <button
          onClick={() => {
            onNavigate('conflicts')
            onClose()
          }}
          className="focus-ring group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400">
              <GitPullRequestArrow size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                Conflict / capacity alerts
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Unscheduled tasks & corridor overlaps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
              {unscheduledTaskIds.length}
            </span>
            <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </div>
        </button>

        {/* Divider */}
        <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/80" />

        {/* Category 3: SLA Breach Warnings */}
        <button
          onClick={() => {
            onNavigate('priority')
            onClose()
          }}
          className="focus-ring group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200/70 dark:border-red-800/60 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                SLA breach warnings
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Overdue critical track defects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
              {critical.length}
            </span>
            <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">Niyantra Operational Alert Center</span>
        <button
          onClick={() => {
            onNavigate('priority')
            onClose()
          }}
          className="font-bold text-indigo-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
        >
          View all <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  )
}

export default function Topbar({ setPage, onToggleMobileMenu, onLogout }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMarkedRead, setIsMarkedRead] = useState(false)
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

  const alertCount = isMarkedRead
    ? 0
    : rankedTasks.filter((t) => t.severity === 'critical').length +
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
            className={`focus-ring relative rounded-xl p-2.5 transition-all duration-200 ${
              notifOpen
                ? 'bg-amber-500/15 dark:bg-amber-400/20 text-indigo-950 dark:text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-700 dark:text-white shadow-sm'
            }`}
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                {alertCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel
                onClose={() => setNotifOpen(false)}
                onNavigate={setPage}
                onMarkAllRead={() => setIsMarkedRead(true)}
                isMarkedRead={isMarkedRead}
              />
            )}
          </AnimatePresence>
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

